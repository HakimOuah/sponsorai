import assert from "node:assert/strict";
import test from "node:test";
import { MonidClient, MonidError, estimateMonidCost, readMonidCost } from "../src/lib/contacts/monid-client";

const price = { type: "PER_RESULT", amount: { value: 0.02, currency: "USD" } };
const completed = (output: unknown = {}, httpStatus = 200) => ({ runId: "TEST_RUN", status: "COMPLETED", output, providerResponse: { httpStatus }, cost: { value: httpStatus === 404 ? 0 : 0.02, currency: "USD" } });

test("Monid HTTP adapter", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  await t.test("uses the inspected nested input shape and never discloses the API key", async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    globalThis.fetch = async (input, init) => {
      const body = JSON.parse(String(init?.body || "{}"));
      calls.push({ url: String(input), body });
      assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer private-test-key");
      return Response.json(String(input).endsWith("/inspect") ? { price } : completed({ data: { email: "jane@acme.fr" } }));
    };
    const client = new MonidClient({ apiKey: "private-test-key" });
    await client.findEmail("Jane Rivers", "acme.fr");
    assert.deepEqual(calls[1].body.input, { queryParams: { domain: "acme.fr", full_name: "Jane Rivers", max_duration: 10 } });
    assert.equal(calls[1].body.provider, "hunterio");
    assert.equal(client.usage.costUsd, 0.02);
    assert.ok(!JSON.stringify(client.receipts).includes("private-test-key"));
  });

  await t.test("polls an async run without repeating its paid POST", async () => {
    let paidCalls = 0;
    let polls = 0;
    globalThis.fetch = async (input) => {
      if (String(input).endsWith("/inspect")) return Response.json({ price });
      if (String(input).endsWith("/run")) {
        paidCalls += 1;
        return Response.json({ runId: "ASYNC_RUN", status: "RUNNING" }, { status: 202 });
      }
      polls += 1;
      return Response.json({ ...completed([]), runId: "ASYNC_RUN" });
    };
    const client = new MonidClient({ apiKey: "test" });
    assert.deepEqual((await client.employees("https://www.linkedin.com/company/acme-france")).output, []);
    assert.equal(paidCalls, 1);
    assert.equal(polls, 1);
  });

  await t.test("reserves a common budget before concurrent paid lookups", async () => {
    let paidCalls = 0;
    let inspections = 0;
    globalThis.fetch = async (input) => {
      if (String(input).endsWith("/inspect")) { inspections += 1; return Response.json({ price }); }
      paidCalls += 1;
      return Response.json(completed());
    };
    const client = new MonidClient({ apiKey: "test", maxCostUsd: 0.03 });
    const results = await Promise.allSettled([client.findEmail("Jane Rivers", "acme.fr"), client.findEmail("Alex Taylor", "acme.fr")]);
    assert.equal(paidCalls, 1);
    assert.equal(inspections, 1);
    assert.equal(results.filter((result) => result.status === "rejected").length, 1);
    assert.equal(client.usage.reservedUsd, 0.02);
  });

  await t.test("refuses unbounded pricing before a paid call", async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls += 1; return Response.json({ price: { ...price, type: "TIERED" } }); };
    await assert.rejects(new MonidClient({ apiKey: "test" }).findEmail("Jane Rivers", "acme.fr"), (error: unknown) => error instanceof MonidError && error.code === "budget");
    assert.equal(calls, 1);
  });

  await t.test("treats COMPLETED with provider 404 as no result, not a valid email", async () => {
    globalThis.fetch = async (input) => Response.json(String(input).endsWith("/inspect") ? { price } : completed(null, 404));
    const result = await new MonidClient({ apiKey: "test" }).findEmail("Jane Rivers", "acme.fr");
    assert.equal(result.notFound, true);
    assert.equal(result.costUsd, 0);
  });

  await t.test("sanitizes errors and does not retry ambiguous paid requests", async () => {
    let paidCalls = 0;
    globalThis.fetch = async (input) => {
      if (String(input).endsWith("/inspect")) return Response.json({ price });
      paidCalls += 1;
      return Response.json({ error: "private-test-key jane@acme.fr" }, { status: 429 });
    };
    const client = new MonidClient({ apiKey: "test" });
    await assert.rejects(client.findEmail("Jane Rivers", "acme.fr"), (error: unknown) => error instanceof MonidError && !error.message.includes("jane@") && !error.message.includes("private-test-key"));
    await assert.rejects(client.findEmail("Jane Rivers", "acme.com"));
    assert.equal(paidCalls, 1);
    assert.equal(client.usage.costUsd, null);
    assert.equal(client.usage.reservedUsd, 0.02);
  });

  await t.test("stops a known async run after cancellation", async () => {
    const abort = new AbortController();
    const calls: string[] = [];
    globalThis.fetch = async (input) => {
      calls.push(String(input));
      if (String(input).endsWith("/inspect")) return Response.json({ price });
      if (String(input).endsWith("/stop")) return new Response(null, { status: 204 });
      abort.abort();
      return Response.json({ runId: "CANCEL_RUN", status: "RUNNING" }, { status: 202 });
    };
    await assert.rejects(new MonidClient({ apiKey: "test", signal: abort.signal }).employees("https://www.linkedin.com/company/acme-france"));
    assert.ok(calls.some((url) => url.endsWith("/CANCEL_RUN/stop")));
    assert.equal(calls.filter((url) => url.endsWith("/run")).length, 1);
  });
});

test("Monid prices include flat fees and normalize dollar vs micro-dollar receipts", () => {
  assert.equal(estimateMonidCost({ ...price, amount: { value: 0.018, currency: "USD" }, flatFee: { value: 0.02, currency: "USD" } }, 5), 0.11);
  assert.equal(readMonidCost({ billing: { reportedCost: { value: 23920, unit: "MICRO_DOLLAR", currency: "USD" } } }), 0.02392);
  assert.equal(readMonidCost({ cost: { value: 0.02392, currency: "USD" } }), 0.02392);
  assert.equal(readMonidCost({ cost: { value: 5000, unit: "UNKNOWN", currency: "USD" } }), null);
  assert.throws(() => estimateMonidCost({ ...price, amount: { value: 1, currency: "EUR" } }, 1));
});
