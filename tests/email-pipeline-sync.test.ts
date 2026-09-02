import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "@prisma/client";
import { dealStageAfterOutreach, syncSentEmailToPipeline } from "../src/lib/email/pipeline-sync";
import { createOutreachDb } from "./helpers/outreach-db";

test("a sent email creates its unique Contacted deal, attribution and trace without changing the email", async () => {
  const fixture = createOutreachDb();
  const emailBefore = structuredClone(fixture.state.emails["email-1"]);
  const result = await syncSentEmailToPipeline("email-1", fixture.db);
  assert.equal(result.change, "created");
  assert.equal(result.stage, "contacted");
  assert.equal(fixture.state.deal?.playerId, "player-1");
  assert.equal(fixture.state.deal?.companyId, "company-1");
  assert.equal(fixture.state.deal?.dealType, "ambassador");
  assert.equal(fixture.state.prospect.status, "contacted");
  assert.equal(fixture.state.attribution?.dealId, "deal-1");
  assert.equal(fixture.state.dealEvents[0].type, "DEAL_CREATED");
  assert.deepEqual(fixture.state.emails["email-1"], emailBefore);
  assert.equal(fixture.state.outreachEvents.length, 0);
});

test("an existing Lead advances without overwriting notes, value or next action", async () => {
  const fixture = createOutreachDb();
  fixture.existingDeal("lead");
  const before = structuredClone(fixture.state.deal);
  const result = await syncSentEmailToPipeline("email-1", fixture.db);
  assert.equal(result.change, "advanced");
  assert.deepEqual(fixture.state.deal, { ...before, stage: "contacted" });
  assert.deepEqual(fixture.state.dealEvents[0].data, {
    emailId: "email-1", prospectId: "prospect-1", from: "lead", to: "contacted",
  });
});

test("replayed or simultaneous reconciliation is idempotent for the deal and its audit trail", async () => {
  const fixture = createOutreachDb();
  const results = await Promise.all(Array.from({ length: 4 }, () => syncSentEmailToPipeline("email-1", fixture.db)));
  assert.equal(results.filter((result) => result.change === "created").length, 1);
  assert.equal(results.filter((result) => result.change === "unchanged").length, 3);
  assert.equal(fixture.state.dealEvents.length, 1);
});

test("follow-up emails do not regress advanced or closed deals or replied prospects", async () => {
  for (const stage of ["contacted", "meeting", "negotiation", "offer", "signed", "lost"]) {
    const fixture = createOutreachDb();
    fixture.existingDeal(stage);
    fixture.state.prospect.status = stage === "contacted" ? "replied" : stage;
    const before = structuredClone(fixture.state);
    const result = await syncSentEmailToPipeline("email-1", fixture.db);
    assert.equal(result.change, "unchanged");
    assert.deepEqual(fixture.state.deal, before.deal);
    assert.equal(fixture.state.prospect.status, before.prospect.status);
    assert.equal(fixture.state.dealEvents.length, 0);
  }
});

test("a backfill respects the prospect's existing milestones when its deal is missing", async () => {
  for (const status of ["replied", "meeting", "offer", "signed", "lost"]) {
    const fixture = createOutreachDb();
    fixture.state.prospect.status = status;
    await syncSentEmailToPipeline("email-1", fixture.db);
    assert.equal(fixture.state.deal?.stage, dealStageAfterOutreach(status));
    assert.equal(fixture.state.prospect.status, status);
  }
});

test("approval, a draft, an in-progress send or an inbound reply cannot create Contacted", async () => {
  for (const change of [
    { status: "draft", sentAt: null }, { status: "sent", sentAt: null },
    { status: "sending" }, { status: "failed" }, { direction: "inbound", status: "replied" },
  ]) {
    const fixture = createOutreachDb();
    Object.assign(fixture.state.emails["email-1"], change);
    const before = structuredClone(fixture.state);
    assert.equal((await syncSentEmailToPipeline("email-1", fixture.db)).change, "not_sent");
    assert.deepEqual(fixture.state, before);
  }
});

test("sent mail without a prospect does not invent an athlete or a pipeline deal", async () => {
  const fixture = createOutreachDb();
  fixture.state.emails["email-1"].prospectId = null;
  assert.equal((await syncSentEmailToPipeline("email-1", fixture.db)).change, "no_prospect");
  assert.equal(fixture.state.deal, null);
});

test("mismatched email/company records are rejected before writing a deal", async () => {
  const fixture = createOutreachDb();
  fixture.state.emails["email-1"].companyId = "other-company";
  await assert.rejects(syncSentEmailToPipeline("email-1", fixture.db), /different companies/);
  assert.equal(fixture.state.deal, null);
});

test("serialization and uniqueness conflicts retry database work, with a bounded retry count", async () => {
  for (const code of ["P2034", "P2002"]) {
    const fixture = createOutreachDb();
    fixture.failures.push(new Prisma.PrismaClientKnownRequestError("conflict", { code, clientVersion: "test" }));
    assert.equal((await syncSentEmailToPipeline("email-1", fixture.db)).change, "created");
    assert.equal(fixture.transactions, 2);
    assert.equal(fixture.state.dealEvents.length, 1);
  }
  const fixture = createOutreachDb();
  fixture.failures.push(...Array.from({ length: 3 }, () => new Prisma.PrismaClientKnownRequestError("conflict", { code: "P2034", clientVersion: "test" })));
  await assert.rejects(syncSentEmailToPipeline("email-1", fixture.db), /conflict/);
  assert.equal(fixture.transactions, 3);
  assert.equal(fixture.state.deal, null);
});
