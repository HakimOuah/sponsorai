import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getContactReadiness } from "./readiness";
import { MonidClient } from "./monid-client";
import { searchMonidContacts } from "./monid";
import { resolveCompanyContactContext } from "./company-context";
import { persistContactCandidates } from "./persistence";
import { acquireCompanyEnrichmentLease, releaseCompanyEnrichmentLease, isCompanyEnrichmentLeaseHeld } from "./enrichment-lease";
import {
  advanceScanQualification, createScanQualification, QUALIFICATION_TYPE,
  type ScanQualification,
} from "./scan-qualification";

function json(job: ScanQualification): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(job)) as Prisma.InputJsonValue;
}

function parseJob(value: Prisma.JsonValue): ScanQualification | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const job = value as unknown as ScanQualification;
  if (typeof job.id !== "string" || !job.id.startsWith("scan-qualification:") ||
    typeof job.ownerUserId !== "string" || typeof job.playerId !== "string" ||
    !Number.isSafeInteger(job.version) || !Array.isArray(job.items) || job.items.length > 5 ||
    !Number.isFinite(job.createdAt) || !Number.isFinite(job.budgetUsd) || job.budgetUsd > 1.50 ||
    !Number.isFinite(job.reservedUsd) || job.reservedUsd < 0 ||
    !["pending", "running", "completed", "partial"].includes(job.status)) return null;
  return job;
}

export async function readScanQualification(id: string): Promise<ScanQualification | null> {
  const record = await prisma.activityLog.findUnique({ where: { id } });
  return record?.type === QUALIFICATION_TYPE ? parseJob(record.metadata) : null;
}

/** Idempotent queue creation only; this never contacts a paid provider. */
export async function queueScanQualification(scanId: string, playerId: string, ownerUserId: string): Promise<string | undefined> {
  const prospects = await prisma.prospect.findMany({
    where: { scanId, playerId, score: { gte: 6 }, status: "new" },
    orderBy: [{ score: "desc" }, { id: "asc" }],
    take: 5,
    select: { id: true, companyId: true, score: true, status: true },
  });
  const job = createScanQualification({ scanId, playerId, ownerUserId, prospects });
  if (!job.items.length) return undefined;
  await prisma.activityLog.upsert({
    where: { id: job.id },
    create: { id: job.id, type: QUALIFICATION_TYPE, message: "Qualification automatique des contacts", metadata: json(job) },
    update: {},
  });
  return job.id;
}

export async function listOwnScanQualifications(ownerUserId: string): Promise<ScanQualification[]> {
  const owner = { metadata: { path: ["ownerUserId"], equals: ownerUserId } };
  const [active, recent] = await Promise.all([prisma.activityLog.findMany({
    where: {
      type: QUALIFICATION_TYPE,
      AND: [owner, { OR: [
        { metadata: { path: ["status"], equals: "pending" } },
        { metadata: { path: ["status"], equals: "running" } },
      ] }],
    },
    orderBy: { createdAt: "asc" }, take: 20, select: { metadata: true },
  }), prisma.activityLog.findMany({
    where: {
      type: QUALIFICATION_TYPE, ...owner,
      createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) },
    },
    orderBy: { createdAt: "desc" }, take: 20, select: { metadata: true },
  })]);
  // Old pending work must not be hidden behind twenty newer completed scans.
  const jobs = [...active, ...recent].map((r) => parseJob(r.metadata)).filter((job): job is ScanQualification => job !== null);
  return Array.from(new Map(jobs.map((job) => [job.id, job])).values()).sort((a, b) => b.createdAt - a.createdAt);
}

async function companyReadiness(companyId: string) {
  const contacts = await prisma.contact.findMany({
    where: { companyId, active: true },
    include: {
      contactEmails: true,
      emails: { where: { status: "bounced", direction: "outbound" }, select: { updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 1 },
    },
  });
  return getContactReadiness(contacts.map((c) => ({ ...c, lastBouncedAt: c.emails[0]?.updatedAt ?? null }))).status;
}

export function advanceStoredScanQualification(id: string, ownerUserId: string, isAdmin: boolean) {
  return advanceScanQualification(id, ownerUserId, isAdmin, {
    read: readScanQualification,
    compareAndSwap: async (before, after) => {
      const changed = await prisma.activityLog.updateMany({
        where: { id: before.id, type: QUALIFICATION_TYPE, metadata: { path: ["version"], equals: before.version } },
        data: { metadata: json(after) },
      });
      return changed.count === 1;
    },
    readiness: companyReadiness,
    acquireCompany: acquireCompanyEnrichmentLease,
    releaseCompany: releaseCompanyEnrichmentLease,
    configured: () => Boolean(process.env.MONID_API_KEY?.trim()),
    token: randomUUID,
    now: Date.now,
    enrich: async (companyId, allowanceUsd, lease, stillOwned) => {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (!company) throw new Error("Company no longer available");
      if (!await stillOwned() || !await isCompanyEnrichmentLeaseHeld(lease)) throw new Error("Qualification lease expired");
      const configured = Number(process.env.MONID_ENRICHMENT_MAX_USD || "0.50");
      const cap = Number.isFinite(configured) && configured > 0 ? Math.min(configured, allowanceUsd) : allowanceUsd;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180_000);
      const options = { signal: controller.signal, deadline: Date.now() + 175_000 };
      const client = new MonidClient({ ...options, maxCostUsd: cap });
      try {
        const result = await searchMonidContacts(company, undefined, options, {
          client,
          // Automatic qualification has a bounded Monid budget and NO extra LLM
          // call. Official-site discovery still supplies LinkedIn and mailboxes.
          resolveContext: (target, contextOptions) => resolveCompanyContactContext(target, contextOptions, { research: async () => ({}) }),
        });
        if (!await stillOwned() || !await isCompanyEnrichmentLeaseHeld(lease)) throw new Error("Qualification lease expired");
        await persistContactCandidates(companyId, result.contacts, { includePrivate: false, rejectedEmails: result.rejectedEmails });
        // Never select a contact, approve outreach or change pipeline on behalf of a user.
        return { status: await companyReadiness(companyId), costUsd: client.usage.costUsd };
      } finally {
        clearTimeout(timeout);
      }
    },
  });
}
