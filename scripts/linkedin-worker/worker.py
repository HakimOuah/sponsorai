"""Outbound-only LinkedIn worker. No inbound port, Monid key or messaging tools."""
import asyncio
import contextlib
import fcntl
import json
import os
from pathlib import Path
import sys
import time
import urllib.request
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from parser import company_identity, candidates, extract_profile, linkedin_url

CONFIG = json.loads(Path(sys.argv[1]).read_text())
BASE = CONFIG["baseUrl"]
if BASE != "https://vectis.agency":
    raise ValueError("Worker origin must be https://vectis.agency")

def command():
    prefix = ["-m", "linkedin_mcp_server"] if CONFIG.get("nativeRuntime") else ["--from", CONFIG["connectorPath"], "mcp-server-linkedin"]
    return prefix + ["--no-auto-import",
            "--user-data-dir", CONFIG["profilePath"], "--login-inline-wait", "0", "--tool-timeout", "35"]

def api(body):
    request = urllib.request.Request(BASE + "/api/worker/linkedin", data=json.dumps(body).encode(), headers={
        "Authorization": "Bearer " + CONFIG["token"], "Content-Type": "application/json"})
    # Never forward the worker token across redirects.
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *args, **kwargs): return None
    with urllib.request.build_opener(NoRedirect()).open(request, timeout=15) as response:
        return json.load(response)

async def healthy():
    process = await asyncio.create_subprocess_exec(CONFIG["uvxPath"], *command(), "--status", stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.DEVNULL)
    try:
        out, _ = await asyncio.wait_for(process.communicate(), 35)
        # A foreign-runtime bridge can only validate cookies on its first real
        # call. Treat it as provisionally available, with failure backoff below.
        return process.returncode == 0 and (b"Session is valid" in out or b"Source cookie validity is not verified" in out)
    except asyncio.TimeoutError:
        process.kill()
        await process.wait()
        return False

async def discover(job):
    empty = {"status": "unavailable", "profiles": [], "excludedProfiles": []}
    url = linkedin_url(job.get("companyUrl", ""), "company")
    if not url: return empty
    remaining = (job["expiresAt"] - time.time()*1000) / 1000 - 5
    if remaining < 10: return empty
    profiles, excluded = [], []
    failed = False
    browser_env = {key: os.environ[key] for key in ("DISPLAY", "PLAYWRIGHT_BROWSERS_PATH", "HEADLESS", "LOG_LEVEL", "LINKEDIN_TRACE_MODE") if key in os.environ}
    params = StdioServerParameters(command=CONFIG["uvxPath"], args=command() + ["--transport", "stdio"], env=browser_env)
    async with stdio_client(params, errlog=open(os.devnull, "w")) as (read, write):
        async with ClientSession(read, write) as session:
            await asyncio.wait_for(session.initialize(), min(15, remaining))
            async def call(tool, args):
                result = await session.call_tool(tool, args)
                if result.isError:
                    if "--probe" in sys.argv:
                        detail = " ".join(getattr(part, "text", "") for part in result.content).lower()
                        print(json.dumps({"event": "tool_failed", "tool": tool, "indicators": [s for s in ("login", "auth", "timeout", "permission", "display", "browser", "cookie", "session", "install", "lock", "challenge") if s in detail]}), file=sys.stderr)
                    raise RuntimeError("LinkedIn unavailable")
                return result.structuredContent or json.loads(result.content[0].text)
            try:
                async with asyncio.timeout(max(0.1, (job["expiresAt"] - time.time()*1000)/1000 - 5)):
                    company = await call("get_company_profile", {"company_name": url})
                    name, urn = company_identity(company)
                    if not name or not urn: return empty
                    people = await call("search_people", {"keywords": "marketing OR sponsorship OR partnerships OR influencer", "current_company": urn})
                    for profile_url in candidates(people):
                        if job["expiresAt"]/1000 - time.time() < 15: break
                        data = await call("get_person_profile", {"linkedin_username": profile_url, "sections": "experience", "max_scrolls": 1})
                        profile, exclusion = extract_profile(data, name, url, urn)
                        if profile: profiles.append(profile)
                        if exclusion: excluded.append(exclusion)
                        if len(profiles) >= 2: break
            except (TimeoutError, RuntimeError):
                failed = True
            finally:
                with contextlib.suppress(Exception):
                    await asyncio.wait_for(session.call_tool("close_session", {}), 5)
    return {"status": "success" if profiles else "unavailable" if failed else "empty", "profiles": profiles, "excludedProfiles": excluded}

async def main():
    # launchd and manual invocations cannot browse the same session concurrently.
    lock = open(Path(sys.argv[1]).with_suffix(".lock"), "w")
    try: fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError: return
    if len(sys.argv) > 2 and sys.argv[2] == "--probe":
        result = await discover({"companyUrl": sys.argv[3], "expiresAt": time.time()*1000+90_000})
        print(json.dumps(result, ensure_ascii=False))
        return
    ready, checked = False, 0
    while True:
        try:
            if time.time() - checked > 300:
                ready = await healthy()
                checked = time.time()
            response = await asyncio.to_thread(api, {"action": "poll", "ready": ready})
            job = response.get("job")
            if job:
                start = time.monotonic()
                try: result = await discover(job)
                except Exception:
                    result = {"status": "unavailable", "profiles": [], "excludedProfiles": []}
                if result["status"] == "unavailable":
                    ready, checked = False, time.time()
                await asyncio.to_thread(api, {"action": "complete", "id": job["id"], "claim": job["claim"], "result": result})
                print(json.dumps({"event": "completed", "profiles": len(result["profiles"]), "excluded": len(result["excludedProfiles"]), "seconds": round(time.monotonic()-start, 1)}), flush=True)
                continue
        except Exception as exc:
            print(json.dumps({"event": "unavailable", "kind": type(exc).__name__}), flush=True)
        await asyncio.sleep(15)

asyncio.run(main())
