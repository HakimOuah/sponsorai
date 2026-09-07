"""Conservative, source-bound extraction. No model calls and no inferred emails."""
import re
import time
import unicodedata
from urllib.parse import urlparse, unquote

ROLE = re.compile(r"sponsor|influenc|ambassador|ambassadeur|creator|brand|marque|marketing|communication|partnership|partenariat", re.I)
CURRENT = re.compile(r"\b(present|current|heute|heden)\b|aujourd['’]hui|actualité", re.I)
EXCLUDED = re.compile(r"(?:do not|don't|not accepting|no)\s+(?:reach out.{0,30}|contact.{0,30}|request.{0,30})?sponsor|pas.{0,30}(?:contacter|solliciter).{0,30}sponsor", re.I)

def normalize(value):
    return re.sub(r"[^a-z0-9]+", "", unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower())

def linkedin_url(value, kind):
    if value.startswith("/"):
        value = "https://www.linkedin.com" + value
    parsed = urlparse(value)
    if parsed.hostname not in {"linkedin.com", "www.linkedin.com"} or parsed.scheme != "https":
        return None
    parts = parsed.path.strip("/").split("/")
    if len(parts) != 2 or parts[0] != kind or not parts[1] or len(parts[1]) > 200:
        return None
    return "https://www.linkedin.com/" + kind + "/" + parts[1]

def company_identity(data):
    about = data.get("sections", {}).get("about", "")
    name = next((line.strip() for line in about.splitlines() if line.strip()), "")
    urn = next((str(ref.get("value", "")) for ref in data.get("references", {}).get("about", []) if ref.get("kind") == "company_urn"), "")
    return name, urn if urn.isdigit() else None

def candidates(data):
    text = data.get("sections", {}).get("search_results", "")
    refs = data.get("references", {}).get("search_results", [])
    people = []
    for ref in refs:
        name = ref.get("text", "")
        url = linkedin_url(ref.get("url", ""), "in")
        if ref.get("kind") != "person" or not url or len(name.split()) < 2:
            continue
        match = re.search(re.escape(name) + r"\s*[•·]", text)
        if not match:  # LinkedIn also returns mutual connections as references.
            continue
        block = text[match.start():match.start()+500]
        if not ROLE.search(block):
            continue
        priority = 3 if re.search(r"sponsor|influenc|ambassador|creator", block, re.I) else 2 if re.search(r"brand|marque", block, re.I) else 1
        if url not in [p[1] for p in people]:
            people.append((priority, url))
    return [url for _, url in sorted(people, key=lambda p: -p[0])][:3]

def extract_profile(data, company_name, company_url, company_urn):
    main = data.get("sections", {}).get("main_profile", "")
    experience = data.get("sections", {}).get("experience", "")
    url = linkedin_url(data.get("url", ""), "in")
    name = next((line.strip() for line in main.splitlines() if line.strip()), "")
    personal = re.split(r"Plus de profils|More profiles|Explorer les profils", main)[0]
    if EXCLUDED.search(personal):
        return None, url
    if not url or len(name.split()) < 2 or re.search(r"\*|\.\.\.|\b[A-Z]\.$", name):
        return None, None
    refs = data.get("references", {}).get("experience", [])
    company_ids = {linkedin_url(ref.get("url", ""), "company") for ref in refs if ref.get("kind") == "company"}
    if "https://www.linkedin.com/company/" + company_urn not in company_ids:
        return None, None
    lines = [line.strip() for line in experience.splitlines() if line.strip()]
    for index, line in enumerate(lines[:50]):
        if not CURRENT.search(line):
            continue
        window = lines[max(0, index-6):index]
        # Do not borrow an employer label from the previous employment block.
        boundaries = [i for i, part in enumerate(window) if re.search(r"\b(?:19|20)\d{2}\s*[-–]", part)]
        if boundaries:
            window = window[boundaries[-1]+1:]
        if any(re.search(r"\b(stage|stagiaire|intern|internship|apprentice|alternance)\b", part, re.I) for part in window):
            continue
        # A current date, exact company label, relevant job title and company ID
        # must agree. Former experience alone cannot qualify the profile.
        if not any(normalize(part.split("·")[0]) == normalize(company_name) for part in window):
            continue
        roles = [part for part in window if ROLE.search(part) and normalize(part) != normalize(company_name)]
        if not roles:
            continue
        role = roles[-1]
        evidence = "LinkedIn, expérience actuelle : " + " | ".join(window + lines[index:index+3])
        return {"name": name[:160], "role": role[:240], "linkedin": url,
                "companyLinkedinUrl": company_url, "current": True,
                "evidence": evidence[:2000], "observedAt": int(time.time()*1000)}, None
    return None, None
