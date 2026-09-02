import { randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Longer than either enrichment's 265s deadline or Vercel's 300s invocation.
export const COMPANY_ENRICHMENT_LEASE_MS = 330_000;
export const INTERNAL_CONTACT_ACTIVITY_TYPES = [
  "scan_contact_qualification",
  "contact_enrichment_lease",
] as const;

export interface CompanyEnrichmentLease {
  companyId: string;
  token: string;
  version: number;
  expiresAt: number;
}

type LeaseMetadata = CompanyEnrichmentLease & {
  schemaVersion: 1;
  status: "held" | "released";
};
type LeaseDatabase = Pick<PrismaClient, "activityLog">;
const LEASE_TYPE = "contact_enrichment_lease";
const leaseId = (companyId: string) => `contact-enrichment-lease:${companyId}`;

function heldMetadata(lease: CompanyEnrichmentLease): LeaseMetadata {
  return { schemaVersion: 1, ...lease, status: "held" };
}

function jsonMetadata(metadata: LeaseMetadata): Prisma.InputJsonObject {
  return { ...metadata };
}

function parseMetadata(value: unknown, companyId: string): LeaseMetadata | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (Object.keys(row).some((key) => !["schemaVersion", "companyId", "token", "version", "expiresAt", "status"].includes(key)) ||
    row.schemaVersion !== 1 || row.companyId !== companyId ||
    typeof row.token !== "string" || !row.token ||
    !Number.isSafeInteger(row.version) || Number(row.version) < 1 || Number(row.version) >= Number.MAX_SAFE_INTEGER - 1 ||
    typeof row.expiresAt !== "number" || !Number.isFinite(row.expiresAt) || row.expiresAt < 0 ||
    (row.status !== "held" && row.status !== "released")) return null;
  return {
    schemaVersion: 1, companyId, token: row.token,
    version: Number(row.version), expiresAt: row.expiresAt, status: row.status,
  };
}

function isUniqueConflict(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

/** Shared by manual searches and automatic scan qualification. Never performs a provider call. */
export async function acquireCompanyEnrichmentLease(
  companyId: string,
  token: string = randomUUID(),
  now = Date.now(),
  db: LeaseDatabase = prisma,
): Promise<CompanyEnrichmentLease | null> {
  if (!companyId.trim() || companyId.length > 200 || !token.trim() || token.length > 200 ||
    !Number.isFinite(now) || now < 0) throw new Error("Invalid enrichment lease input");
  const id = leaseId(companyId);
  const existing = await db.activityLog.findUnique({ where: { id }, select: { type: true, metadata: true } });
  const previous = existing?.type === LEASE_TYPE ? parseMetadata(existing.metadata, companyId) : null;
  // Unknown persisted states are never silently reset into a new paid attempt.
  if (existing && (!previous || (previous.status === "held" && previous.expiresAt > now))) return null;
  const lease: CompanyEnrichmentLease = {
    companyId, token, version: (previous?.version || 0) + 1,
    expiresAt: now + COMPANY_ENRICHMENT_LEASE_MS,
  };
  const metadata = jsonMetadata(heldMetadata(lease));
  if (!existing) {
    try {
      await db.activityLog.create({ data: { id, type: LEASE_TYPE, message: "Verrou interne d’enrichissement", metadata } });
      return lease;
    } catch (error) {
      // Another invocation won the unique key. Do not retry the paid work.
      if (isUniqueConflict(error)) return null;
      throw error;
    }
  }
  const claimed = await db.activityLog.updateMany({
    where: { id, type: LEASE_TYPE, metadata: { equals: jsonMetadata(previous!) } },
    data: { metadata },
  });
  return claimed.count === 1 ? lease : null;
}

/** Old workers cannot release a successor's lease, even if a token is reused. */
export async function releaseCompanyEnrichmentLease(
  lease: CompanyEnrichmentLease,
  db: LeaseDatabase = prisma,
): Promise<boolean> {
  const released = await db.activityLog.updateMany({
    where: { id: leaseId(lease.companyId), type: LEASE_TYPE, metadata: { equals: jsonMetadata(heldMetadata(lease)) } },
    data: { metadata: jsonMetadata({ ...heldMetadata(lease), status: "released", expiresAt: 0, version: lease.version + 1 }) },
  });
  return released.count === 1;
}

/** Check before persisting a result; a timed-out worker must not overwrite newer work. */
export async function isCompanyEnrichmentLeaseHeld(
  lease: CompanyEnrichmentLease,
  now = Date.now(),
  db: LeaseDatabase = prisma,
): Promise<boolean> {
  if (!Number.isFinite(now) || lease.expiresAt <= now) return false;
  const row = await db.activityLog.findUnique({
    where: { id: leaseId(lease.companyId) }, select: { type: true, metadata: true },
  });
  const current = row?.type === LEASE_TYPE ? parseMetadata(row.metadata, lease.companyId) : null;
  return Boolean(current && current.status === "held" && current.token === lease.token &&
    current.version === lease.version && current.expiresAt === lease.expiresAt);
}
