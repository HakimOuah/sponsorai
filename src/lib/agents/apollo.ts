import type { Company } from "@prisma/client";
import {
  getCompanyDomain,
  getContactRelevance,
  getRoleRelevanceLabel,
  isBusinessEmailForCompany,
} from "./contact-quality";

type ApolloPerson = {
  id?: string;
  person_id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  title?: string;
  headline?: string;
  email?: string;
  email_status?: string;
  contact_email_status?: string;
  linkedin_url?: string;
  organization?: { name?: string; primary_domain?: string };
  organization_name?: string;
};

export type ApolloContact = {
  name: string;
  role: string;
  email: string | null;
  email_status: "verified" | "missing";
  email_evidence?: string | null;
  email_pattern?: string | null;
  email_candidates?: string[];
  linkedin: string | null;
  confidence: "high" | "medium";
  verification_status: "verified_current";
  current_at_company: true;
  role_relevance: "high" | "medium";
  evidence: string;
  source: string;
};

const TARGET_TITLES = [
  "partnerships manager",
  "brand partnerships manager",
  "sponsorship manager",
  "sports marketing manager",
  "community partnerships manager",
  "local marketing manager",
  "field marketing manager",
  "events manager",
  "brand marketing manager",
  "influencer marketing manager",
  "creator partnerships manager",
  "communications director",
  "marketing director",
  "head of partnerships",
  "head of brand",
  "head of marketing",
  "vp marketing",
];

export async function searchApolloContacts(company: Company): Promise<ApolloContact[]> {
  const apiKey = process.env.APOLLO_API_KEY;
  const domain = getCompanyDomain(company.website);

  if (!apiKey || !domain) return [];

  const searchParams = new URLSearchParams();
  TARGET_TITLES.forEach((title) => searchParams.append("person_titles[]", title));
  ["head", "director", "manager", "vp", "c_suite"].forEach((seniority) =>
    searchParams.append("person_seniorities[]", seniority)
  );
  searchParams.append("q_organization_domains_list[]", domain);
  searchParams.append("include_similar_titles", "false");
  searchParams.append("page", "1");
  searchParams.append("per_page", "10");

  const searchResponse = await fetch(
    `https://api.apollo.io/api/v1/mixed_people/api_search?${searchParams.toString()}`,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    }
  );

  if (!searchResponse.ok) {
    throw new Error(`Apollo search failed (${searchResponse.status})`);
  }

  const searchData = await searchResponse.json();
  const people = normalizePeople(searchData)
    .filter((person) => getContactRelevance(person.title || person.headline) >= 2)
    .slice(0, 5);

  if (people.length === 0) return [];

  const enriched = await enrichApolloPeople(apiKey, people, domain);
  const candidates = enriched.length > 0 ? enriched : people;

  return candidates
    .map((person) => toApolloContact(person, company.name, domain))
    .filter((contact): contact is ApolloContact => Boolean(contact))
    .sort((a, b) => getContactRelevance(b.role) - getContactRelevance(a.role))
    .slice(0, 3);
}

async function enrichApolloPeople(
  apiKey: string,
  people: ApolloPerson[],
  domain: string
): Promise<ApolloPerson[]> {
  const details = people.map((person) => ({
    id: person.id || person.person_id,
    first_name: person.first_name,
    last_name: person.last_name,
    name: person.name,
    organization_domain: domain,
    linkedin_url: person.linkedin_url,
  }));

  const response = await fetch(
    "https://api.apollo.io/api/v1/people/bulk_match?reveal_personal_emails=false",
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ details }),
      cache: "no-store",
    }
  );

  if (!response.ok) return [];

  const data = await response.json();
  return normalizePeople(data);
}

function normalizePeople(data: unknown): ApolloPerson[] {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  const people =
    record.people ||
    record.contacts ||
    record.matches ||
    record.persons ||
    record.details ||
    [];

  return Array.isArray(people) ? (people as ApolloPerson[]) : [];
}

function toApolloContact(
  person: ApolloPerson,
  companyName: string,
  companyDomain: string
): ApolloContact | null {
  const role = person.title || person.headline || "";
  const relevance = getRoleRelevanceLabel(role);
  const name =
    person.name ||
    [person.first_name, person.last_name].filter(Boolean).join(" ").trim();
  const rawEmailStatus = person.email_status || person.contact_email_status;
  const hasVerifiedEmail =
    rawEmailStatus === "verified" &&
    isBusinessEmailForCompany(person.email, companyDomain);

  if (!name || !role || relevance === "low") return null;

  return {
    name,
    role,
    email: hasVerifiedEmail ? person.email || null : null,
    email_status: hasVerifiedEmail ? "verified" : "missing",
    email_evidence: hasVerifiedEmail
      ? "Apollo indique un email professionnel vérifié pour ce contact."
      : null,
    email_pattern: null,
    email_candidates: [],
    linkedin: person.linkedin_url || null,
    confidence: hasVerifiedEmail ? "high" : "medium",
    verification_status: "verified_current",
    current_at_company: true,
    role_relevance: relevance,
    evidence: `Apollo: profil actuel associé à ${companyName} (${companyDomain}) avec rôle ${role}`,
    source: "Apollo People API",
  };
}
