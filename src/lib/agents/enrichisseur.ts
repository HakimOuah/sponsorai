import { generateAIText } from "@/lib/ai";
import { EMAIL_PATTERN_PROMPT, ENRICHISSEUR_PROMPT } from "./prompts";
import type { Company } from "@prisma/client";
import type { LogCallback } from "./scout";
import { searchStructuredContactProviders } from "@/lib/contacts/providers";
import type { ContactCandidate } from "@/lib/contacts/types";
import {
  getCompanyDomain,
  getContactRelevance,
  isBusinessEmailForCompany,
  isUsableEmailStatus,
} from "./contact-quality";

export type EnrichContact = ContactCandidate;

export interface EnrichResult {
  contacts: EnrichContact[];
  company_insights: string;
}

export async function runEnrichisseur(
  company: Company,
  log: LogCallback
): Promise<EnrichResult> {
  log(`Recherche de contacts pour ${company.name}...`, "info");
  const companyDomain = getCompanyDomain(company.website);

  const apolloContacts = await tryApolloSearch(company, log);
  if (apolloContacts.length > 0) {
    log(`${apolloContacts.length} contact(s) qualifié(s) via Apollo`, "success");
    const contactsWithEmailDiscovery = await enrichEmailDiscovery(
      company,
      apolloContacts,
      log
    );
    return {
      contacts: contactsWithEmailDiscovery,
      company_insights:
        "Contacts issus d'Apollo, filtrés sur rôles marketing/partenariats et statut email exploitable quand disponible.",
    };
  }

  const prompt = ENRICHISSEUR_PROMPT
    .replace("{companyName}", company.name)
    .replace("{companySector}", company.sector || "Non renseigné")
    .replace("{companyCountry}", company.country || "Non renseigné")
    .replace("{companyWebsite}", company.website || "Non renseigné")
    .replace("{companyDescription}", company.description || "Non renseigné");

  log("Appel Grok avec web search...", "info");

  const text = await generateAIText({
    prompt,
    maxOutputTokens: 4096,
    webSearch: true,
  });

  // Parse JSON
  const cleaned = text
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "");

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON found in Enrichisseur response");
  }

  const result: EnrichResult = JSON.parse(cleaned.substring(start, end + 1));
  const contacts = Array.isArray(result.contacts) ? result.contacts : [];
  const verifiedContacts = contacts.filter((contact) => {
    const relevance = getContactRelevance(contact.role);
    const hasUsableEmail =
      contact.email &&
      isUsableEmailStatus(contact.email_status) &&
      isBusinessEmailForCompany(contact.email, companyDomain);

    return (
      contact.current_at_company === true &&
      contact.verification_status === "verified_current" &&
      contact.confidence !== "low" &&
      relevance >= 2 &&
      Boolean(contact.name) &&
      Boolean(contact.role) &&
      Boolean(contact.evidence) &&
      (!contact.email || hasUsableEmail)
    );
  }).map((contact) => ({
    ...contact,
    email: isUsableEmailStatus(contact.email_status) ? contact.email : null,
    email_status: contact.email ? contact.email_status : "missing",
  }));
  const rejectedCount = contacts.length - verifiedContacts.length;

  result.contacts = await enrichEmailDiscovery(company, verifiedContacts, log);

  if (rejectedCount > 0) {
    log(
      `${rejectedCount} contact(s) ignoré(s) car non vérifié(s) comme actuellement en poste`,
      "info"
    );
  }

  log(`${result.contacts.length} contact(s) vérifié(s)`, "success");
  result.contacts.forEach((c, i) => {
    log(
      `  ${i + 1}. ${c.role} [${c.confidence}] · contactabilité: ${c.email_status}`,
      "data"
    );
  });

  if (result.company_insights) {
    log(`Insight : ${result.company_insights}`, "info");
  }

  return result;
}

