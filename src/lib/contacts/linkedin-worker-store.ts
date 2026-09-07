import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ContactSearchOptions } from "./types";
import type { DirectProfile, DirectResult } from "./linkedin-direct";

const JOB = "linkedin_direct_job";
const HEARTBEAT = "linkedin_direct_worker";
const HEARTBEAT_ID = "linkedin-direct-worker";
const unavailable = (): DirectResult => ({ status: "unavailable", profiles: [], excludedProfiles: [] });
type Job = { companyUrl: string; companyId: string; expiresAt: number; status: string; claim?: string; result?: DirectResult };
const json = (v: unknown) => v as Prisma.InputJsonValue;

export async function requestLinkedinJob(companyUrl: string, companyId: string, options: ContactSearchOptions, db: Pick<PrismaClient, "activityLog"> = prisma): Promise<DirectResult> {
  if (options.signal?.aborted) return unavailable();
  const heartbeat = await db.activityLog.findUnique({ where: { id: HEARTBEAT_ID } });
  const health = heartbeat?.metadata as { seenAt?: number; ready?: boolean } | null;
  if (!health?.ready || Date.now() - (health.seenAt || 0) > 30_000) return unavailable();
  // Preserve at least a minute for Hunter/Apollo within the caller's deadline.
  const expiresAt = Math.min(Date.now() + 90_000, (options.deadline ?? Infinity) - 65_000);
  if (expiresAt - Date.now() < 20_000) return unavailable();
  const id = `linkedin-direct:${randomUUID()}`;
  await db.activityLog.create({ data: { id, type: JOB, message: "Recherche LinkedIn interne", metadata: json({ companyUrl, companyId, expiresAt, status: "pending" }) } });
  try {
    while (Date.now() < expiresAt && !options.signal?.aborted) {
      await delay(1500, undefined, { signal: options.signal });
      const row = await db.activityLog.findUnique({ where: { id } });
      const job = row?.metadata as Job | null;
      if (job?.status === "done") return job.result || unavailable();
      if (!job || job.status === "failed") return unavailable();
    }
    return unavailable();
  } finally {
    // Ephemeral raw results must not remain in generic activity history.
    await db.activityLog.deleteMany({ where: { id, type: JOB } }).catch(() => undefined);
  }
}

export async function pollLinkedinJob(ready: boolean) {
  await prisma.activityLog.upsert({ where: { id: HEARTBEAT_ID },
    create: { id: HEARTBEAT_ID, type: HEARTBEAT, message: "État du connecteur LinkedIn", metadata: { seenAt: Date.now(), ready } },
    update: { metadata: { seenAt: Date.now(), ready } },
  });
  await prisma.activityLog.deleteMany({ where: { type: JOB, createdAt: { lt: new Date(Date.now() - 600_000) } } });
  if (!ready) return null;
  const rows = await prisma.activityLog.findMany({ where: { type: JOB, metadata: { path: ["status"], equals: "pending" } }, orderBy: { createdAt: "asc" }, take: 5 });
  for (const row of rows) {
    const job = row.metadata as unknown as Job;
    if (job.expiresAt <= Date.now() + 10_000) continue;
    const claim = randomUUID();
    const changed = await prisma.activityLog.updateMany({ where: { id: row.id, type: JOB, metadata: { equals: json(job) } }, data: { metadata: json({ ...job, status: "running", claim }) } });
    if (changed.count) {
      await prisma.activityLog.update({ where: { id: HEARTBEAT_ID }, data: { metadata: { seenAt: Date.now(), ready: false } } });
      return { id: row.id, claim, companyUrl: job.companyUrl, expiresAt: job.expiresAt };
    }
  }
  return null;
}

export async function finishLinkedinJob(id: string, claim: string, result: DirectResult, db: Pick<PrismaClient, "activityLog"> = prisma) {
  const row = await db.activityLog.findUnique({ where: { id } });
  const job = row?.metadata as Job | null;
  if (!job || row?.type !== JOB || job.claim !== claim || job.status !== "running" || job.expiresAt <= Date.now()) return false;
  const changed = await db.activityLog.updateMany({ where: { id, type: JOB, metadata: { equals: json(job) } }, data: { metadata: json({ ...job, status: "done", result }) } });
  return changed.count === 1;
}

export function validateDirectResult(value: unknown): DirectResult | null {
  if (!value || typeof value !== "object") return null;
  const v = value as DirectResult;
  if (!["success", "empty", "unavailable"].includes(v.status) || !Array.isArray(v.profiles) || v.profiles.length > 5 ||
      !Array.isArray(v.excludedProfiles) || v.excludedProfiles.length > 10 || v.excludedProfiles.some((s) => typeof s !== "string" || s.length > 500)) return null;
  for (const p of v.profiles) {
    if (!p || ["name", "role", "linkedin", "companyLinkedinUrl", "evidence"].some((key) => typeof p[key as keyof DirectProfile] !== "string") ||
      p.name.length > 160 || p.role.length > 240 || p.linkedin.length > 500 || p.companyLinkedinUrl.length > 500 || p.evidence.length > 2000 ||
      typeof p.current !== "boolean" || !Number.isFinite(p.observedAt) || (p.excluded !== undefined && typeof p.excluded !== "boolean")) return null;
  }
  return { status: v.status, profiles: v.profiles.map((p) => ({ name: p.name, role: p.role, linkedin: p.linkedin, companyLinkedinUrl: p.companyLinkedinUrl, evidence: p.evidence, observedAt: p.observedAt, current: p.current, excluded: p.excluded ?? false })), excludedProfiles: v.excludedProfiles };
}
