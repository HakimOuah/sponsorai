import type { Company } from "@prisma/client";
import { isUsableEmailStatus } from "@/lib/agents/contact-quality";
import type { ContactCandidate } from "./types";

/** Keep identity, address and verification evidence from the SAME candidate. */
export function companyContactUpdate(company: Company, candidate?: ContactCandidate, rejectedEmails: string[] = []) {
  const rejected = rejectedEmails.includes(company.contactEmail?.toLowerCase() || "");
  const invalidation = rejected ? { contactEmailStatus: "missing", outreachReady: false } : null;
  if (!candidate || !candidate.current_at_company || candidate.verification_status !== "verified_current") return invalidation;
  const usable = Boolean(candidate.email && isUsableEmailStatus(candidate.email_status));
  // Preserve an existing qualified recipient rather than mix their address with a new person's name.
  if (company.contactEmail && !rejected && (
    !usable || (isUsableEmailStatus(company.contactEmailStatus) &&
      company.contactEmail.toLowerCase() !== candidate.email?.toLowerCase())
  )) return null;
  return {
    contactName: candidate.name,
    contactRole: candidate.role,
    contactEmail: usable ? candidate.email : null,
    contactLinkedin: candidate.linkedin,
    contactVerificationStatus: candidate.verification_status,
    contactEmailStatus: usable ? candidate.email_status : "missing",
    contactRoleRelevance: candidate.role_relevance || "medium",
    contactEvidence: [candidate.evidence, candidate.email_evidence].filter(Boolean).join(" — "),
    contactSource: candidate.source,
    outreachReady: usable,
  };
}
