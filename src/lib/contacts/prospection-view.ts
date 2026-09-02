import { getContactReadiness, type ContactReadinessSummary } from "./readiness";
import { redactContactIntelligence } from "@/lib/privacy/contact-redaction";
import type { ScoreDetails } from "@/types";

export type ProspectionContact = {
  id: string;
  roleRaw: string;
  roleNormalized: string;
  employmentStatus: string;
  contactability: string;
  relevanceScore: number;
  contactScore: number | null;
  readinessStatus: ContactReadinessSummary["status"];
};

type ReadinessContacts = Parameters<typeof getContactReadiness>[0];
type ContactInput = ReadinessContacts[number] & {
  roleRaw: string;
  roleNormalized: string;
  employmentStatus: string;
  contactability: string;
  relevanceScore: number;
  contactScore: number | null;
};

// This allowlist deliberately never serializes names, addresses or evidence.
// Administrators can inspect those details on the company page.
export function getProspectionContactView(
  contacts: ContactInput[],
  options?: Parameters<typeof getContactReadiness>[1],
) {
  const names = contacts.map((contact) => contact.fullName);
  return {
    readiness: getContactReadiness(contacts, options),
    contacts: contacts.map((contact): ProspectionContact => {
      const readinessStatus = getContactReadiness([contact], options).status;
      return {
        id: contact.id,
        roleRaw: redactProspectionContext(contact.roleRaw, names) || "Contact",
        roleNormalized: contact.roleNormalized,
        employmentStatus: contact.employmentStatus,
        contactability:
          readinessStatus === "incomplete"
            ? contact.contactability
            : "verified",
        relevanceScore: contact.relevanceScore,
        contactScore: contact.contactScore,
        readinessStatus,
      };
    }),
  };
}

export function redactProspectionContext(
  value: string | null,
  names: Array<string | null | undefined>,
): string | null {
  if (!value) return value;
  return redactContactIntelligence(value, names).replace(
    /(?:https?:\/\/)?(?:[\w-]+\.)?linkedin\.com\/[^\s<>\])]+/gi,
    "profil professionnel protégé",
  );
}

export function getProspectionScoreDetails(
  value: unknown,
): Partial<ScoreDetails> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const result: Partial<ScoreDetails> = {};
  const criteria: Array<keyof ScoreDetails> = [
    "image_coherence",
    "audience_fit",
    "sponsoring_history",
    "conversion_potential",
    "accessibility",
    "timing",
    "exclusivity_risk",
    "brand_momentum",
  ];
  for (const criterion of criteria) {
    const score = source[criterion];
    if (typeof score === "number" && Number.isFinite(score)) {
      result[criterion] = Math.max(0, Math.min(10, score));
    }
  }
  return Object.keys(result).length ? result : null;
}
