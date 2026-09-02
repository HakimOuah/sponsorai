import { prisma } from "@/lib/prisma";
import { runEnrichisseur } from "@/lib/agents/enrichisseur";
import { persistContactCandidates } from "@/lib/contacts/persistence";
import { getCurrentUserAccess } from "@/lib/auth/access";
import { createEnrichmentHandler } from "@/lib/contacts/enrichment-handler";
import { acquireCompanyEnrichmentLease, releaseCompanyEnrichmentLease, isCompanyEnrichmentLeaseHeld } from "@/lib/contacts/enrichment-lease";

export const runtime = "nodejs";
export const maxDuration = 300;

export const POST = createEnrichmentHandler({
  getAccess: getCurrentUserAccess,
  acquireLease: acquireCompanyEnrichmentLease,
  releaseLease: releaseCompanyEnrichmentLease,
  isLeaseHeld: isCompanyEnrichmentLeaseHeld,
  findCompany: (id) => prisma.company.findUnique({ where: { id } }),
  enrich: runEnrichisseur,
  persist: persistContactCandidates,
  updateCompany: (id, data) => prisma.company.update({ where: { id }, data }),
  recordActivity: ({ message, companyId, decisionMakers, usableEmails, diagnostics }) =>
    prisma.activityLog.create({
      data: {
        type: "scan_completed",
        message,
        metadata: { companyId, decisionMakers, usableEmails, diagnostics: diagnostics.map((item) => ({ ...item })) },
      },
    }),
  reportError: (context) => console.error("[enrichisseur] recherche interrompue", context),
});
