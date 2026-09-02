/** Persisted orchestration state. Never store contact details or provider payloads here. */
export const QUALIFICATION_TYPE = "scan_contact_qualification";
export const QUALIFICATION_LIMIT = 5;
export const QUALIFICATION_BUDGET_USD = 1.50;
export const QUALIFICATION_COMPANY_USD = 0.50;
export const QUALIFICATION_LEASE_MS = 330_000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type QualificationItemStatus = "pending" | "running" | "ready_person" | "ready_generic" | "incomplete" | "budget" | "interrupted" | "unavailable";
export interface QualificationItem {
  prospectId: string;
  companyId: string;
  status: QualificationItemStatus;
  reused: boolean;
  reservedUsd: number;
  costUsd: number | null;
}
export interface ScanQualification {
  id: string;
  scanId: string;
  playerId: string;
  ownerUserId: string;
  version: number;
  status: "pending" | "running" | "completed" | "partial";
  createdAt: number;
  updatedAt: number;
  retryAt: number;
  budgetUsd: number;
  reservedUsd: number;
  items: QualificationItem[];
  lease: { token: string; expiresAt: number; prospectId: string } | null;
}
export interface QualificationView {
  id: string;
  playerId: string;
  status: ScanQualification["status"];
  total: number;
  processed: number;
  readyPeople: number;
  readyGeneric: number;
  reused: number;
  incomplete: number;
  budgetLimited: boolean;
  interrupted: boolean;
  retryAfterMs: number;
  updatedAt: number;
  budget?: { limitUsd: number; reservedUsd: number; actualUsd: number | null };
}
export function createScanQualification(input: {
  scanId: string; playerId: string; ownerUserId: string;
  prospects: Array<{ id: string; companyId: string; score: number | null; status: string }>;
}, now = Date.now()): ScanQualification {
  const seen = new Set<string>();
  const candidates = input.prospects.filter((p) => (p.score ?? 0) >= 6 && p.status === "new")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.id.localeCompare(b.id))
    .filter((p) => { if (seen.has(p.companyId)) return false; seen.add(p.companyId); return true; })
    .slice(0, QUALIFICATION_LIMIT);
  return {
    id: `scan-qualification:${input.scanId}`, scanId: input.scanId, playerId: input.playerId,
    ownerUserId: input.ownerUserId, version: 0, status: candidates.length ? "pending" : "completed",
    createdAt: now, updatedAt: now, retryAt: 0, budgetUsd: QUALIFICATION_BUDGET_USD,
    reservedUsd: 0, lease: null,
    items: candidates.map((p) => ({ prospectId: p.id, companyId: p.companyId, status: "pending", reused: false, reservedUsd: 0, costUsd: 0 })),
  };
}

export function qualificationView(job: ScanQualification, isAdmin = false, now = Date.now()): QualificationView {
  const count = (status: QualificationItemStatus) => job.items.filter((item) => item.status === status).length;
  return {
    id: job.id, playerId: job.playerId, status: job.status, total: job.items.length,
    processed: job.items.filter((i) => i.status !== "pending" && i.status !== "running").length,
    readyPeople: count("ready_person"), readyGeneric: count("ready_generic"),
    reused: job.items.filter((i) => i.reused).length,
    incomplete: count("incomplete") + count("budget") + count("interrupted") + count("unavailable"),
    budgetLimited: count("budget") > 0, interrupted: count("interrupted") > 0,
    retryAfterMs: job.lease ? job.lease.expiresAt <= now ? 0 : Math.max(1000, Math.min(10_000, job.lease.expiresAt - now)) : Math.max(0, job.retryAt - now),
    updatedAt: job.updatedAt,
    ...(isAdmin ? { budget: {
      limitUsd: job.budgetUsd, reservedUsd: job.reservedUsd,
      actualUsd: job.items.every((i) => i.costUsd !== null) ? round(job.items.reduce((sum, i) => sum + (i.costUsd ?? 0), 0)) : null,
    } } : {}),
  };
}

type ReadyStatus = "ready_person" | "ready_generic" | "incomplete";
export interface QualificationDependencies<Lease = unknown> {
  read: (id: string) => Promise<ScanQualification | null>;
  compareAndSwap: (before: ScanQualification, after: ScanQualification) => Promise<boolean>;
  readiness: (companyId: string) => Promise<ReadyStatus>;
  acquireCompany: (companyId: string) => Promise<Lease | null>;
  releaseCompany: (lease: Lease) => Promise<unknown>;
  enrich: (companyId: string, allowanceUsd: number, lease: Lease, stillOwned: () => Promise<boolean>) => Promise<{ status: ReadyStatus; costUsd: number | null }>;
  configured: () => boolean;
  token: () => string;
  now: () => number;
}

