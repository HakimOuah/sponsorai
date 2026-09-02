import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceScanQualification,
  createScanQualification,
  qualificationView,
  QUALIFICATION_BUDGET_USD,
  QUALIFICATION_COMPANY_USD,
  QUALIFICATION_LEASE_MS,
  QUALIFICATION_LIMIT,
  type QualificationDependencies,
  type ScanQualification,
} from "../src/lib/contacts/scan-qualification";

const START = Date.parse("2026-09-02T10:00:00Z");
const OWNER = "private-owner";
type Ready = "ready_person" | "ready_generic" | "incomplete";
type Lease = { companyId: string; token: string };
type EnrichmentResult = { status: Ready; costUsd: number | null };

function prospect(id: string, score = 8, status = "new", companyId = `company-${id}`) {
  return { id, score, status, companyId };
}

function job(count = 5): ScanQualification {
  return createScanQualification({ scanId: "scan-fixture", playerId: "player-fixture", ownerUserId: OWNER, prospects: Array.from({ length: count }, (_, index) => prospect(`prospect-${index}`)) }, START);
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function harness(initial = job()) {
  let stored: ScanQualification | null = structuredClone(initial);
  let currentTime = START;
  let configured = true;
  let occupied = false;
  let nextToken = 0;
  const readiness = new Map<string, Ready>();
  const acquired: string[] = [];
  const released: string[] = [];
  const paid: Array<{ companyId: string; allowance: number; stillOwned: () => Promise<boolean> }> = [];
  let result: EnrichmentResult = { status: "incomplete", costUsd: 0.12 };
  let enrichment: QualificationDependencies<Lease>["enrich"] | null = null;
  let beforeSwap: ((before: ScanQualification, after: ScanQualification) => boolean) | null = null;

  const deps: QualificationDependencies<Lease> = {
    read: async (id) => stored?.id === id ? structuredClone(stored) : null,
    compareAndSwap: async (before, after) => {
      if (beforeSwap?.(before, after) === false) return false;
      if (!stored || stored.id !== before.id || stored.version !== before.version) return false;
      stored = structuredClone(after);
      return true;
    },
    readiness: async (companyId) => readiness.get(companyId) || "incomplete",
    acquireCompany: async (companyId) => {
      acquired.push(companyId);
      return occupied ? null : { companyId, token: `private-company-lease-${companyId}` };
    },
    releaseCompany: async (lease) => { released.push(lease.companyId); },
    enrich: async (companyId, allowance, lease, stillOwned) => {
      paid.push({ companyId, allowance, stillOwned });
      return enrichment ? enrichment(companyId, allowance, lease, stillOwned) : result;
    },
    configured: () => configured,
    token: () => `private-job-token-${++nextToken}`,
    now: () => currentTime,
  };
  return {
    deps, readiness, acquired, released, paid,
    read: () => structuredClone(stored!),
    replace: (value: ScanQualification | null) => { stored = structuredClone(value); },
    time: (value: number) => { currentTime = value; },
    configured: (value: boolean) => { configured = value; },
    occupied: (value: boolean) => { occupied = value; },
    result: (value: EnrichmentResult) => { result = value; },
    enrich: (value: QualificationDependencies<Lease>["enrich"]) => { enrichment = value; },
    beforeSwap: (value: (before: ScanQualification, after: ScanQualification) => boolean) => { beforeSwap = value; },
    advance: (owner = OWNER, admin = false) => advanceScanQualification(initial.id, owner, admin, deps),
  };
}

test("qualification selects at most five unique top-scoring new companies without changing input", () => {
  const prospects = [prospect("low", 5), prospect("sent", 10, "contacted"), prospect("lost", 10, "lost"), prospect("z", 9), prospect("a", 9), prospect("b", 8), prospect("duplicate", 7, "new", "company-a"), prospect("c", 7), prospect("d", 6), prospect("extra", 6), { ...prospect("unscored"), score: null }];
  const original = structuredClone(prospects);
  const created = createScanQualification({ scanId: "scan", playerId: "player", ownerUserId: OWNER, prospects }, START);
  assert.equal(QUALIFICATION_LIMIT, 5);
  assert.deepEqual(created.items.map((item) => item.prospectId), ["a", "z", "b", "c", "d"]);
  assert.equal(new Set(created.items.map((item) => item.companyId)).size, 5);
  assert.deepEqual(prospects, original);
  assert.ok(created.items.every((item) => item.reservedUsd === 0 && item.status === "pending"));
});

test("a scan with no eligible new prospect finishes without external work", async () => {
  const initial = createScanQualification({ scanId: "empty", playerId: "player", ownerUserId: OWNER, prospects: [prospect("low", 5), prospect("signed", 10, "signed")] }, START);
  const fixture = harness(initial);
  assert.equal((await fixture.advance())?.status, "completed");
  assert.equal(fixture.acquired.length, 0);
  assert.equal(fixture.paid.length, 0);
});

test("cached recent readiness is reused at zero charge even after the scan budget is exhausted", async () => {
  const initial = job(2);
  initial.reservedUsd = QUALIFICATION_BUDGET_USD;
  const fixture = harness(initial);
  fixture.readiness.set(initial.items[0].companyId, "ready_person");
  fixture.readiness.set(initial.items[1].companyId, "ready_generic");
  fixture.configured(false);
  await fixture.advance();
  const done = await fixture.advance();
  assert.equal(done?.status, "completed");
  assert.deepEqual(done?.items.map((item) => [item.status, item.reused, item.costUsd]), [["ready_person", true, 0], ["ready_generic", true, 0]]);
  assert.equal(done?.reservedUsd, QUALIFICATION_BUDGET_USD);
  assert.equal(fixture.paid.length, 0);
  assert.equal(fixture.released.length, 2);
});

test("the scan never reserves more than $1.50 and makes at most three $0.50 paid steps", async () => {
  const fixture = harness();
  for (let index = 0; index < 5; index++) await fixture.advance();
  const done = fixture.read();
  assert.equal(QUALIFICATION_BUDGET_USD, 1.5);
  assert.equal(QUALIFICATION_COMPANY_USD, 0.5);
  assert.deepEqual(fixture.paid.map((call) => call.allowance), [0.5, 0.5, 0.5]);
  assert.equal(done.reservedUsd, 1.5);
  assert.deepEqual(done.items.map((item) => item.status), ["incomplete", "incomplete", "incomplete", "budget", "budget"]);
  assert.equal(done.status, "partial");
  assert.equal(qualificationView(done).budgetLimited, true);
  assert.equal(fixture.released.length, 5);
  await fixture.advance();
  assert.equal(fixture.paid.length, 3, "a terminal job cannot start another paid call");
});

test("the remaining fraction of budget is an allowance, never rounded into an extra full company budget", async () => {
  const initial = job(2);
  initial.reservedUsd = 1.3;
  const fixture = harness(initial);
  await fixture.advance();
  await fixture.advance();
  assert.deepEqual(fixture.paid.map((call) => call.allowance), [0.2]);
  assert.equal(fixture.read().reservedUsd, 1.5);
  assert.equal(fixture.read().items[1].status, "budget");
});

test("completed checks do not pretend that missing contacts became qualified", async () => {
  const fixture = harness(job(3));
  fixture.result({ status: "incomplete", costUsd: 0.03 });
  await fixture.advance();
  await fixture.advance();
  await fixture.advance();
  const view = qualificationView(fixture.read());
  assert.equal(view.status, "completed");
  assert.equal(view.processed, 3);
  assert.equal(view.total, 3);
  assert.equal(view.incomplete, 3);
  assert.equal(view.readyPeople, 0);
  assert.equal(view.readyGeneric, 0);
});

test("simultaneous POSTs claim one version and create only one paid invocation", async () => {
  const fixture = harness(job(1));
  await Promise.all([fixture.advance(), fixture.advance(), fixture.advance()]);
  assert.equal(fixture.paid.length, 1);
  assert.equal(fixture.acquired.length, 1);
  assert.equal(fixture.released.length, 1);
  assert.equal(fixture.read().reservedUsd, 0.5);
});

test("a different non-admin owner and a missing job cannot claim or inspect qualification", async () => {
  const fixture = harness(job(1));
  assert.equal(await fixture.advance("someone-else"), null);
  assert.equal(fixture.acquired.length, 0);
  assert.equal(fixture.paid.length, 0);
  assert.equal(fixture.read().version, 0);
  fixture.replace(null);
  assert.equal(await fixture.advance(), null);
});

test("an administrator may advance another owner's job without changing its owner", async () => {
  const fixture = harness(job(1));
  await fixture.advance("admin", true);
  assert.equal(fixture.paid.length, 1);
  assert.equal(fixture.read().ownerUserId, OWNER);
});

test("a busy company lease defers without reserving money or calling the provider", async () => {
  const fixture = harness(job(1));
  fixture.occupied(true);
  await fixture.advance();
  assert.equal(fixture.read().status, "pending");
  assert.equal(fixture.read().items[0].status, "pending");
  assert.equal(fixture.read().retryAt, START + 10_000);
  assert.equal(fixture.read().reservedUsd, 0);
  assert.equal(fixture.read().lease, null);
  assert.equal(fixture.released.length, 0);
  await fixture.advance();
  assert.equal(fixture.acquired.length, 1, "polling before retryAt must not reacquire");
  fixture.time(START + 10_000);
  fixture.occupied(false);
  await fixture.advance();
  assert.equal(fixture.paid.length, 1);
});

test("an in-flight unexpired job lease performs no additional work", async () => {
  const initial = job(1);
  initial.status = "running";
  initial.lease = { token: "private-active-token", expiresAt: START + 20_000, prospectId: initial.items[0].prospectId };
  initial.items[0].status = "running";
  const fixture = harness(initial);
  assert.deepEqual(await fixture.advance(), initial);
  assert.equal(fixture.acquired.length, 0);
  assert.equal(fixture.paid.length, 0);
});

test("expired lease views permit an immediate reconciliation POST instead of polling forever", () => {
  const initial = job(1);
  initial.status = "running";
  initial.retryAt = START + 60_000;
  initial.lease = { token: "expiring-token", expiresAt: START, prospectId: initial.items[0].prospectId };
  for (const isAdmin of [false, true]) {
    assert.equal(qualificationView(initial, isAdmin, START - 1).retryAfterMs, 1000);
    assert.equal(qualificationView(initial, isAdmin, START).retryAfterMs, 0);
    assert.equal(qualificationView(initial, isAdmin, START + 60_000).retryAfterMs, 0);
  }
});

test("slow company-lease acquisition or readiness reads cannot start paid work after the job lease expires", async () => {
  for (const delayedBoundary of ["acquireCompany", "readiness"] as const) {
    const fixture = harness(job(1));
    if (delayedBoundary === "acquireCompany") {
      const acquire = fixture.deps.acquireCompany;
      fixture.deps.acquireCompany = async (companyId) => {
        const lease = await acquire(companyId);
        fixture.time(START + QUALIFICATION_LEASE_MS);
        return lease;
      };
    } else {
      fixture.deps.readiness = async () => {
        fixture.time(START + QUALIFICATION_LEASE_MS);
        return "incomplete";
      };
    }
    await fixture.advance();
    assert.equal(fixture.paid.length, 0, delayedBoundary);
    assert.equal(fixture.read().reservedUsd, 0, delayedBoundary);
    assert.equal(fixture.read().items[0].status, "interrupted", delayedBoundary);
    assert.equal(fixture.read().status, "partial", delayedBoundary);
    assert.equal(fixture.released.length, 1, delayedBoundary);
  }
});

test("a worker losing its version or token during readiness exits before reservation and provider invocation", async () => {
  for (const changedField of ["version", "token"] as const) {
    const fixture = harness(job(1));
    const started = deferred<void>();
    const ready = deferred<Ready>();
    fixture.deps.readiness = async () => { started.resolve(); return ready.promise; };
    const predecessor = fixture.advance();
    await started.promise;
    const winner = fixture.read();
    if (changedField === "version") winner.version += 1;
    else winner.lease!.token = "successor-token";
    fixture.replace(winner);
    ready.resolve("incomplete");
    await predecessor;
    assert.deepEqual(fixture.read(), winner, changedField);
    assert.equal(fixture.read().reservedUsd, 0, changedField);
    assert.equal(fixture.paid.length, 0, changedField);
    assert.equal(fixture.released.length, 1, changedField);
  }
});

test("the provider's preflight ownership callback fences a superseded reservation before any external call", async () => {
  const fixture = harness(job(1));
  let externalCalls = 0;
  let winner: ScanQualification | null = null;
  fixture.enrich(async (_company, _allowance, _lease, stillOwned) => {
    winner = fixture.read();
    winner.version += 1;
    winner.status = "partial";
    winner.lease = null;
    winner.items[0].status = "interrupted";
    fixture.replace(winner);
    if (!await stillOwned()) throw new Error("Predecessor no longer owns the reservation");
    externalCalls += 1;
    return { status: "ready_person", costUsd: 0.2 };
  });
  await fixture.advance();
  assert.equal(externalCalls, 0);
  assert.deepEqual(fixture.read(), winner);
  assert.equal(fixture.read().items[0].costUsd, null, "an uncertain predecessor must not report free execution");
  assert.equal(fixture.released.length, 1);
});

test("an expired paid lease is interrupted with an unknown cost and is never retried", async () => {
  const initial = job(2);
  initial.status = "running";
  initial.lease = { token: "private-expired-token", expiresAt: START, prospectId: initial.items[0].prospectId };
  initial.reservedUsd = 0.5;
  Object.assign(initial.items[0], { status: "running", reservedUsd: 0.5, costUsd: null });
  const fixture = harness(initial);
  await fixture.advance();
  await fixture.advance();
  const stopped = fixture.read();
  assert.equal(stopped.status, "partial");
  assert.equal(stopped.lease, null);
  assert.deepEqual(stopped.items.map((item) => item.status), ["interrupted", "interrupted"]);
  assert.equal(stopped.items[0].costUsd, null);
  assert.equal(stopped.reservedUsd, 0.5);
  assert.equal(qualificationView(stopped, true).budget?.actualUsd, null);
  assert.equal(fixture.paid.length, 0);
  assert.equal(fixture.acquired.length, 0);
});

test("a qualification older than 24 hours stops remaining work rather than creating new charges", async () => {
  const fixture = harness();
  fixture.time(START + 24 * 60 * 60 * 1000 + 1);
  await fixture.advance();
  assert.equal(fixture.read().status, "partial");
  assert.ok(fixture.read().items.every((item) => item.status === "interrupted"));
  assert.equal(fixture.paid.length, 0);
});

test("unknown or malformed provider costs retain reservations and are never presented as free", async () => {
  for (const costUsd of [null, NaN, Infinity, -1]) {
    const fixture = harness(job(1));
    fixture.result({ status: "ready_person", costUsd });
    await fixture.advance();
    assert.equal(fixture.read().reservedUsd, 0.5);
    assert.equal(fixture.read().items[0].reservedUsd, 0.5);
    assert.equal(fixture.read().items[0].costUsd, null);
    assert.equal(qualificationView(fixture.read(), true).budget?.actualUsd, null);
  }
});

test("provider failures retain unknown paid cost, release the company lease and never retry", async () => {
  const fixture = harness(job(1));
  fixture.enrich(async () => { throw new Error("Provider outcome unknown"); });
  await fixture.advance();
  await fixture.advance();
  assert.equal(fixture.read().status, "partial");
  assert.equal(fixture.read().items[0].status, "unavailable");
  assert.equal(fixture.read().items[0].costUsd, null);
  assert.equal(fixture.read().reservedUsd, 0.5);
  assert.equal(fixture.paid.length, 1);
  assert.equal(fixture.released.length, 1);
});

test("missing provider configuration does not reserve or spend money", async () => {
  const fixture = harness(job(1));
  fixture.configured(false);
  await fixture.advance();
  assert.equal(fixture.read().items[0].status, "unavailable");
  assert.equal(fixture.read().reservedUsd, 0);
  assert.equal(fixture.paid.length, 0);
  assert.equal(qualificationView(fixture.read(), true).budget?.actualUsd, 0);
});

test("losing the reservation compare-and-swap cannot start a paid provider call", async () => {
  const fixture = harness(job(1));
  fixture.beforeSwap((_before, after) => after.reservedUsd === 0);
  await fixture.advance();
  assert.equal(fixture.paid.length, 0);
  assert.equal(fixture.read().reservedUsd, 0);
  assert.equal(fixture.released.length, 1);
});

test("late workers cannot overwrite an interruption persisted by another request", async () => {
  const fixture = harness(job(2));
  const started = deferred<void>();
  const result = deferred<EnrichmentResult>();
  fixture.enrich(async () => { started.resolve(); return result.promise; });
  const original = fixture.advance();
  await started.promise;
  assert.equal(await fixture.paid[0].stillOwned(), true);
  fixture.time(START + QUALIFICATION_LEASE_MS);
  assert.equal(await fixture.paid[0].stillOwned(), false);
  await fixture.advance();
  const stopped = fixture.read();
  result.resolve({ status: "ready_person", costUsd: 0.2 });
  await original;
  assert.deepEqual(fixture.read(), stopped, "stale CAS must not replace partial with completed");
  assert.equal(fixture.read().status, "partial");
  assert.equal(fixture.paid.length, 1);
  assert.equal(fixture.released.length, 1);
});

test("an expired worker cannot publish readiness even if no second request has marked interruption yet", async () => {
  const fixture = harness(job(1));
  fixture.enrich(async (_company, _allowance, _lease, stillOwned) => {
    fixture.time(START + QUALIFICATION_LEASE_MS);
    assert.equal(await stillOwned(), false);
    return { status: "ready_person", costUsd: 0.2 };
  });
  await fixture.advance();
  const final = fixture.read();
  assert.notEqual(final.items[0].status, "ready_person", "lease expiration fences publication, not only provider persistence");
  assert.notEqual(final.status, "completed");
  assert.equal(final.reservedUsd, 0.5);
  assert.equal(fixture.paid.length, 1);
});

test("public qualification views expose aggregate progress only; costs are administrator-only", () => {
  const initial = job(2);
  initial.lease = { token: "private-token", expiresAt: START + QUALIFICATION_LEASE_MS, prospectId: initial.items[0].prospectId };
  initial.items[0].status = "ready_person";
  initial.items[0].reused = true;
  initial.items[1].costUsd = null;
  const poisoned = Object.assign(initial, { contactId: "private-contact", email: "person@secret.fr", providerPayload: { key: "private-key" } });
  const view = qualificationView(poisoned, false, START);
  const serialized = JSON.stringify(view);
  for (const secret of [OWNER, "private-token", "private-contact", "person@secret", "private-key", "company-prospect", "prospect-0", "ownerUserId", "lease", "items", "providerPayload"]) assert.ok(!serialized.includes(secret), secret);
  assert.equal(Object.hasOwn(view, "budget"), false);
  assert.equal(view.readyPeople, 1);
  assert.equal(view.reused, 1);
  assert.equal(view.retryAfterMs, 10_000);
  assert.deepEqual(JSON.parse(serialized), view);
  const admin = qualificationView(poisoned, true, START);
  assert.equal(admin.budget?.actualUsd, null);
  assert.equal(admin.budget?.limitUsd, 1.5);
  assert.ok(!JSON.stringify(admin).includes(OWNER));
  assert.ok(!JSON.stringify(admin).includes("private-token"));
});
