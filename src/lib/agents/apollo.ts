import type { Company } from "@prisma/client";
import { getCompanyDomain, getContactRelevance, getRoleRelevanceLabel, isBusinessEmailForCompany } from "./contact-quality";
import { asObject, MonidClient, MonidError } from "@/lib/contacts/monid-client";
import { canonicalLinkedinUrl, mailboxPriority } from "@/lib/contacts/company-context";
import { isDeliverableHunterEmail } from "@/lib/contacts/email-verification";
import type { ContactCandidate, ContactDiscoveryDiagnostic, ContactProviderSearchResult, ContactSearchOptions } from "@/lib/contacts/types";

type ApolloPerson = {
  id: string;
  name: string;
  title: string;
  hasEmail: boolean;
  email: string;
  emailStatus: string;
  linkedin: string | null;
  organizationDomain: string;
  organizationName: string;
};

type ApolloClient = Pick<MonidClient, "searchApolloPeople" | "matchApolloPerson" | "verifyEmail">;
type Dependencies = {
  client?: ApolloClient;
  trustedDomains?: string[];
  rejectedEmails?: Set<string>;
};

const TARGET_TITLES = [
  "partnerships manager", "brand partnerships manager", "sponsorship manager",
  "sports marketing manager", "community partnerships manager", "local marketing manager",
  "field marketing manager", "events manager", "brand marketing manager",
  "influencer marketing manager", "creator partnerships manager", "communications director",
  "marketing director", "head of partnerships", "head of brand", "head of marketing", "vp marketing",
];

/** Legacy health-check URL now inspects Apollo through Monid, without a paid run. */
export async function checkApolloConnection() {
  const configured = Boolean(process.env.MONID_API_KEY?.trim());
  if (!configured) return { configured, ok: false, status: null, transport: "monid" as const };
  try {
    await new MonidClient({ deadline: Date.now() + 15_000 }).checkApolloAccess();
    return { configured, ok: true, status: 200, transport: "monid" as const, check: "catalog" as const };
  } catch {
    return { configured, ok: false, status: null, transport: "monid" as const };
  }
}

/** Apollo is a Monid data source, never a separate subscription or budget. */
export async function searchApolloContacts(
  company: Company,
  log?: (message: string) => void,
  options: ContactSearchOptions = {},
  dependencies: Dependencies = {},
): Promise<ContactProviderSearchResult> {
  const diagnostics: ContactDiscoveryDiagnostic[] = [];
  const contacts: ContactCandidate[] = [];
  const rejectedEmails = dependencies.rejectedEmails || new Set<string>();
  const domain = getCompanyDomain(company.website)?.toLowerCase();
  const result = () => ({ contacts, diagnostics, emailDiscoveryComplete: true, rejectedEmails: Array.from(rejectedEmails) });
  if (!domain) {
    diagnostics.push({ provider: "apollo", stage: "people_search", status: "no_result", message: "Apollo via Monid : domaine de l’entreprise manquant." });
    return result();
  }
  if (options.signal?.aborted || Date.now() >= (options.deadline ?? Infinity)) return result();

  let client: ApolloClient;
  let people: ApolloPerson[];
  try {
    client = dependencies.client || new MonidClient(options);
    log?.("Apollo via Monid recherche les rôles partenariats et marketing dans l’entreprise...");
    const searched = await client.searchApolloPeople(domain, TARGET_TITLES);
    const rawPeople = asObject(searched.output).people;
    people = Array.isArray(rawPeople) ? rawPeople.slice(0, 10).map(normalizePerson) : [];
    people = Array.from(new Map(people.filter((person) => person.id && getContactRelevance(person.title) >= 2 &&
      isCurrentApolloEmployment(person, company.name, domain)).map((person) => [person.id, person])).values());
    people.sort((a, b) => getContactRelevance(b.title) - getContactRelevance(a.title));
  } catch (error) {
    diagnostics.push(failure("people_search", error));
    return result();
  }

  diagnostics.push({
    provider: "apollo", stage: "people_search", status: people.length ? "success" : "no_result", matched: people.length,
    message: `Apollo via Monid : ${people.length} profil(s) pertinent(s) trouvé(s). La recherche seule ne révèle pas les emails.`,
  });
  const selected = people.filter((person) => person.hasEmail).slice(0, 3);
  const domains = Array.from(new Set([domain, ...(dependencies.trustedDomains || [])]));
  let requested = 0;
  let matched = 0;
  for (const preview of selected) {
    if (options.signal?.aborted || Date.now() >= (options.deadline ?? Infinity)) break;
    try {
      requested += 1;
      // Match by the stable Apollo id, not an obfuscated name from search.
      const enriched = await client.matchApolloPerson(preview.id);
      if (enriched.notFound) continue;
      const person = normalizePerson(asObject(enriched.output).person);
      if (person.id !== preview.id) continue;
      const contact = toApolloContact(person, company.name, domain);
      if (!contact) continue;
      matched += 1;
      contacts.push(contact);
      const email = person.email;
      if (!email || rejectedEmails.has(email)) continue;
      // A provider's verified label is insufficient: require an official domain,
      // a named work address, and an independent deliverability check.
      if (!isNamedBusinessEmail(email, domains) || person.emailStatus !== "verified") {
        // Missing attribution is not a negative deliverability result. Do not
        // invalidate an existing contact or an independently sourced mailbox.
        continue;
      }
      rejectedEmails.add(email);
      const checked = await client.verifyEmail(email);
      if (!isDeliverableHunterEmail(checked.output, email)) continue;
      rejectedEmails.delete(email);
      Object.assign(contact, {
        email, email_status: "verified", email_kind: "personal_professional", confidence: "high",
        email_source: "Apollo via Monid · vérification Hunter via Monid",
        email_evidence: `Adresse professionnelle déclarée vérifiée par Apollo puis contrôlée par Hunter le ${new Date().toISOString().slice(0, 10)} : SMTP positif et domaine non catch-all. La pertinence du destinataire et l’envoi restent soumis à votre approbation.`,
      });
    } catch (error) {
      diagnostics.push(failure("email_enrichment", error));
      break; // Keep prior results; do not multiply failed or uncertain paid calls.
    }
  }
  const usableEmails = contacts.filter((contact) => contact.email).length;
  diagnostics.push({
    provider: "apollo", stage: "email_enrichment", status: usableEmails ? "success" : "no_result",
    requested, matched, usableEmails,
    message: `Apollo via Monid : ${matched} identité(s) complète(s), ${usableEmails} email(s) professionnel(s) confirmé(s) après vérification. Les coûts sont inclus dans le budget Monid commun.`,
  });
  return result();
}

