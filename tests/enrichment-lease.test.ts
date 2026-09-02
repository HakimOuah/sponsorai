import assert from "node:assert/strict";
import test from "node:test";
import { isDeepStrictEqual } from "node:util";
import { readFileSync } from "node:fs";
import type { Company, PrismaClient } from "@prisma/client";
import {
  acquireCompanyEnrichmentLease,
  releaseCompanyEnrichmentLease,
  isCompanyEnrichmentLeaseHeld,
  COMPANY_ENRICHMENT_LEASE_MS,
  INTERNAL_CONTACT_ACTIVITY_TYPES,
  type CompanyEnrichmentLease,
} from "../src/lib/contacts/enrichment-lease";
import { createEnrichmentHandler, type EnrichmentDependencies } from "../src/lib/contacts/enrichment-handler";

type Row = { id: string; type: string; metadata: unknown };
function database() {
  const rows = new Map<string, Row>();
  const updates: unknown[] = [];
  const db = { activityLog: {
    findUnique: async ({ where }: { where: { id: string } }) => structuredClone(rows.get(where.id) || null),
    create: async ({ data }: { data: Row }) => {
      if (rows.has(data.id)) throw Object.assign(new Error("Unique key"), { code: "P2002" });
      rows.set(data.id, structuredClone(data));
      return data;
    },
    updateMany: async (input: {
      where: { id: string; type: string; metadata: { equals: unknown } };
      data: { metadata: unknown };
    }) => {
      updates.push(input);
      const row = rows.get(input.where.id);
      if (!row || row.type !== input.where.type || !isDeepStrictEqual(row.metadata, input.where.metadata.equals)) return { count: 0 };
      rows.set(row.id, { ...row, metadata: structuredClone(input.data.metadata) });
      return { count: 1 };
    },
  } } as unknown as Pick<PrismaClient, "activityLog">;
  return { db, rows, updates };
}

test("one company lease wins concurrent initial claims and blocks even repeated tokens", async () => {
  const { db, rows } = database();
  const claims = await Promise.all([
    acquireCompanyEnrichmentLease("company-a", "worker-a", 1000, db),
    acquireCompanyEnrichmentLease("company-a", "worker-b", 1000, db),
  ]);
  assert.equal(claims.filter(Boolean).length, 1);
  const lease = claims.find((value): value is CompanyEnrichmentLease => Boolean(value))!;
  assert.equal(rows.size, 1);
  assert.equal(lease.expiresAt, 1000 + COMPANY_ENRICHMENT_LEASE_MS);
  assert.ok(COMPANY_ENRICHMENT_LEASE_MS > 300_000);
  assert.equal(await acquireCompanyEnrichmentLease("company-a", lease.token, 1001, db), null);
  assert.equal(await isCompanyEnrichmentLeaseHeld(lease, 1001, db), true);
  assert.equal(await isCompanyEnrichmentLeaseHeld(lease, lease.expiresAt, db), false);
});

test("expired leases are atomically reclaimed and old workers cannot release successors", async () => {
  const { db, updates } = database();
  const old = (await acquireCompanyEnrichmentLease("company-a", "old-worker", 1000, db))!;
  const successors = await Promise.all([
    acquireCompanyEnrichmentLease("company-a", "next-worker", old.expiresAt, db),
    acquireCompanyEnrichmentLease("company-a", "other-worker", old.expiresAt, db),
  ]);
  assert.equal(successors.filter(Boolean).length, 1);
  const next = successors.find((value): value is CompanyEnrichmentLease => Boolean(value))!;
  assert.equal(next.version, old.version + 1);
  assert.equal(await releaseCompanyEnrichmentLease(old, db), false);
  assert.equal(await isCompanyEnrichmentLeaseHeld(next, old.expiresAt + 1, db), true);
  assert.equal(await isCompanyEnrichmentLeaseHeld(old, 1001, db), false);
  assert.equal(await releaseCompanyEnrichmentLease({ ...next, token: "wrong-worker" }, db), false);
  assert.equal(await releaseCompanyEnrichmentLease(next, db), true);
  assert.equal(await releaseCompanyEnrichmentLease(next, db), false);
  assert.ok(updates.length >= 5);
});

test("release retains the monotonic fence and never blocks another company", async () => {
  const { db, rows } = database();
  const first = (await acquireCompanyEnrichmentLease("company-a", "same-token", 1000, db))!;
  assert.ok(await acquireCompanyEnrichmentLease("company-b", "second-company", 1000, db));
  assert.equal(await releaseCompanyEnrichmentLease(first, db), true);
  const replacement = (await acquireCompanyEnrichmentLease("company-a", "same-token", 1001, db))!;
  assert.equal(replacement.version, first.version + 2);
  assert.equal(await releaseCompanyEnrichmentLease(first, db), false);
  assert.equal(rows.size, 2);
  const stored = rows.get("contact-enrichment-lease:company-a")!;
  assert.equal(stored.type, "contact_enrichment_lease");
  assert.deepEqual(Object.keys(stored.metadata as object).sort(), ["schemaVersion", "companyId", "token", "version", "expiresAt", "status"].sort());
});

