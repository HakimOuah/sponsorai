"""Send the generated worker token to Vercel through stdin, never argv/logs."""
import json
from pathlib import Path
import subprocess

config = json.loads((Path.home()/"Library/Application Support/VectisLinkedIn/config.json").read_text())
for key, value in [("LINKEDIN_WORKER_TOKEN", config["token"]), ("LINKEDIN_DIRECT_ENABLED", "true")]:
    command = ["npx", "--yes", "vercel@59.11.2", "env", "add", key, "production", "--scope", "hakims-projects-867be2eb"]
    if key.endswith("TOKEN"): command.append("--sensitive")
    completed = subprocess.run(command, input=value, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if completed.returncode:
        raise SystemExit(f"Could not configure {key}; inspect the Vercel variable status before retrying.")
    print(f"Configured {key} (value hidden)")
