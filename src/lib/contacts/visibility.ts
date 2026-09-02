import type { ContactDiscoveryDiagnostic, PublicContactSummary } from "./types";

/** Use an allowlist, not text masking, for non-admin API payloads. */
export function visibleContact(contact: PublicContactSummary, isAdmin: boolean): PublicContactSummary {
  if (isAdmin) return contact;
  return {
    id: contact.id, kind: contact.kind, role: contact.role, roleNormalized: contact.roleNormalized,
    currentRoleVerified: contact.currentRoleVerified, contactability: contact.contactability,
    relevance: contact.relevance, score: contact.score, scoreVersion: contact.scoreVersion,
    source: null,
  };
}

export function visibleDiagnostics(diagnostics: ContactDiscoveryDiagnostic[], isAdmin: boolean): ContactDiscoveryDiagnostic[] {
  if (isAdmin) return diagnostics;
  const labels: Record<ContactDiscoveryDiagnostic["stage"], string> = {
    company_resolution: "Identification de l’entreprise et de ses sources officielles",
    people_search: "Recherche des fonctions décisionnaires actuelles",
    email_enrichment: "Recherche des coordonnées professionnelles",
    email_verification: "Vérification des coordonnées professionnelles",
    public_web_search: "Vérification des sources publiques",
    budget: "Contrôle des limites de recherche",
  };
  return diagnostics.map((diagnostic) => ({
    provider: diagnostic.provider, stage: diagnostic.stage, status: diagnostic.status,
    message: labels[diagnostic.stage], matched: diagnostic.matched, usableEmails: diagnostic.usableEmails,
  }));
}
