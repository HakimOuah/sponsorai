import { createHash } from "node:crypto";
import type { Company } from "@prisma/client";
import { getContactRelevance, getRoleRelevanceLabel, isBusinessEmailForCompany } from "@/lib/agents/contact-quality";
import { canonicalLinkedinUrl, resolveCompanyContactContext, type CompanyContactContext } from "./company-context";
import { asObject, MonidClient, MonidError } from "./monid-client";
import { searchApolloContacts } from "@/lib/agents/apollo";
import { isDeliverableHunterEmail } from "./email-verification";
export { isDeliverableHunterEmail } from "./email-verification";
import type { ContactCandidate, ContactDiscoveryDiagnostic, ContactProviderSearchResult, ContactSearchOptions } from "./types";

type Client = Pick<MonidClient, "employees" | "findEmail" | "verifyEmail" | "searchApolloPeople" | "matchApolloPerson" | "usage">;
type Dependencies = {
  client?: Client;
  resolveContext?: typeof resolveCompanyContactContext;
};

export async function searchMonidContacts(
  company: Company,
  log?: (message: string) => void,
  options: ContactSearchOptions = {},
  dependencies: Dependencies = {},
): Promise<ContactProviderSearchResult> {
  const client = dependencies.client || new MonidClient(options);
  const diagnostics: ContactDiscoveryDiagnostic[] = [];
  const rejectedEmails = new Set<string>();
  log?.("Monid vérifie la page LinkedIn et les domaines email de l’entreprise sur ses sources officielles...");
  const context = await (dependencies.resolveContext || resolveCompanyContactContext)(company, options).catch(() => ({
    companyLinkedinUrl: null, linkedinSource: null, emailDomains: [], mailboxes: [],
  } as CompanyContactContext));
  diagnostics.push({
    provider: "monid", stage: "company_resolution", status: context.companyLinkedinUrl ? "success" : "partial",
    message: context.companyLinkedinUrl
      ? "Page LinkedIn reliée au site officiel ; domaines email contrôlés avant la recherche."
      : "Aucune page LinkedIn reliée au site officiel avec certitude. Les homonymes ne sont pas interrogés.",
  });
  let contacts: ContactCandidate[] = [];
  if (context.companyLinkedinUrl) {
    log?.("Monid recherche les fonctions sponsoring, partenariats et communication sur LinkedIn...");
    try {
      const result = await client.employees(context.companyLinkedinUrl);
      contacts = selectCurrentLinkedinContacts(result.output, context.companyLinkedinUrl, company.id);
      diagnostics.push({
        provider: "monid", stage: "people_search", status: contacts.length ? "success" : "no_result",
        matched: contacts.length,
        message: `${contacts.length} interlocuteur(s) retenu(s) avec un poste actuel dans l’entreprise LinkedIn exacte.`,
      });
    } catch (error) { diagnostics.push(failure("people_search", error)); }
  }

  if (contacts.length) {
    log?.("Monid recherche puis vérifie les adresses professionnelles. Les domaines catch-all et les emails incertains sont écartés...");
    contacts = await Promise.all(contacts.map(async (contact) => {
      try { return await findVerifiedEmail(client, contact, context, rejectedEmails); }
      catch (error) {
        diagnostics.push(failure("email_enrichment", error));
        return contact;
      }
    }));
    const usable = contacts.filter((contact) => contact.email).length;
    diagnostics.push({
      provider: "monid", stage: "email_verification", status: usable ? "success" : "no_result",
      requested: contacts.length, usableEmails: usable,
      message: `${usable} email(s) nominatif(s) validé(s) techniquement par Hunter via Monid. Une validation technique ne prouve pas à elle seule l’identité du destinataire ; votre approbation reste nécessaire.`,
    });
  }

  if (!contacts.some((contact) => contact.email)) {
    const apollo = await searchApolloContacts(company, log, options, {
      client, trustedDomains: context.emailDomains.map((domain) => domain.domain), rejectedEmails,
    });
    diagnostics.push(...apollo.diagnostics);
    // Prefer usable addresses, then fill with verified identities. A fallback
    // must not discard existing people, duplicate them, or resurrect a rejection.
    const merged: ContactCandidate[] = [];
    for (const contact of [...contacts, ...apollo.contacts].sort((a, b) => Number(Boolean(b.email)) - Number(Boolean(a.email)))) {
      if (contact.email && rejectedEmails.has(contact.email.toLowerCase())) continue;
      if (merged.some((existing) => (existing.linkedin && existing.linkedin === contact.linkedin) || normalizeName(existing.name) === normalizeName(contact.name))) continue;
      merged.push(contact);
    }
    contacts = merged.slice(0, 3);
  }

  if (!contacts.some((contact) => contact.email)) {
    log?.("Vérification d’une boîte fonctionnelle publiée sur le site officiel, en dernier recours...");
    let mailbox: ContactCandidate | null = null;
    for (const candidate of context.mailboxes) {
      if (rejectedEmails.has(candidate.email.toLowerCase())) continue;
      try {
        rejectedEmails.add(candidate.email);
        const verified = await client.verifyEmail(candidate.email);
        if (!isDeliverableHunterEmail(verified.output, candidate.email)) continue;
        rejectedEmails.delete(candidate.email);
        mailbox = {
          name: company.name,
          role: "Boîte de contact de l’entreprise",
          kind: "company_mailbox",
          email: candidate.email,
          email_status: "verified",
          email_kind: "functional_generic",
          email_source: candidate.source,
          email_evidence: "Boîte fonctionnelle publiée sur le site officiel et validée techniquement par Hunter via Monid. Ce n’est pas l’adresse personnelle d’un décideur ; demander une orientation vers le service partenariats.",
          linkedin: null, confidence: "high", current_at_company: true,
          verification_status: "verified_current", role_relevance: "medium",
          evidence: `Boîte officielle de l’entreprise observée sur ${candidate.source}. Aucun décideur nominatif n’est attribué à cette adresse.`,
          source: candidate.source, provider: "monid",
          providerExternalId: `${company.id}:mailbox:${createHash("sha256").update(candidate.email).digest("hex")}`,
        };
        break;
      } catch (error) {
        diagnostics.push(failure("email_verification", error));
        break;
      }
    }
    if (mailbox) contacts = [...contacts.slice(0, 2), mailbox];
    diagnostics.push({
      provider: "monid", stage: "public_web_search", status: mailbox ? "success" : "no_result",
      usableEmails: mailbox ? 1 : 0,
      message: mailbox
        ? "Boîte fonctionnelle officielle trouvée et vérifiée ; présentée séparément des décideurs."
        : "Aucune boîte fonctionnelle officielle n’a passé les contrôles. Aucune adresse contact@ n’a été inventée.",
    });
  }
  diagnostics.push({
    provider: "monid", stage: "budget", status: "success",
    ...client.usage,
    message: "Budget Monid commun à LinkedIn, Hunter et Apollo : 5 profils LinkedIn, 3 révélations Apollo et 2 domaines email maximum ; aucune relance automatique d’appel payant.",
  });
  return { contacts, diagnostics: deduplicateDiagnostics(diagnostics), emailDiscoveryComplete: true, rejectedEmails: Array.from(rejectedEmails) };
}

