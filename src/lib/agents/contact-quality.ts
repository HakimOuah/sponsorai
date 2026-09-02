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
  const normalizedRole = (role || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const highSignal =
    /\b(partnerships?|partenariats?|sponsoring|sponsorship|sports marketing|brand partnerships?|strategic partnerships?|alliances?|community partnerships?|local marketing|field marketing|events?|evenementiel|csr|rse)\b/i;
  const goodSignal =
    /\b(marketing|brand|marque|communications?|comms|pr|public relations|relations publiques|growth|influencer|creator|talent|community)\b/i;
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

export function normalizeContactRole(role?: string | null): string {
  const value = (role || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  if (/sports? partnerships?|sponsorship|sponsoring/.test(value)) return "SPORTS_PARTNERSHIPS";
  if (/brand partnerships?|strategic partnerships?|alliances?|partenariats?/.test(value)) {
    return "BRAND_PARTNERSHIPS";
  }
  if (/sports? marketing/.test(value)) return "SPORTS_MARKETING";
  if (/influencer|creator|talent/.test(value)) return "CREATOR_PARTNERSHIPS";
  if (/communications?|comms|public relations|\bpr\b/.test(value)) {
    return "COMMUNICATIONS";
  }
  if (/community|events?|csr|rse/.test(value)) return "COMMUNITY_EVENTS";
  if (/marketing|brand|growth/.test(value)) return "MARKETING";
  return "OTHER";
}

export function calculateStaticContactScore(input: {
  role?: string | null;
  contactability?: string | null;
  employmentConfidence?: number | null;
}): number {
  const roleScore = (getContactRelevance(input.role) / 3) * 55;
  const contactabilityScore = input.contactability === "verified"
    ? 25
    : input.contactability === "public_source"
      ? 18
      : 0;
  const employmentScore = Math.max(
    0,
    Math.min(1, input.employmentConfidence || 0)
  ) * 20;

  return Math.round(Math.min(100, roleScore + contactabilityScore + employmentScore));
}

export function isUsableEmailStatus(status?: string | null): boolean {
  return status === "verified" || status === "public_source";
}

export function canDraftForContact(contact: {
  active?: boolean | null;
  employmentStatus?: string | null;
}): boolean {
  return (
    contact.active === true && contact.employmentStatus === "verified_current"
  );
}

export function hasActionableContact(
  contacts: Array<{
    employmentStatus?: string | null;
    contactability?: string | null;
  }>,
): boolean {
  return contacts.some(
    (contact) =>
      contact.employmentStatus === "verified_current"
      && isUsableEmailStatus(contact.contactability),
  );
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
