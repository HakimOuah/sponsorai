import { canonicalLinkedinUrl } from "./company-context";
import { getContactRelevance, getRoleRelevanceLabel } from "@/lib/agents/contact-quality";
import type { ContactCandidate, ContactSearchOptions } from "./types";

export interface DirectProfile {
  name: string; role: string; linkedin: string; companyLinkedinUrl: string;
  current: boolean; evidence: string; observedAt: number; excluded?: boolean;
}
export interface DirectResult { profiles: DirectProfile[]; excludedProfiles: string[]; status: "success" | "unavailable" | "empty"; }

export function selectDirectContacts(result: DirectResult, companyUrl: string, companyId: string): ContactCandidate[] {
  const expected = canonicalLinkedinUrl(companyUrl, "company");
  const excluded = new Set(result.excludedProfiles.map((url) => canonicalLinkedinUrl(url, "in")));
  const seen = new Set<string>();
  return result.profiles.slice(0, 5).flatMap((p): ContactCandidate[] => {
    const url = canonicalLinkedinUrl(p.linkedin, "in");
    if (!url || excluded.has(url) || seen.has(url) || p.excluded || !p.current ||
      canonicalLinkedinUrl(p.companyLinkedinUrl, "company") !== expected ||
      !Number.isFinite(p.observedAt) || Math.abs(Date.now() - p.observedAt) > 300_000 ||
      !/\S+\s+\S{2,}/.test(p.name) || /\*|\.\.\.|member|inconnu|\b[A-Z]\.$/i.test(p.name) ||
      getContactRelevance(p.role) < 2 || !p.evidence) return [];
    seen.add(url);
    return [{ name: p.name.slice(0, 160), role: p.role.slice(0, 240), kind: "person", email: null,
      email_status: "missing", email_kind: "unknown", linkedin: url, confidence: "high",
      verification_status: "verified_current", current_at_company: true,
      role_relevance: getRoleRelevanceLabel(p.role), evidence: p.evidence.slice(0, 2000),
      source: "LinkedIn direct · profil et expérience", provider: "linkedin_direct",
      providerExternalId: `${companyId}:${url}` }];
  }).slice(0, 3);
}

/** Lazy import: disabled integration never opens a database connection. */
export async function searchLinkedinDirect(companyUrl: string, companyId: string, options: ContactSearchOptions): Promise<DirectResult> {
  if (process.env.LINKEDIN_DIRECT_ENABLED !== "true" || !process.env.LINKEDIN_WORKER_TOKEN) {
    return { status: "unavailable", profiles: [], excludedProfiles: [] };
  }
  const { requestLinkedinJob } = await import("./linkedin-worker-store");
  return requestLinkedinJob(companyUrl, companyId, options);
}
