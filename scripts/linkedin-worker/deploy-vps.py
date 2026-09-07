"""Install only /opt/vectis-linkedin on the authorized VPS; no public ports."""
import json
from pathlib import Path
import subprocess
import tempfile

base = Path.home()/"Library/Application Support/VectisLinkedIn"
key = str(Path.home()/".ssh/product_factory_codex_ed25519")
host = "root@148.230.118.152"
ssh = ["ssh", "-o", "BatchMode=yes", "-o", "IdentitiesOnly=yes", "-i", key, host]
scp = ["scp", "-q", "-i", key]
running = subprocess.check_output(ssh + ["docker inspect -f '{{.State.Running}}' vectis-linkedin-worker 2>/dev/null || true"], text=True).strip()
if running == "true":
    raise SystemExit("Stop the VPS worker before replacing its session; use scp for code-only updates.")
subprocess.run(ssh + ["install -d -m 700 /opt/vectis-linkedin/state /opt/vectis-linkedin/auth"], check=True)
for name in ["worker.py", "parser.py", "compose.yaml"]:
    subprocess.run(scp + [str(Path(__file__).parent/name), host+":/opt/vectis-linkedin/"+name], check=True)
# Transfer only the dedicated connector session, never a personal browser.
for name in ["cookies.json", "source-state.json"]:
    subprocess.run(scp + [str(base/"auth"/name), host+":/opt/vectis-linkedin/auth/"+name], check=True)
subprocess.run(scp + ["-r", str(base/"auth/profile"), host+":/opt/vectis-linkedin/auth/"], check=True)
config = json.loads((base/"config.json").read_text())
config.update(nativeRuntime=True, uvxPath="/app/.venv/bin/python", profilePath="/home/pwuser/.linkedin-mcp/profile")
config.pop("connectorPath", None)
with tempfile.NamedTemporaryFile(mode="w", suffix=".json") as temp:
    json.dump(config, temp)
    temp.flush()
    subprocess.run(scp + [temp.name, host+":/opt/vectis-linkedin/state/config.json"], check=True)
subprocess.run(ssh + ["chown -R 1000:1000 /opt/vectis-linkedin/state /opt/vectis-linkedin/auth; chmod 600 /opt/vectis-linkedin/state/config.json /opt/vectis-linkedin/auth/cookies.json /opt/vectis-linkedin/auth/source-state.json; chmod 644 /opt/vectis-linkedin/worker.py /opt/vectis-linkedin/parser.py"], check=True)
print("Installed. Validate session before starting the worker.")
