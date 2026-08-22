import { generateAIText } from "@/lib/ai";
import {
  COMPANY_MAILBOX_PROMPT,
  EMAIL_PATTERN_PROMPT,
  ENRICHISSEUR_PROMPT,
} from "./prompts";
import type { Company } from "@prisma/client";
import type { LogCallback } from "./scout";
import { searchStructuredContactProviders } from "@/lib/contacts/providers";
import type {
  ContactCandidate,
  ContactDiscoveryDiagnostic,
  ContactProviderSearchResult,
} from "@/lib/contacts/types";
import {
  getCompanyDomain,
  getContactRelevance,
  isUsableEmailStatus,
} from "./contact-quality";

export type EnrichContact = ContactCandidate;

export interface EnrichResult {
  contacts: EnrichContact[];
  company_insights: string;
  diagnostics: ContactDiscoveryDiagnostic[];
}

export async function runEnrichisseur(
  company: Company,
  log: LogCallback
): Promise<EnrichResult> {
  log(`Recherche de contacts pour ${company.name}...`, "info");
  const companyDomain = getCompanyDomain(company.website);

  const apolloResult = await tryApolloSearch(company, log);
  if (apolloResult.contacts.length > 0) {
    log(
      `${apolloResult.contacts.length} décideur(s) identifié(s) via Apollo`,
      "success",
    );
    const emailDiscovery = await enrichEmailDiscovery(
      company,
      apolloResult.contacts,
      log,
    );
    const usableEmails = countUsableEmails(emailDiscovery.contacts);
    return {
      contacts: emailDiscovery.contacts,
      company_insights:
        `${apolloResult.contacts.length} décideur(s) actuel(s) issu(s) d’Apollo · ${usableEmails} email(s) exploitable(s) après vérification et recherche publique.`,
      diagnostics: [...apolloResult.diagnostics, emailDiscovery.diagnostic],
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

  const parsed = JSON.parse(cleaned.substring(start, end + 1)) as {
    contacts?: EnrichContact[];
    company_insights?: string;
  };
  const result: EnrichResult = {
    contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
    company_insights: parsed.company_insights || "",
    diagnostics: [],
  };
  const contacts = result.contacts;
  const verifiedContacts = contacts.filter((contact) => {
    const relevance = getContactRelevance(contact.role);

    return (
      contact.current_at_company === true &&
      contact.verification_status === "verified_current" &&
      contact.confidence !== "low" &&
      relevance >= 2 &&
      Boolean(contact.name) &&
      Boolean(contact.role) &&
      Boolean(contact.evidence)
    );
  }).map((contact) => {
    const hasPublicEmail = isPublicSourceEmailUsable(contact, companyDomain);

    return {
      ...contact,
      email: hasPublicEmail ? contact.email : null,
      email_status: hasPublicEmail
        ? "public_source" as const
        : "missing" as const,
      email_source: hasPublicEmail ? contact.source : null,
    };
  });
  const rejectedCount = contacts.length - verifiedContacts.length;

  const emailDiscovery = await enrichEmailDiscovery(
    company,
    verifiedContacts,
    log,
    result.company_insights,
  );
  result.contacts = emailDiscovery.contacts;
  const usableEmails = countUsableEmails(result.contacts);
  result.company_insights = [
    result.company_insights,
    `${result.contacts.length} décideur(s) actuel(s) identifié(s) · ${usableEmails} email(s) exploitable(s).`,
  ]
    .filter(Boolean)
    .join(" ");
  result.diagnostics = [
    ...apolloResult.diagnostics,
    {
      provider: "web_search",
      stage: "people_search",
      status: verifiedContacts.length > 0 ? "success" : "no_result",
      message:
        verifiedContacts.length > 0
          ? `${verifiedContacts.length} décideur(s) actuel(s) identifié(s) par recherche publique.`
          : "La recherche publique n’a identifié aucun décideur actuel suffisamment fiable.",
      matched: verifiedContacts.length,
    },
    emailDiscovery.diagnostic,
  ];

  if (rejectedCount > 0) {
    log(
      `${rejectedCount} contact(s) ignoré(s) car non vérifié(s) comme actuellement en poste`,
      "info"
    );
  }

  log(
    `${result.contacts.length} décideur(s) actuel(s) · ${usableEmails} email(s) exploitable(s)`,
    usableEmails > 0 ? "success" : "info",
  );
  result.contacts.forEach((c, i) => {
    log(
      `  ${i + 1}. ${c.role} [${c.confidence}] · contactabilité: ${c.email_status}`,
      "data"
    );
  });

  if (result.company_insights) {
    log("Contexte entreprise consolidé pour prioriser les décideurs.", "info");
  }

  return result;
}

async function enrichEmailDiscovery(
  company: Company,
  contacts: EnrichContact[],
  log: LogCallback,
  companyInsight = "Aucun indice préalable",
): Promise<{
  contacts: EnrichContact[];
  diagnostic: ContactDiscoveryDiagnostic;
}> {
  const companyDomain = getCompanyDomain(company.website);
  if (!companyDomain || contacts.length === 0) {
    return {
      contacts,
      diagnostic: {
        provider: "web_search",
        stage: "public_web_search",
        status: "no_result",
        message: !companyDomain
          ? "Recherche d’emails publics impossible sans domaine entreprise."
          : "Aucun décideur à enrichir par recherche publique.",
        requested: 0,
        usableEmails: countUsableEmails(contacts),
      },
    };
  }

  const enrichedContacts: EnrichContact[] = [];
  let attempted = 0;
  let publicEmailsFound = 0;
  let functionalMailboxFound = false;

  for (const contact of contacts.slice(0, 3)) {
    if (contact.email && isUsableEmailStatus(contact.email_status)) {
      enrichedContacts.push(contact);
      continue;
    }

    attempted += 1;
    log(`Recherche d’une coordonnée pour le rôle ${contact.role}...`, "info");

    try {
      const discovery = await discoverEmailPattern(company, contact, companyDomain);
      const fallbackCandidates = generateEmailCandidates(contact.name, companyDomain);
      const candidates = uniqueEmails([
        ...(discovery.email_candidates || []),
        ...fallbackCandidates,
      ]).slice(0, 6);
      const hasUsableExactEmail =
        discovery.email &&
        discovery.email_status === "public_source" &&
        Boolean(discovery.email_evidence) &&
        isHttpUrl(discovery.source_url) &&
        (isOfficialCompanySource(discovery.source_url, companyDomain) ||
          isEmailDomainSource(discovery.source_url, discovery.email));

      if (hasUsableExactEmail) publicEmailsFound += 1;

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
        email_source: hasUsableExactEmail ? discovery.source_url : null,
        email_kind: hasUsableExactEmail ? discovery.email_kind : "unknown",
        email_evidence:
          hasUsableExactEmail
            ? `${discovery.email_evidence} — Source: ${discovery.source_url}`
            : candidates.length > 0
              ? "Candidats générés depuis les patterns email B2B courants, non vérifiés."
              : discovery.email_evidence || null,
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
        email_kind: "unknown",
        email_candidates: generateEmailCandidates(contact.name, companyDomain).slice(0, 6),
        email_evidence:
          "Aucun pattern vérifié trouvé. Candidats uniquement indicatifs, non envoyables.",
      });
    }
  }

  if (
    enrichedContacts.length > 0 &&
    countUsableEmails(enrichedContacts) === 0
  ) {
    log(
      "Aucun email personnel confirmé — recherche d’une boîte fonctionnelle officielle...",
      "info",
    );

    try {
      const mailbox = await discoverCompanyMailbox(
        company,
        companyDomain,
        companyInsight,
      );
      const mailboxEmail = mailbox.email?.trim().toLowerCase() || null;
      const hasUsableMailbox = Boolean(
        mailboxEmail &&
        mailbox.email_status === "public_source" &&
        Boolean(mailbox.evidence) &&
        isHttpUrl(mailbox.source_url) &&
        isRelevantCompanyMailbox(mailboxEmail) &&
        (isOfficialCompanySource(mailbox.source_url, companyDomain) ||
          isEmailDomainSource(mailbox.source_url, mailboxEmail)),
      );

      if (hasUsableMailbox && mailboxEmail) {
        const primaryContact = enrichedContacts[0];
        enrichedContacts[0] = {
          ...primaryContact,
          email: mailboxEmail,
          email_status: "public_source",
          email_kind: "functional_generic",
          email_source: mailbox.source_url,
          email_evidence: `Boîte fonctionnelle ${mailbox.category} de l’entreprise, non personnelle : ${mailbox.evidence} — Source: ${mailbox.source_url}`,
        };
        publicEmailsFound += 1;
        functionalMailboxFound = true;
      }
    } catch (error) {
      log(
        `Recherche de boîte fonctionnelle interrompue : ${
          error instanceof Error ? error.message : "erreur inconnue"
        }`,
        "info",
      );
    }
  }

  const totalUsableEmails = countUsableEmails(enrichedContacts);
  const message = functionalMailboxFound
    ? "Aucun email personnel n’était disponible ; une boîte fonctionnelle officielle et pertinente a été trouvée avec sa source."
    : publicEmailsFound > 0
      ? `La recherche publique a trouvé ${publicEmailsFound} email${publicEmailsFound > 1 ? "s" : ""} attribuable${publicEmailsFound > 1 ? "s" : ""} avec source.`
    : attempted > 0
      ? "La recherche publique n’a trouvé aucun email exact et attribuable ; les variantes supposées restent bloquées."
      : "Tous les décideurs disposaient déjà d’un email exploitable ; aucune recherche publique supplémentaire nécessaire.";

  log(message, publicEmailsFound > 0 ? "success" : "info");

  return {
    contacts: enrichedContacts,
    diagnostic: {
      provider: "web_search",
      stage: "public_web_search",
      status: publicEmailsFound > 0
        ? "success"
        : attempted > 0
          ? "no_result"
          : "success",
      message,
      requested: attempted,
      matched: publicEmailsFound,
      usableEmails: totalUsableEmails,
    },
  };
}