test("unknown lease schemas and storage failures fail closed", async () => {
  const { db, rows } = database();
  rows.set("contact-enrichment-lease:company-a", { id: "contact-enrichment-lease:company-a", type: "contact_enrichment_lease", metadata: { schemaVersion: 99 } });
  assert.equal(await acquireCompanyEnrichmentLease("company-a", "worker", 1000, db), null);
  await assert.rejects(acquireCompanyEnrichmentLease(" ", "worker", 1000, db), /Invalid/);
  const broken = { activityLog: {
    findUnique: async () => null,
    create: async () => { throw new Error("Database unavailable"); },
  } } as unknown as Pick<PrismaClient, "activityLog">;
  await assert.rejects(acquireCompanyEnrichmentLease("company-b", "worker", 1000, broken), /Database unavailable/);
});

const company = { id: "company-a", name: "Example Company" } as Company;
const request = () => new Request("https://app.test/api/agents/enrichisseur", { method: "POST", body: JSON.stringify({ companyId: company.id }) });
function dependencies(overrides: Partial<EnrichmentDependencies> = {}): EnrichmentDependencies {
  return {
    getAccess: async () => ({ authenticated: true, isAdmin: true, isFreeUser: false, canOperate: true, role: "admin", userId: "test-admin", userName: "Test" }),
    findCompany: async () => company,
    enrich: async () => ({ contacts: [], company_insights: "", diagnostics: [] }),
    persist: async () => [],
    updateCompany: async () => undefined,
    recordActivity: async () => undefined,
    reportError: () => undefined,
    ...overrides,
  };
}

test("manual enrichment blocks an occupied company before any paid call and hides lease tokens", async () => {
  const deps = dependencies({
    acquireLease: async () => null,
    enrich: async () => { assert.fail("duplicate paid call"); },
  });
  const response = await createEnrichmentHandler(deps)(request());
  assert.equal(response.status, 409);
  assert.match(await response.text(), /déjà en cours/);
});

test("manual enrichment blocks paid work when lease storage cannot be reached", async () => {
  const response = await createEnrichmentHandler(dependencies({
    acquireLease: async () => { throw new Error("PRIVATE_DATABASE_TOKEN"); },
    enrich: async () => { assert.fail("unleased paid call"); },
  }))(request());
  assert.equal(response.status, 503);
  assert.ok(!(await response.text()).includes("PRIVATE_DATABASE_TOKEN"));
});

test("manual success and provider failure both release the same lease after work settles", async () => {
  for (const failure of [false, true]) {
    const lease = { companyId: company.id, token: "PRIVATE_WORKER_TOKEN", version: 1, expiresAt: Date.now() + COMPANY_ENRICHMENT_LEASE_MS };
    const calls: string[] = [];
    const response = await createEnrichmentHandler(dependencies({
      acquireLease: async () => { calls.push("claim"); return lease; },
      isLeaseHeld: async (candidate) => { assert.equal(candidate, lease); calls.push("fence"); return true; },
      enrich: async () => { calls.push("provider"); if (failure) throw new Error("upstream"); return { contacts: [], company_insights: "", diagnostics: [] }; },
      persist: async () => { calls.push("persist"); return []; },
      releaseLease: async (candidate) => { assert.equal(candidate, lease); calls.push("release"); },
    }))(request());
    const body = await response.text();
    assert.deepEqual(calls, failure ? ["claim", "provider", "release"] : ["claim", "provider", "fence", "persist", "release"]);
    assert.ok(!body.includes(lease.token));
    assert.match(body, failure ? /"type":"error"/ : /"type":"done"/);
  }
});

test("manual late result is not persisted after the lease has changed", async () => {
  let released = false;
  const lease = { companyId: company.id, token: "old-worker", version: 1, expiresAt: Date.now() + COMPANY_ENRICHMENT_LEASE_MS };
  const response = await createEnrichmentHandler(dependencies({
    acquireLease: async () => lease,
    isLeaseHeld: async () => false,
    persist: async () => { assert.fail("stale result must not overwrite newer contacts"); },
    releaseLease: async () => { released = true; },
  }))(request());
  assert.match(await response.text(), /"type":"error"/);
  assert.equal(released, true);
});

test("free users never acquire enrichment leases; internal activities stay out of dashboard feeds", async () => {
  const deps = dependencies({ acquireLease: async () => assert.fail("read-only user claimed a lease") });
  deps.getAccess = async () => ({ authenticated: true, isAdmin: false, isFreeUser: true, canOperate: false, role: "free_user", userId: "free", userName: "Free" });
  assert.equal((await createEnrichmentHandler(deps)(request())).status, 403);
  assert.deepEqual([...INTERNAL_CONTACT_ACTIVITY_TYPES], ["scan_contact_qualification", "contact_enrichment_lease"]);
  const source = readFileSync(new URL("../src/lib/actions/dashboard.ts", import.meta.url), "utf8");
  assert.match(source, /activityLog\.findMany\(\{\s*where: \{ type: \{ notIn: \[\.\.\.INTERNAL_CONTACT_ACTIVITY_TYPES\]/);
});