export function selectCurrentLinkedinContacts(output: unknown, companyUrl: string, companyId: string): ContactCandidate[] {
  if (!Array.isArray(output)) return [];
  const expectedCompany = canonicalLinkedinUrl(companyUrl, "company");
  if (!expectedCompany) return [];
  const contacts: ContactCandidate[] = [];
  for (const raw of output.slice(0, 5)) {
    const person = asObject(raw);
    const first = stringValue(person.firstName);
    const last = stringValue(person.lastName);
    const name = `${first} ${last}`.trim();
    const linkedin = canonicalLinkedinUrl(person.linkedinUrl, "in");
    if (person.openToWork === true) continue;
    if (!linkedin || !first || !last || /\*|\.\.\.|linkedin member|anonymous|inconnu/i.test(name) || last.length < 2) continue;
    const positions = Array.isArray(person.currentPosition) ? person.currentPosition.map(asObject) : [];
    const job = positions.find((position) => {
      const end = asObject(position.endDate);
      const stillCurrent = !end.year && (!end.text || /^(present|current|aujourd’hui|aujourd'hui|actuel)$/i.test(stringValue(end.text)));
      return stillCurrent && canonicalLinkedinUrl(position.companyLinkedinUrl, "company") === expectedCompany &&
        getContactRelevance(stringValue(position.position)) >= 2;
    });
    if (!job) continue;
    const role = stringValue(job.position);
    if (contacts.some((contact) => contact.linkedin === linkedin || normalizeName(contact.name) === normalizeName(name))) continue;
    contacts.push({
      name, role, kind: "person", email: null, email_status: "missing", email_kind: "unknown",
      linkedin, confidence: "high", verification_status: "verified_current", current_at_company: true,
      role_relevance: getRoleRelevanceLabel(role),
      evidence: `Profil LinkedIn : poste actuel « ${role} » dans l’entreprise ${expectedCompany}. Observé le ${new Date().toISOString().slice(0, 10)}.`,
      source: "Monid · LinkedIn (HarvestAPI)", provider: "monid",
      providerExternalId: `${companyId}:${linkedin}`,
    });
  }
  return contacts.sort((a, b) => sponsorshipPriority(b.role) - sponsorshipPriority(a.role)).slice(0, 3);
}

function sponsorshipPriority(role: string): number {
  const normalized = role.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  // Direct sponsorship owners first, then senior brand/communications leaders.
  const specialty = /sponsor|partnership|partenariat/.test(normalized) ? 30
    : /brand|marque|communication/.test(normalized) ? 20 : 10;
  const seniority = /head|director|directeur|directrice|chief|responsable/.test(normalized) ? 5 : 0;
  return specialty + seniority + getContactRelevance(role);
}

async function findVerifiedEmail(client: Client, contact: ContactCandidate, context: CompanyContactContext, rejectedEmails: Set<string>): Promise<ContactCandidate> {
  for (const domain of context.emailDomains.slice(0, 2)) {
    const found = await client.findEmail(contact.name, domain.domain);
    const data = asObject(asObject(found.output).data);
    const email = stringValue(data.email).toLowerCase();
    if (email) rejectedEmails.add(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !isBusinessEmailForCompany(email, domain.domain) || data.accept_all === true) continue;
    const returnedName = `${stringValue(data.first_name)} ${stringValue(data.last_name)}`.trim();
    if (!returnedName || normalizeName(returnedName) !== normalizeName(contact.name)) continue;
    if (/invalid|disposable|webmail/i.test(stringValue(asObject(data.verification).status))) continue;
    const verification = await client.verifyEmail(email);
    if (!isDeliverableHunterEmail(verification.output, email)) continue;
    rejectedEmails.delete(email);
    return {
      ...contact, email, email_status: "verified", email_kind: "personal_professional",
      email_source: "Hunter via Monid — vérification technique",
      email_evidence: `Adresse recherchée par nom et domaine, puis validée techniquement par Hunter le ${new Date().toISOString().slice(0, 10)} (SMTP positif, domaine non catch-all). Domaine : ${domain.source}. Cette vérification n’est pas une preuve de publication nominative ; contrôler le destinataire avant envoi.`,
    };
  }
  return contact;
}

function failure(stage: ContactDiscoveryDiagnostic["stage"], error: unknown): ContactDiscoveryDiagnostic {
  return {
    provider: "monid", stage, status: "failed",
    message: error instanceof MonidError ? error.message : "Cette recherche Monid n’a pas pu être confirmée ; les résultats déjà vérifiés sont conservés.",
  };
}

function deduplicateDiagnostics(items: ContactDiscoveryDiagnostic[]) {
  return Array.from(new Map(items.map((item) => [`${item.stage}:${item.message}`, item])).values());
}

function stringValue(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function normalizeName(value: string): string { return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(new RegExp("[^\\p{L}\\p{N}]", "gu"), ""); }
