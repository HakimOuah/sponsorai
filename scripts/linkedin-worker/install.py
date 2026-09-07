"""Install the dedicated local worker; never imports browser cookies."""
import json
import os
from pathlib import Path
import plistlib
import secrets
import shutil
import subprocess
import sys

root = Path.home() / "Library/Application Support/VectisLinkedIn"
root.mkdir(parents=True, exist_ok=True, mode=0o700)
os.chmod(root, 0o700)
trial = Path(sys.argv[1]).resolve()
connector = trial / "linkedin-mcp-server"
commit = subprocess.check_output(["git", "-C", str(connector), "rev-parse", "HEAD"], text=True).strip()
if commit != "5448ab1fc2fcdf6e6e1bc1e4b166c81a5f5e7402":
    raise SystemExit("Unexpected connector revision")
if not (root / "connector").exists():
    shutil.copytree(connector, root / "connector")
if not (root / "auth").exists():
    shutil.copytree(trial / "auth", root / "auth")
for filename in ("worker.py", "parser.py"):
    shutil.copy2(Path(__file__).parent / filename, root / filename)
config = root / "config.json"
if not config.exists():
    data = {"baseUrl": "https://vectis.agency", "token": secrets.token_urlsafe(48),
            "connectorPath": str(root / "connector"), "profilePath": str(root / "auth/profile"),
            "uvxPath": str(Path.home() / ".local/bin/uvx")}
    config.write_text(json.dumps(data))
os.chmod(config, 0o600)
data = json.loads(config.read_text())
# Explicitly claim only this dedicated copied session, never a user's browser.
subprocess.run([data["uvxPath"], "--from", data["connectorPath"], "mcp-server-linkedin", "--no-auto-import",
                "--user-data-dir", data["profilePath"], "--claim-profile-root", "--status"], check=True)
plist = Path.home() / "Library/LaunchAgents/agency.vectis.linkedin.plist"
plist.parent.mkdir(exist_ok=True)
with plist.open("wb") as stream:
    plistlib.dump({"Label": "agency.vectis.linkedin", "ProgramArguments": [str(Path.home()/".local/bin/uv"),
        "run", "--with", "mcp==1.26.0", "python", str(root/"worker.py"), str(config)],
        "WorkingDirectory": str(root), "RunAtLoad": True, "KeepAlive": True, "ThrottleInterval": 30,
        "StandardOutPath": str(root/"worker.log"), "StandardErrorPath": str(root/"worker-error.log")}, stream)
print("Installed. Start launchd only after the production endpoint is deployed.")