async function enrichEmailDiscovery(
  company: Company,
  contacts: EnrichContact[],
  log: LogCallback
): Promise<EnrichContact[]> {
  const companyDomain = getCompanyDomain(company.website);
  if (!companyDomain || contacts.length === 0) return contacts;

  const enrichedContacts: EnrichContact[] = [];

  for (const contact of contacts.slice(0, 3)) {
    if (contact.email && isUsableEmailStatus(contact.email_status)) {
      enrichedContacts.push(contact);
      continue;
    }

    log(`Recherche du pattern email pour ${contact.name}...`, "info");

    try {
      const discovery = await discoverEmailPattern(company, contact, companyDomain);
      const fallbackCandidates = generateEmailCandidates(contact.name, companyDomain);
      const candidates = uniqueEmails([
        ...(discovery.email_candidates || []),
        ...fallbackCandidates,
      ]).slice(0, 6);
      const hasUsableExactEmail =
        discovery.email &&
        isUsableEmailStatus(discovery.email_status) &&
        isBusinessEmailForCompany(discovery.email, companyDomain);

      enrichedContacts.push({
        ...contact,
        email: hasUsableExactEmail ? discovery.email : null,
        email_status: hasUsableExactEmail
          ? discovery.email_status
          : candidates.length > 0
            ? "guessed"
            : "missing",
        email_pattern: discovery.email_pattern || inferPatternFromCandidates(candidates),
        email_candidates: candidates,
        email_evidence:
          discovery.email_evidence ||
          (candidates.length > 0
            ? "Candidats générés depuis les patterns email B2B courants, non vérifiés."
            : null),
      });
    } catch (error) {
      log(
        `Pattern email non déterminé pour ${contact.name}: ${
          error instanceof Error ? error.message : "erreur inconnue"
        }`,
        "info"
      );
      enrichedContacts.push({
        ...contact,
        email_status: "missing",
        email_candidates: generateEmailCandidates(contact.name, companyDomain).slice(0, 6),
        email_evidence:
          "Aucun pattern vérifié trouvé. Candidats uniquement indicatifs, non envoyables.",
      });
    }
  }

  return enrichedContacts;
}

async function discoverEmailPattern(
  company: Company,
  contact: EnrichContact,
  companyDomain: string
): Promise<{
  email: string | null;
  email_status: "verified" | "public_source" | "guessed" | "missing";
  email_pattern: string | null;
  email_candidates: string[];
  email_evidence: string | null;
  confidence: "high" | "medium" | "low";
}> {
  const prompt = EMAIL_PATTERN_PROMPT
    .replaceAll("{companyName}", company.name)
    .replaceAll("{companyDomain}", companyDomain)
    .replaceAll("{companyWebsite}", company.website || companyDomain)
    .replaceAll("{contactName}", contact.name)
    .replaceAll("{contactRole}", contact.role)
    .replaceAll("{contactSource}", contact.linkedin || contact.source || "Non renseigné");

  const text = await generateAIText({
    prompt,
    maxOutputTokens: 2048,
    webSearch: true,
  });

  const cleaned = text
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "");

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON found in email pattern response");
  }

  return JSON.parse(cleaned.substring(start, end + 1));
}

function generateEmailCandidates(name: string, domain: string): string[] {
  const parts = normalizeNameParts(name);
  if (parts.length < 2) return [];

  const first = parts[0];
  const last = parts[parts.length - 1];
  const firstInitial = first.charAt(0);

  return uniqueEmails([
    `${first}.${last}@${domain}`,
    `${first}${last}@${domain}`,
    `${first}_${last}@${domain}`,
    `${first}-${last}@${domain}`,
    `${firstInitial}${last}@${domain}`,
    `${first}@${domain}`,
  ]);
}

function normalizeNameParts(name: string): string[] {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean);
}

function uniqueEmails(emails: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      emails
        .filter((email): email is string => Boolean(email))
        .map((email) => email.toLowerCase().trim())
        .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    )
  );
}

function inferPatternFromCandidates(candidates: string[]): string {
  const local = candidates[0]?.split("@")[0] || "";
  if (local.includes(".")) return "prenom.nom";
  if (local.includes("_")) return "prenom_nom";
  if (local.includes("-")) return "prenom-nom";
  return candidates.length > 0 ? "unknown_candidates" : "unknown";
}

async function tryApolloSearch(company: Company, log: LogCallback): Promise<EnrichContact[]> {
  const contacts = await searchStructuredContactProviders(company, (message) =>
    log(message, "info")
  );

  if (contacts.length === 0) {
    log("Aucun provider structuré disponible — passage en web search stricte", "info");
  }

  return contacts;
}
