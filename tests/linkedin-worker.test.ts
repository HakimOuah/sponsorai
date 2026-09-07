import assert from "node:assert/strict";
import test from "node:test";
import type { PrismaClient } from "@prisma/client";
import { POST } from "../src/app/api/worker/linkedin/route";
import { finishLinkedinJob, requestLinkedinJob, validateDirectResult } from "../src/lib/contacts/linkedin-worker-store";

test("worker rejects missing/wrong/multibyte credentials before database access", async () => {
  const old = process.env.LINKEDIN_WORKER_TOKEN;
  process.env.LINKEDIN_WORKER_TOKEN = "a".repeat(48);
  try {
    for (const auth of ["", "Bearer " + "b".repeat(48), "Bearer " + "é".repeat(48)]) {
      assert.equal((await POST(new Request("https://vectis.agency/api/worker/linkedin", { method: "POST", headers: { authorization: auth }, body: "{}" }))).status, 401);
    }
    assert.equal((await POST(new Request("https://vectis.agency/api/worker/linkedin", { method: "POST", headers: { authorization: "Bearer " + "a".repeat(48) }, body: JSON.stringify({ action: "invalid" }) }))).status, 400);
  } finally { if (old === undefined) delete process.env.LINKEDIN_WORKER_TOKEN; else process.env.LINKEDIN_WORKER_TOKEN = old; }
});

test("worker payload is bounded and strips unrecognized fields", () => {
  assert.equal(validateDirectResult({ status: "success", profiles: [null], excludedProfiles: [] }), null);
  assert.equal(validateDirectResult({ status: "success", profiles: [], excludedProfiles: [42] }), null);
  assert.deepEqual(validateDirectResult({ status: "empty", profiles: [], excludedProfiles: [], private: "not retained" }), { status: "empty", profiles: [], excludedProfiles: [] });
});

test("offline or insufficient deadline cannot enqueue work; expired and wrong claims cannot complete", async () => {
  let row: unknown = { metadata: { ready: false, seenAt: Date.now() } };
  const db = { activityLog: { findUnique: async () => row,
    create: async () => assert.fail("No unavailable job"), updateMany: async () => assert.fail("No invalid completion") } } as unknown as Pick<PrismaClient, "activityLog">;
  assert.equal((await requestLinkedinJob("https://www.linkedin.com/company/acme", "acme", {}, db)).status, "unavailable");
  assert.equal(await finishLinkedinJob("job", "wrong", { status: "empty", profiles: [], excludedProfiles: [] }, db), false);
  row = { type: "linkedin_direct_job", metadata: { ready: true, seenAt: Date.now(), status: "running", claim: "right", expiresAt: Date.now()-1 } };
  assert.equal((await requestLinkedinJob("https://www.linkedin.com/company/acme", "acme", { deadline: Date.now()+10_000 }, db)).status, "unavailable");
  assert.equal(await finishLinkedinJob("job", "right", { status: "empty", profiles: [], excludedProfiles: [] }, db), false);
});