async function discoverCompanyMailbox(
  company: Company,
  companyDomain: string,
  companyInsight: string,
): Promise<{
  email: string | null;
  email_status: "public_source" | "missing";
  email_kind: "functional_generic";
  category:
    | "sponsorship"
    | "partnerships"
    | "marketing"
    | "communications"
    | "press"
    | "general"
    | "none";
  source_url: string | null;
  evidence: string | null;
  confidence: "high" | "medium" | "low";
}> {
  const prompt = COMPANY_MAILBOX_PROMPT
    .replaceAll("{companyName}", company.name)
    .replaceAll("{companyDomain}", companyDomain)
    .replaceAll("{companyWebsite}", company.website || companyDomain)
    .replaceAll("{companyInsight}", companyInsight || "Aucun indice préalable");

  const text = await generateAIText({
    prompt,
    maxOutputTokens: 1600,
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
    throw new Error("Aucun résultat structuré pour la boîte fonctionnelle");
  }

  return JSON.parse(cleaned.substring(start, end + 1));
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
  source_url: string | null;
  email_kind: "personal_professional" | "functional_generic" | "unknown";
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

async function tryApolloSearch(
  company: Company,
  log: LogCallback,
): Promise<ContactProviderSearchResult> {
  const result = await searchStructuredContactProviders(company, (message) =>
    log(message, "info")
  );

  if (result.contacts.length === 0) {
    log("Aucun provider structuré disponible — passage en web search stricte", "info");
  }

  return result;
}

function countUsableEmails(contacts: EnrichContact[]): number {
  return contacts.filter(
    (contact) => contact.email && isUsableEmailStatus(contact.email_status),
  ).length;
}

function isHttpUrl(value?: string | null): value is string {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isOfficialCompanySource(
  sourceUrl: string | null,
  companyDomain: string,
): boolean {
  if (!isHttpUrl(sourceUrl)) return false;
  const hostname = new URL(sourceUrl).hostname.replace(/^www\./, "");
  return hostname === companyDomain || hostname.endsWith(`.${companyDomain}`);
}

function isEmailDomainSource(
  sourceUrl: string | null,
  email: string,
): boolean {
  if (!isHttpUrl(sourceUrl)) return false;
  const emailDomain = email.split("@")[1]?.toLowerCase().replace(/^www\./, "");
  if (!emailDomain) return false;
  const hostname = new URL(sourceUrl).hostname.replace(/^www\./, "");
  return hostname === emailDomain || hostname.endsWith(`.${emailDomain}`);
}

function isRelevantCompanyMailbox(email: string): boolean {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;

  const localPart = email.split("@")[0]?.toLowerCase() || "";
  const excludedPrefixes = [
    "support",
    "sav",
    "billing",
    "facturation",
    "recruiting",
    "recrutement",
    "jobs",
    "careers",
    "privacy",
    "dpo",
    "noreply",
    "no-reply",
  ];

  return !excludedPrefixes.some(
    (prefix) =>
      localPart === prefix ||
      localPart.startsWith(`${prefix}.`) ||
      localPart.startsWith(`${prefix}-`) ||
      localPart.startsWith(`${prefix}_`),
  );
}

function isPublicSourceEmailUsable(
  contact: EnrichContact,
  companyDomain: string | null,
): boolean {
  if (
    !contact.email ||
    contact.email_status !== "public_source" ||
    !contact.email_evidence ||
    !isHttpUrl(contact.source)
  ) {
    return false;
  }

  return (
    Boolean(
      companyDomain && isOfficialCompanySource(contact.source, companyDomain),
    ) || isEmailDomainSource(contact.source, contact.email)
  );
}
