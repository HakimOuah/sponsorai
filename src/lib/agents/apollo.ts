import type { Company } from "@prisma/client";
import {
  getCompanyDomain,
  getContactRelevance,
  getRoleRelevanceLabel,
  isBusinessEmailForCompany,
} from "./contact-quality";
import type {
  ContactDiscoveryDiagnostic,
  ContactProviderSearchResult,
} from "@/lib/contacts/types";

type ApolloPerson = {
  id?: string;
  person_id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  last_name_obfuscated?: string;
  title?: string;
  headline?: string;
  has_email?: boolean;
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
  email_source?: string | null;
  email_pattern?: string | null;
  email_candidates?: string[];
  linkedin: string | null;
  confidence: "high" | "medium";
  verification_status: "verified_current";
  current_at_company: true;
  role_relevance: "high" | "medium";
  evidence: string;
  source: string;
  providerExternalId: string | null;
};

type ApolloBulkResult = {
  people: ApolloPerson[];
  requested: number;
  matched: number;
  missing: number;
  creditsConsumed: number | null;
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

export async function checkApolloConnection(): Promise<{
  configured: boolean;
  ok: boolean;
  status: number | null;
}> {
  const apiKey = process.env.APOLLO_API_KEY;

  if (!apiKey) {
    return { configured: false, ok: false, status: null };
  }

  const searchParams = new URLSearchParams({ page: "1", per_page: "1" });
  searchParams.append("q_organization_domains_list[]", "apollo.io");

  const response = await fetch(
    `https://api.apollo.io/api/v1/mixed_people/api_search?${searchParams.toString()}`,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      cache: "no-store",
    }
  );

  return {
    configured: true,
    ok: response.ok,
    status: response.status,
  };
}

export async function searchApolloContacts(
  company: Company,
  log?: (message: string) => void,
): Promise<ContactProviderSearchResult> {
  const apiKey = process.env.APOLLO_API_KEY;
  const domain = getCompanyDomain(company.website);
  const diagnostics: ContactDiscoveryDiagnostic[] = [];

  if (!apiKey || !domain) {
    return {
      contacts: [],
      diagnostics: [
        {
          provider: "apollo",
          stage: "people_search",
          status: "failed",
          message: !apiKey
            ? "Clé Apollo absente."
            : "Domaine entreprise manquant pour la recherche Apollo.",
        },
      ],
    };
  }

  const searchParams = new URLSearchParams();
  TARGET_TITLES.forEach((title) => searchParams.append("person_titles[]", title));
  ["head", "director", "manager", "vp", "c_suite"].forEach((seniority) =>
    searchParams.append("person_seniorities[]", seniority)
  );
  searchParams.append("q_organization_domains_list[]", domain);
  searchParams.append("contact_email_status[]", "verified");
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
        "x-api-key": apiKey,
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

  diagnostics.push({
    provider: "apollo",
    stage: "people_search",
    status: people.length > 0 ? "success" : "no_result",
    message:
      people.length > 0
        ? `${people.length} profil${people.length > 1 ? "s" : ""} pertinent${people.length > 1 ? "s" : ""} trouvé${people.length > 1 ? "s" : ""} dans Apollo.`
        : "Apollo n’a trouvé aucun profil pertinent pour ce domaine.",
    matched: people.length,
  });

  if (people.length === 0) return { contacts: [], diagnostics };

  const peopleWithPotentialEmail = people.filter(
    (person) => person.has_email !== false,
  );
  if (peopleWithPotentialEmail.length === 0) {
    const message =
      "Apollo indique qu’aucun de ces profils ne possède d’email disponible. Recherche publique de secours activée.";
    diagnostics.push({
      provider: "apollo",
      stage: "email_enrichment",
      status: "no_result",
      message,
      requested: 0,
      matched: 0,
      usableEmails: 0,
      creditsConsumed: 0,
    });
    log?.(message);
    return { contacts: [], diagnostics };
  }

  let bulkResult: ApolloBulkResult | null = null;
  try {
    bulkResult = await enrichApolloPeople(
      apiKey,
      peopleWithPotentialEmail,
      domain,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur Apollo inconnue.";
    log?.(`${message} Recherche publique de secours activée.`);
    diagnostics.push({
      provider: "apollo",
      stage: "email_enrichment",
      status: "failed",
      message,
      requested: peopleWithPotentialEmail.length,
      usableEmails: 0,
    });
  }

  const candidates = mergeApolloPeople(
    peopleWithPotentialEmail,
    bulkResult?.people || [],
  );
  const contacts = candidates
    .map((person) => toApolloContact(person, company.name, domain))
    .filter((contact): contact is ApolloContact => Boolean(contact))
    .sort((a, b) => getContactRelevance(b.role) - getContactRelevance(a.role))
    .slice(0, 3);
  const usableEmails = contacts.filter((contact) => contact.email).length;

  if (bulkResult) {
    const status = usableEmails > 0
      ? "success"
      : bulkResult.matched > 0
        ? "no_result"
        : "partial";
    const message = usableEmails > 0
      ? `Apollo a révélé ${usableEmails} email${usableEmails > 1 ? "s" : ""} professionnel${usableEmails > 1 ? "s" : ""} vérifié${usableEmails > 1 ? "s" : ""}.`
      : `Apollo a enrichi ${bulkResult.matched}/${bulkResult.requested} profil${bulkResult.requested > 1 ? "s" : ""}, sans email professionnel exploitable.`;

    diagnostics.push({
      provider: "apollo",
      stage: "email_enrichment",
      status,
      message,
      requested: bulkResult.requested,
      matched: bulkResult.matched,
      usableEmails,
      creditsConsumed: bulkResult.creditsConsumed,
    });
    log?.(message);
  }

  return { contacts, diagnostics };
}

async function enrichApolloPeople(
  apiKey: string,
  people: ApolloPerson[],
  domain: string
): Promise<ApolloBulkResult> {
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
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ details }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null) as {
      error_code?: string;
      error_message?: string;
      message?: string;
    } | null;
    const errorCode = errorData?.error_code
      ? ` · ${errorData.error_code}`
      : "";
    throw new Error(
      `Apollo bulk_match a échoué (${response.status}${errorCode}). Vérifiez les permissions de la clé et les crédits disponibles.`,
    );
  }

  const data = await response.json() as Record<string, unknown>;
  const matchedPeople = normalizePeople(data);

  return {
    people: matchedPeople,
    requested: toSafeNumber(data.total_requested_enrichments, people.length),
    matched: toSafeNumber(data.unique_enriched_records, matchedPeople.length),
    missing: toSafeNumber(
      data.missing_records,
      Math.max(0, people.length - matchedPeople.length),
    ),
    creditsConsumed: toNullableNumber(data.credits_consumed),
  };
}

