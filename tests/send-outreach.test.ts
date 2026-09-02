import assert from "node:assert/strict";
import test from "node:test";
import { sendOutreachEmail } from "../src/lib/email/send-outreach";
import { createOutreachDb } from "./helpers/outreach-db";

test("approved draft -> provider acceptance -> sent receipt -> Contacted pipeline", async () => {
  const fixture = createOutreachDb();
  fixture.draft();
  let sends = 0;
  fixture.deps.getProvider = () => ({ id: "smtp", send: async (message) => {
    sends++;
    assert.equal(message.to, "partnerships@example.test");
    assert.equal(message.text, "I represent Test Athlete.");
    assert.equal(fixture.state.deal, null);
    assert.equal(fixture.state.emails["email-1"].status, "sending");
    return { provider: "smtp", accepted: true, messageId: "<sent@example.test>" };
  } });
  const result = await sendOutreachEmail("email-1", fixture.deps);
  assert.equal(sends, 1);
  assert.equal(result.stage, "contacted");
  assert.equal(fixture.state.emails["email-1"].status, "sent");
  assert.ok(fixture.state.emails["email-1"].sentAt);
  assert.equal(fixture.state.emails["email-1"].messageId, "<sent@example.test>");
  assert.equal(fixture.state.outreachEvents.length, 1);
  assert.equal(fixture.state.threads.length, 1);
  assert.equal(fixture.state.learning.length, 1);

  await sendOutreachEmail("email-1", fixture.deps);
  assert.equal(sends, 1, "retrying a sent email must not deliver it again");
  assert.equal(fixture.state.dealEvents.length, 1);
});

test("rejected or failed sends leave a draft and never create a Contacted deal", async () => {
  for (const throws of [true, false]) {
    const fixture = createOutreachDb();
    fixture.draft();
    fixture.deps.getProvider = () => ({ id: "smtp", send: async () => {
      if (throws) throw new Error("SMTP unavailable");
      return { provider: "smtp", messageId: null, accepted: false };
    } });
    await assert.rejects(sendOutreachEmail("email-1", fixture.deps));
    assert.equal(fixture.state.emails["email-1"].status, "draft");
    assert.equal(fixture.state.emails["email-1"].sentAt, null);
    assert.equal(fixture.state.deal, null);
    assert.equal(fixture.state.prospect.status, "new");
    assert.equal(fixture.state.outreachEvents.length, 0);
  }
});

test("first-contact approval and contact qualification are still enforced before SMTP", async () => {
  for (const block of ["approval", "contact"]) {
    const fixture = createOutreachDb();
    fixture.draft();
    if (block === "approval") fixture.state.prospect.outreachApprovedAt = null;
    else fixture.state.company.outreachReady = false;
    fixture.deps.getProvider = () => assert.fail("must not contact a provider");
    await assert.rejects(sendOutreachEmail("email-1", fixture.deps));
    assert.equal(fixture.state.emails["email-1"].status, "draft");
    assert.equal(fixture.state.deal, null);
  }
});

test("a repeated click during sending cannot trigger a second provider call", async () => {
  const fixture = createOutreachDb();
  fixture.draft();
  let sends = 0;
  fixture.deps.getProvider = () => ({ id: "smtp", send: async () => {
    sends++;
    await assert.rejects(sendOutreachEmail("email-1", fixture.deps), /cours d’envoi/);
    return { provider: "smtp", messageId: "<sent@example.test>", accepted: true };
  } });
  await sendOutreachEmail("email-1", fixture.deps);
  assert.equal(sends, 1);
});

test("pipeline persistence failure keeps the SMTP receipt so a retry only repairs the deal", async () => {
  const fixture = createOutreachDb();
  fixture.draft();
  let sends = 0;
  fixture.deps.getProvider = () => ({ id: "smtp", send: async () => {
    sends++;
    return { provider: "smtp", messageId: "<sent@example.test>", accepted: true };
  } });
  fixture.failures.push(new Error("temporary database failure"));
  await assert.rejects(sendOutreachEmail("email-1", fixture.deps), /database failure/);
  assert.equal(fixture.state.emails["email-1"].status, "sent");
  assert.equal(fixture.state.emails["email-1"].messageId, "<sent@example.test>");
  assert.equal(fixture.state.deal, null);
  assert.equal(fixture.state.threads.length, 1, "reply tracking survives a pipeline failure");
  assert.equal(fixture.state.outreachEvents.length, 1);
  assert.equal((await sendOutreachEmail("email-1", fixture.deps)).stage, "contacted");
  assert.equal(sends, 1);
});

test("several sent drafts for one prospect reuse a single deal, as in Dispatcher batches", async () => {
  const fixture = createOutreachDb();
  fixture.draft();
  fixture.state.emails["email-2"] = { ...fixture.state.emails["email-1"], id: "email-2", type: "followup_1" };
  const first = await sendOutreachEmail("email-1", fixture.deps);
  const second = await sendOutreachEmail("email-2", fixture.deps);
  assert.equal(first.change, "created");
  assert.equal(second.change, "unchanged");
  assert.equal(first.dealId, second.dealId);
  assert.equal(fixture.state.dealEvents.length, 1);
});
