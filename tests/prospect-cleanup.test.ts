import test from "node:test";
import assert from "node:assert/strict";
import type { Prisma } from "@prisma/client";
import {
  executeProspectCleanup,
  type CleanupInput,
} from "../src/lib/prospection/cleanup";

function fixture({ running = 0, protectedHistory = false, found = true } = {}) {
  const calls: Array<{ method: string; args: any }> = [];
  const record = (method: string, result: unknown) => async (args: unknown) => {
    calls.push({ method, args });
    return result;
  };
  const tx = {
    scan: { count: record("scan.count", running) },
    prospect: {
      findMany: record(
        "prospect.findMany",
        found
          ? [
              {
                id: "p1",
                companyId: "c1",
                deal: protectedHistory ? { id: "d1" } : null,
                _count: { emails: 0, mailThreads: 0, attributions: 0 },
              },
            ]
          : [],
      ),
      updateMany: record("prospect.updateMany", { count: 1 }),
      deleteMany: record("prospect.deleteMany", { count: 1 }),
    },
    company: { deleteMany: record("company.deleteMany", { count: 0 }) },
    activityLog: { create: record("activityLog.create", {}) },
  } as unknown as Prisma.TransactionClient;
  const input: CleanupInput = {
    playerId: "athlete1",
    ids: ["p1"],
    action: "archive",
  };
  return { tx, calls, input };
}

test("archive targets exact athlete and IDs, preserving business status and history", async () => {
  const { tx, calls, input } = fixture({ protectedHistory: true });
  await executeProspectCleanup(tx, input, "admin1");
  const update = calls.find((c) => c.method === "prospect.updateMany")!.args;
  assert.deepEqual(update.where, { playerId: "athlete1", id: { in: ["p1"] } });
  assert.ok(update.data.archivedAt instanceof Date);
  assert.deepEqual(Object.keys(update.data), ["archivedAt"]);
  assert.ok(!calls.some((c) => c.method.includes("delete")));
});

test("restore does not reset business status", async () => {
  const { tx, calls, input } = fixture();
  await executeProspectCleanup(tx, { ...input, action: "restore" }, "admin1");
  assert.deepEqual(
    calls.find((c) => c.method === "prospect.updateMany")!.args.data,
    { archivedAt: null },
  );
});

test("rejects running scans and stale or cross-athlete selections before mutations", async () => {
  for (const options of [{ running: 1 }, { found: false }]) {
    const { tx, calls, input } = fixture(options);
    await assert.rejects(executeProspectCleanup(tx, input, "admin1"));
    assert.ok(!calls.some((c) => /update|delete|create/.test(c.method)));
  }
});

test("delete refuses historical prospects, no partial deletion", async () => {
  const { tx, calls, input } = fixture({ protectedHistory: true });
  await assert.rejects(
    executeProspectCleanup(tx, { ...input, action: "delete" }, "admin1"),
    /historique/,
  );
  assert.ok(!calls.some((c) => c.method.includes("delete")));
});

test("deleting a prospect preserves the company by default", async () => {
  const { tx, calls, input } = fixture();
  await executeProspectCleanup(tx, { ...input, action: "delete" }, "admin1");
  assert.ok(calls.some((c) => c.method === "prospect.deleteMany"));
  assert.ok(!calls.some((c) => c.method === "company.deleteMany"));
});

test("optional company deletion requires no remaining relations and records actual count", async () => {
  const { tx, calls, input } = fixture();
  const result = await executeProspectCleanup(
    tx,
    {
      ...input,
      ids: ["p1", "p1"],
      action: "delete",
      deleteOrphanCompanies: true,
    },
    "admin1",
  );
  const where = calls.find((c) => c.method === "company.deleteMany")!.args
    .where;
  for (const relation of [
    "prospects",
    "deals",
    "emails",
    "contacts",
    "employments",
    "evidence",
    "sponsorships",
    "opportunitySignals",
    "learningEvents",
    "mailThreads",
  ]) {
    assert.deepEqual(where[relation], { none: {} });
  }
  assert.deepEqual(where.id, { in: ["c1"] });
  assert.deepEqual(result, { count: 1, companiesDeleted: 0 });
  assert.equal(
    calls.find((c) => c.method === "activityLog.create")!.args.data.metadata
      .userId,
    "admin1",
  );
});
