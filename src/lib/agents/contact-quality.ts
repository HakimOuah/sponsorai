export type EmailStatus = "verified" | "public_source" | "guessed" | "missing";

export function getCompanyDomain(website?: string | null): string | null {
  if (!website) return null;

  try {
    const withProtocol = website.startsWith("http") ? website : `https://${website}`;
    const hostname = new URL(withProtocol).hostname.replace(/^www\./, "");
    return hostname || null;
  } catch {
    return website
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .trim() || null;
  }
}

export function getContactRelevance(role?: string | null): number {
  const normalizedRole = (role || "").toLowerCase();
  const highSignal =
    /\b(partnerships?|sponsorship|sports marketing|brand partnerships?|strategic partnerships?|alliances?|community partnerships?|local marketing|field marketing|events?|csr|rse)\b/i;
  const goodSignal =
    /\b(marketing|brand|communications?|comms|pr|public relations|growth|influencer|creator|talent|community)\b/i;
  const weakSignal =
    /\b(ceo|chief executive|founder|co-founder|president|owner|general manager|operations|finance|hr|people|customer|sales associate|cashier|support|engineering|product|legal)\b/i;

  if (highSignal.test(normalizedRole)) return 3;
  if (goodSignal.test(normalizedRole) && !weakSignal.test(normalizedRole)) return 2;
  return 0;
}

export function getRoleRelevanceLabel(role?: string | null): "high" | "medium" | "low" {
  const score = getContactRelevance(role);
  if (score >= 3) return "high";
  if (score >= 2) return "medium";
  return "low";
}

export function isUsableEmailStatus(status?: string | null): boolean {
  return status === "verified" || status === "public_source";
}

export function isBusinessEmailForCompany(
  email?: string | null,
  companyDomain?: string | null
): boolean {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;

  const freeDomains = new Set([
    "gmail.com",
    "googlemail.com",
    "hotmail.com",
    "outlook.com",
    "live.com",
    "icloud.com",
    "yahoo.com",
    "proton.me",
    "protonmail.com",
  ]);

  if (freeDomains.has(domain)) return false;
  if (!companyDomain) return true;

  const normalizedCompanyDomain = companyDomain.toLowerCase();
  return domain === normalizedCompanyDomain || domain.endsWith(`.${normalizedCompanyDomain}`);
}

export function canSendOutreach(company: {
  contactEmail?: string | null;
  contactEmailStatus?: string | null;
  contactVerificationStatus?: string | null;
  outreachReady?: boolean | null;
}): boolean {
  return Boolean(
    company.contactEmail &&
      company.contactVerificationStatus === "verified_current" &&
      isUsableEmailStatus(company.contactEmailStatus) &&
      company.outreachReady
  );
}