/** One bounded step. Compare-and-swap plus company leases fence concurrent tabs and scans. */
export async function advanceScanQualification<Lease>(id: string, ownerUserId: string, isAdmin: boolean, deps: QualificationDependencies<Lease>): Promise<ScanQualification | null> {
  let job = await deps.read(id);
  if (!job || (job.ownerUserId !== ownerUserId && !isAdmin)) return null;
  if (job.status === "completed" || job.status === "partial") return job;
  const now = deps.now();
  if (job.lease && job.lease.expiresAt > now) return job;
  // An abandoned paid request has an unknown outcome. Never automatically repeat it.
  if (job.lease || now - job.createdAt > MAX_AGE_MS) {
    const stopped = next(job, now);
    stopped.items = stopped.items.map((item) => item.status === "pending" || item.status === "running"
      ? { ...item, status: "interrupted", costUsd: item.reservedUsd > 0 ? null : item.costUsd } : item);
    stopped.lease = null;
    stopped.status = "partial";
    await deps.compareAndSwap(job, stopped);
    return deps.read(id);
  }
  if (job.retryAt > now) return job;
  const index = job.items.findIndex((item) => item.status === "pending");
  if (index < 0) return job;
  const claimed = next(job, now);
  claimed.status = "running";
  claimed.items[index].status = "running";
  claimed.lease = { token: deps.token(), expiresAt: now + QUALIFICATION_LEASE_MS, prospectId: claimed.items[index].prospectId };
  if (!await deps.compareAndSwap(job, claimed)) return deps.read(id);
  job = claimed;
  let companyLease: Lease | null = null;
  const commit = async (updated: ScanQualification) => {
    const ok = await deps.compareAndSwap(job!, updated);
    if (ok) job = updated;
    return ok;
  };
  const finish = async (status: QualificationItemStatus, costUsd: number | null, reused = false) => {
    const done = next(job!, deps.now());
    done.items[index] = { ...done.items[index], status, costUsd, reused };
    done.lease = null;
    done.retryAt = 0;
    done.status = done.items.some((i) => i.status === "pending") ? "pending"
      : done.items.some((i) => ["budget", "interrupted", "unavailable"].includes(i.status)) ? "partial" : "completed";
    await commit(done);
  };
  try {
    companyLease = await deps.acquireCompany(job.items[index].companyId);
    if (!companyLease) {
      const waiting = next(job, deps.now());
      waiting.lease = null;
      waiting.status = "pending";
      waiting.items[index].status = "pending";
      waiting.retryAt = deps.now() + 10_000;
      await commit(waiting);
      return deps.read(id);
    }
    const cached = await deps.readiness(job.items[index].companyId);
    if (!job.lease || job.lease.expiresAt <= deps.now()) {
      await finish("interrupted", 0);
      return deps.read(id);
    }
    const current = await deps.read(id);
    if (current?.version !== job.version || current.lease?.token !== job.lease.token) return current;
    if (cached !== "incomplete") {
      await finish(cached, 0, true);
      return deps.read(id);
    }
    if (!deps.configured()) {
      await finish("unavailable", 0);
      return deps.read(id);
    }
    const allowance = round(Math.min(QUALIFICATION_COMPANY_USD, job.budgetUsd - job.reservedUsd));
    if (allowance <= 0) {
      await finish("budget", 0);
      return deps.read(id);
    }
    const reserved = next(job, deps.now());
    reserved.reservedUsd = round(reserved.reservedUsd + allowance);
    reserved.items[index].reservedUsd = allowance;
    reserved.items[index].costUsd = null;
    if (!await commit(reserved)) return deps.read(id);
    if (!job.lease || job.lease.expiresAt <= deps.now()) {
      await finish("interrupted", 0);
      return deps.read(id);
    }
    const ownedVersion = job.version;
    const result = await deps.enrich(job.items[index].companyId, allowance, companyLease, async () => {
      const current = await deps.read(id);
      return current?.version === ownedVersion && current.lease?.token === job!.lease?.token && current.lease!.expiresAt > deps.now();
    });
    if (!job.lease || job.lease.expiresAt <= deps.now()) {
      await finish("interrupted", null);
      return deps.read(id);
    }
    // Unknown charges retain their full reservation. Do not promise an observed cost of zero.
    const cost = typeof result.costUsd === "number" && Number.isFinite(result.costUsd) && result.costUsd >= 0 ? result.costUsd : null;
    await finish(result.status, cost);
  } catch {
    await finish("unavailable", job.items[index].reservedUsd > 0 ? null : 0);
  } finally {
    if (companyLease) await deps.releaseCompany(companyLease).catch(() => undefined);
  }
  return deps.read(id);
}

function next(job: ScanQualification, now: number): ScanQualification {
  return { ...job, version: job.version + 1, updatedAt: now, items: job.items.map((i) => ({ ...i })) };
}
function round(value: number): number { return Math.round(value * 1_000_000) / 1_000_000; }
