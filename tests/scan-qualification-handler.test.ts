import assert from "node:assert/strict";
import test from "node:test";
import type { UserAccess } from "../src/lib/auth/access";
import { createQualificationHandlers, type QualificationHandlerDependencies } from "../src/lib/contacts/scan-qualification-handler";
import { createScanQualification, type ScanQualification } from "../src/lib/contacts/scan-qualification";

const OWNER = "private-user-id";
const OTHER = "another-private-user-id";
const SECRET = "Provider key private-api-key, person@private-company.fr, private-token";

function sampleJob(ownerUserId = OWNER): ScanQualification {
  const job = createScanQualification({
    scanId: `scan-${ownerUserId}`, playerId: "athlete-fixture", ownerUserId,
    prospects: [{ id: "private-prospect-id", companyId: "private-company-id", score: 9, status: "new" }],
  });
  job.status = "running";
  job.lease = { token: "private-token", expiresAt: Date.now() + 30_000, prospectId: "private-prospect-id" };
  job.items[0].status = "running";
  job.items[0].reservedUsd = 0.5;
  job.items[0].costUsd = null;
  job.reservedUsd = 0.5;
  return job;
}

const request = (body: unknown) => new Request("https://vectis.test/api/agents/qualification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

function fixture() {
  let access: UserAccess = { authenticated: true, isAdmin: false, isFreeUser: false, canOperate: true, role: "client", userId: OWNER, userName: "Private Client Name" };
  const own = sampleJob();
  const other = sampleJob(OTHER);
  const calls = { list: [] as string[], read: [] as string[], advance: [] as Array<{ id: string; userId: string; isAdmin: boolean }> };
  const deps: QualificationHandlerDependencies = {
    getAccess: async () => access,
    list: async (userId) => { calls.list.push(userId); return [structuredClone(own), structuredClone(other)]; },
    read: async (id) => { calls.read.push(id); return id === own.id ? structuredClone(own) : id === other.id ? structuredClone(other) : null; },
    advance: async (id, userId, isAdmin) => {
      calls.advance.push({ id, userId, isAdmin });
      return id === own.id ? structuredClone(own) : id === other.id ? structuredClone(other) : null;
    },
  };
  return { own, other, deps, calls, handlers: createQualificationHandlers(deps), access: (overrides: Partial<UserAccess>) => { access = { ...access, ...overrides }; } };
}

function assertPrivateNoStore(response: Response) {
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.match(response.headers.get("Content-Type") || "", /application\/json/);
}

function assertSafeBody(body: unknown) {
  const text = JSON.stringify(body);
  for (const secret of ["Private Client Name", "ownerUserId", "private-token", "private-prospect-id", "private-company-id", "person@", "private-api-key", '"items"', '"lease"']) {
    assert.ok(!text.includes(secret), `public response must not contain ${secret}`);
  }
}

test("GET and POST deny anonymous or user-id-less sessions before lookup or advancement", async () => {
  for (const overrides of [{ authenticated: false }, { userId: null }]) {
    const state = fixture();
    state.access(overrides);
    for (const response of [await state.handlers.GET(), await state.handlers.POST(request({ id: state.own.id }))]) {
      assert.equal(response.status, 401);
      assertPrivateNoStore(response);
      assertSafeBody(await response.json());
    }
    assert.deepEqual(state.calls, { list: [], read: [], advance: [] });
  }
});

test("free users cannot poll or advance paid automatic qualification", async () => {
  const state = fixture();
  state.access({ canOperate: false, isFreeUser: true, role: "free_user" });
  for (const response of [await state.handlers.GET(), await state.handlers.POST(request({ id: state.own.id }))]) {
    assert.equal(response.status, 403);
    assertPrivateNoStore(response);
  }
  assert.deepEqual(state.calls, { list: [], read: [], advance: [] });
});

test("GET is strictly read-only and defensively filters another user's jobs", async () => {
  const state = fixture();
  const before = structuredClone(state.own);
  const response = await state.handlers.GET();
  assert.equal(response.status, 200);
  assertPrivateNoStore(response);
  const body = await response.json();
  assert.equal(body.jobs.length, 1);
  assert.equal(body.jobs[0].id, state.own.id);
  assert.equal(Object.hasOwn(body.jobs[0], "budget"), false);
  assertSafeBody(body);
  assert.deepEqual(state.calls, { list: [OWNER], read: [], advance: [] });
  assert.deepEqual(state.own, before);
});

test("client POST advances only the authorized job and returns safe aggregate progress", async () => {
  const state = fixture();
  const response = await state.handlers.POST(request({ id: state.own.id }));
  assert.equal(response.status, 200);
  assertPrivateNoStore(response);
  const body = await response.json();
  assert.equal(body.job.id, state.own.id);
  assert.equal(body.job.total, 1);
  assert.equal(Object.hasOwn(body.job, "budget"), false);
  assertSafeBody(body);
  assert.deepEqual(state.calls.advance, [{ id: state.own.id, userId: OWNER, isAdmin: false }]);
});

test("administrators may advance another owner's job but never receive lease tokens or contact IDs", async () => {
  const state = fixture();
  state.access({ isAdmin: true, role: "admin" });
  const response = await state.handlers.POST(request({ id: state.other.id }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.job.budget.limitUsd, 1.5);
  assert.equal(body.job.budget.reservedUsd, 0.5);
  assert.equal(body.job.budget.actualUsd, null);
  assertSafeBody(body);
  assert.deepEqual(state.calls.advance, [{ id: state.other.id, userId: OWNER, isAdmin: true }]);
  const list = await (await state.handlers.GET()).json();
  assert.equal(list.jobs.length, 1, "list remains scoped to the requesting admin's own scans");
});

test("client-supplied role, owner and budget overrides cannot elevate authority", async () => {
  const state = fixture();
  const unauthorized = await state.handlers.POST(request({ id: state.other.id, isAdmin: true, userId: OTHER, ownerUserId: OTHER, budgetUsd: 999 }));
  assert.equal(unauthorized.status, 404);
  assert.equal(state.calls.advance.length, 0);
  const own = await state.handlers.POST(request({ id: state.own.id, isAdmin: true, userId: OTHER, budgetUsd: 999 }));
  assert.equal(own.status, 200);
  assert.deepEqual(state.calls.advance, [{ id: state.own.id, userId: OWNER, isAdmin: false }]);
  assert.equal(state.own.budgetUsd, 1.5);
});

test("POST validates the complete canonical qualification ID before any storage access", async () => {
  for (const id of [null, 12, {}, [], "", "scan-qualification:", "scan-qualification:a/b", "scan-qualification:../secret", "scan-qualification:a?b", "other:abc", " scan-qualification:abc", "scan-qualification:abc ", "scan-qualification:abc\n", "scan-qualification:abc\r", `scan-qualification:${"a".repeat(101)}`]) {
    const state = fixture();
    const response = await state.handlers.POST(request({ id }));
    assert.equal(response.status, 400, JSON.stringify(id));
    assertPrivateNoStore(response);
    assert.deepEqual(state.calls, { list: [], read: [], advance: [] }, JSON.stringify(id));
  }
});

test("valid IDs may contain underscores and dashes up to the documented bound", async () => {
  for (const id of ["scan-qualification:Abc_123-def", `scan-qualification:${"a".repeat(100)}`]) {
    const state = fixture();
    const response = await state.handlers.POST(request({ id }));
    assert.equal(response.status, 404, "canonical ID reaches lookup even if absent");
    assert.deepEqual(state.calls.read, [id]);
    assert.equal(state.calls.advance.length, 0);
  }
});

test("malformed JSON and missing or non-object bodies never reach storage or an agent", async () => {
  for (const body of [null, [], {}, true, 7, "scan-qualification:abc"]) {
    const state = fixture();
    assert.equal((await state.handlers.POST(request(body))).status, 400);
    assert.deepEqual(state.calls, { list: [], read: [], advance: [] });
  }
  const state = fixture();
  const response = await state.handlers.POST(new Request("https://vectis.test/", { method: "POST", body: "not JSON" }));
  assert.equal(response.status, 400);
  assert.deepEqual(state.calls, { list: [], read: [], advance: [] });
});

test("missing and other-owner jobs have the same 404 without advancing or disclosing existence", async () => {
  const state = fixture();
  const absent = await state.handlers.POST(request({ id: "scan-qualification:missing" }));
  const foreign = await state.handlers.POST(request({ id: state.other.id }));
  assert.equal(absent.status, 404);
  assert.equal(foreign.status, 404);
  assert.deepEqual(await absent.json(), await foreign.json());
  assert.equal(state.calls.advance.length, 0);
});

test("a job disappearing between authorization and advance yields a safe 404", async () => {
  const state = fixture();
  state.deps.advance = async () => null;
  const response = await state.handlers.POST(request({ id: state.own.id }));
  assert.equal(response.status, 404);
  assertPrivateNoStore(response);
  assertSafeBody(await response.json());
});

test("storage and advancement failures have generic no-store errors with no provider secrets", async () => {
  for (const layer of ["list", "read", "advance"] as const) {
    const state = fixture();
    state.deps[layer] = async () => { throw new Error(SECRET); };
    const response = layer === "list" ? await state.handlers.GET() : await state.handlers.POST(request({ id: state.own.id }));
    assert.equal(response.status, 503, layer);
    assertPrivateNoStore(response);
    const body = await response.json();
    assertSafeBody(body);
    assert.equal(typeof body.error, "string");
    assert.ok(!body.error.includes("réessayer"), "error must not encourage replaying an uncertain paid call");
  }
});

test("authentication backend failures also resolve to a generic error without exposing their exception", async () => {
  const state = fixture();
  state.deps.getAccess = async () => { throw new Error(SECRET); };
  for (const call of [() => state.handlers.GET(), () => state.handlers.POST(request({ id: state.own.id }))]) {
    const response = await call();
    assert.equal(response.status, 503);
    assertPrivateNoStore(response);
    assertSafeBody(await response.json());
  }
  assert.deepEqual(state.calls, { list: [], read: [], advance: [] });
});