function normalizePerson(raw: unknown): ApolloPerson {
  const person = asObject(raw);
  const organization = asObject(person.organization);
  return {
    id: text(person.id) || text(person.person_id),
    name: text(person.name) || [text(person.first_name), text(person.last_name)].filter(Boolean).join(" "),
    title: text(person.title) || text(person.headline),
    hasEmail: person.has_email !== false,
    email: text(person.email).toLowerCase(),
    emailStatus: text(person.email_status) || text(person.contact_email_status),
    linkedin: canonicalLinkedinUrl(person.linkedin_url, "in"),
    organizationDomain: text(organization.primary_domain).toLowerCase().replace(/^www\./, ""),
    organizationName: text(organization.name) || text(person.organization_name),
  };
}

function toApolloContact(person: ApolloPerson, companyName: string, companyDomain: string): ContactCandidate | null {
  const relevance = getRoleRelevanceLabel(person.title);
  if (person.name.split(/\s+/).length < 2 || /\*|\.\.\.|…|linkedin member|anonymous|inconnu/i.test(person.name) ||
      relevance === "low" || !isCurrentApolloEmployment(person, companyName, companyDomain)) return null;
  return {
    name: person.name, role: person.title, kind: "person", email: null, email_status: "missing", email_kind: "unknown",
    linkedin: person.linkedin, confidence: "medium", verification_status: "verified_current", current_at_company: true,
    role_relevance: relevance,
    evidence: `Apollo via Monid : profil actuel associé à ${companyName} (${companyDomain}), rôle ${person.title}.`,
    source: "Apollo People API via Monid",
    // Keep the original provider/id pair so existing Apollo contacts are updated, not duplicated.
    provider: "apollo", providerExternalId: person.id,
  };
}

function isNamedBusinessEmail(email: string, trustedDomains: string[]): boolean {
  const local = email.split("@")[0];
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    trustedDomains.some((domain) => isBusinessEmailForCompany(email, domain)) && mailboxPriority(email) === 0 &&
    !/^(?:support|sales|service|help|hr|recruitment|jobs|careers|noreply|no-reply|admin|office)(?:[._-]|$)/i.test(local);
}

function isCurrentApolloEmployment(person: ApolloPerson, companyName: string, companyDomain: string): boolean {
  if (person.organizationDomain && (person.organizationDomain === companyDomain ||
      person.organizationDomain.endsWith(`.${companyDomain}`) || companyDomain.endsWith(`.${person.organizationDomain}`))) return true;
  const expected = organizationTokens(companyName);
  const actual = organizationTokens(person.organizationName);
  if (!expected.length || !actual.length) return false;
  // Do not accept a parent/group or a namesake merely because one token overlaps.
  const overlap = expected.filter((token) => actual.includes(token)).length;
  return overlap / Math.max(expected.length, actual.length) >= 0.75;
}

function organizationTokens(value: string): string[] {
  const ignored = new Set(["company", "corp", "corporation", "group", "groupe", "international", "global", "inc", "llc", "ltd", "sa", "sas"]);
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/).filter((token) => token.length > 1 && !ignored.has(token));
}

function failure(stage: ContactDiscoveryDiagnostic["stage"], error: unknown): ContactDiscoveryDiagnostic {
  return { provider: "apollo", stage, status: "failed", message: `Apollo via Monid : ${error instanceof MonidError ? error.message : "recherche indisponible ; les résultats déjà vérifiés sont conservés."}` };
}

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