function mergeApolloPeople(
  searchedPeople: ApolloPerson[],
  enrichedPeople: ApolloPerson[],
): ApolloPerson[] {
  const enrichedById = new Map(
    enrichedPeople
      .map((person) => [getApolloPersonId(person), person] as const)
      .filter((entry): entry is [string, ApolloPerson] => Boolean(entry[0])),
  );

  return searchedPeople.map((person) => {
    const enriched = enrichedById.get(getApolloPersonId(person) || "");
    return enriched ? { ...person, ...enriched } : person;
  });
}

function getApolloPersonId(person: ApolloPerson): string | null {
  return person.id || person.person_id || null;
}

function toSafeNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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
  const trustedDomains = [
    companyDomain,
    person.organization?.primary_domain,
  ].filter((domain): domain is string => Boolean(domain));
  const hasVerifiedEmail =
    rawEmailStatus === "verified" &&
    trustedDomains.some((domain) =>
      isBusinessEmailForCompany(person.email, domain),
    );
  const currentEmploymentVerified = isCurrentApolloEmployment(
    person,
    companyName,
    companyDomain,
  );

  if (
    !name.includes(" ") ||
    !role ||
    relevance === "low" ||
    !currentEmploymentVerified
  ) {
    return null;
  }

  return {
    name,
    role,
    email: hasVerifiedEmail ? person.email || null : null,
    email_status: hasVerifiedEmail ? "verified" : "missing",
    email_evidence: hasVerifiedEmail
      ? "Apollo indique un email professionnel vérifié pour ce contact."
      : null,
    email_source: hasVerifiedEmail ? "Apollo People API" : null,
    email_pattern: null,
    email_candidates: [],
    linkedin: person.linkedin_url || null,
    confidence: hasVerifiedEmail ? "high" : "medium",
    verification_status: "verified_current",
    current_at_company: true,
    role_relevance: relevance,
    evidence: `Apollo: profil actuel associé à ${companyName} (${companyDomain}) avec rôle ${role}`,
    source: "Apollo People API",
    providerExternalId: getApolloPersonId(person),
  };
}

function isCurrentApolloEmployment(
  person: ApolloPerson,
  companyName: string,
  companyDomain: string,
): boolean {
  const organizationDomain = person.organization?.primary_domain
    ?.toLowerCase()
    .replace(/^www\./, "");
  if (
    organizationDomain &&
    (organizationDomain === companyDomain ||
      organizationDomain.endsWith(`.${companyDomain}`) ||
      companyDomain.endsWith(`.${organizationDomain}`))
  ) {
    return true;
  }

  const organizationName =
    person.organization?.name || person.organization_name || "";
  const companyTokens = normalizeOrganizationTokens(companyName);
  const organizationTokens = normalizeOrganizationTokens(organizationName);
  if (companyTokens.length === 0 || organizationTokens.length === 0) {
    return false;
  }

  const overlap = companyTokens.filter((token) =>
    organizationTokens.includes(token),
  ).length;
  return overlap / Math.min(companyTokens.length, organizationTokens.length) >= 0.75;
}

function normalizeOrganizationTokens(value: string): string[] {
  const ignored = new Set([
    "company",
    "corp",
    "corporation",
    "group",
    "groupe",
    "international",
    "global",
    "inc",
    "llc",
    "ltd",
    "sa",
    "sas",
  ]);

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !ignored.has(token));
}
