import assert from "node:assert/strict";
import test from "node:test";
import type { Company } from "@prisma/client";
import { createEnrichmentHandler, type EnrichmentDependencies } from "../src/lib/contacts/enrichment-handler";
import { searchMonidContacts } from "../src/lib/contacts/monid";
import type { PublicContactSummary } from "../src/lib/contacts/types";

const company = { id: "test-acme", name: "Acme France", website: "https://acme.fr", contactEmailStatus: "missing" } as Company;
const contact: PublicContactSummary = {
  id: "test-contact", kind: "person", name: "Jane Rivers", role: "Responsable sponsoring",
  roleNormalized: "SPORTS_PARTNERSHIPS", currentRoleVerified: true,
  contactability: "verified", relevance: 100, score: 95, scoreVersion: "test",
  email: "jane@acme.fr", emailStatus: "verified", emailSource: "Hunter via Monid",
  emailEvidence: "Vérification de jane@acme.fr", source: "Monid", profileSource: "https://linkedin.com/in/jane-rivers",
};
const request = (body: unknown = { companyId: company.id }, signal?: AbortSignal) => new Request("https://app.test/api/agents/enrichisseur", { method: "POST", body: JSON.stringify(body), signal });
const events = (body: string) => body.split("\n\n").filter(Boolean).map((line) => JSON.parse(line.slice(6)));
function dependencies(overrides: Partial<EnrichmentDependencies> = {}): EnrichmentDependencies {
  return {
    getAccess: async () => ({ authenticated: true, isAdmin: true, isFreeUser: false, canOperate: true, role: "admin", userId: "test-admin", userName: "Test Admin" }),
    findCompany: async () => company,
    enrich: async () => ({ contacts: [], company_insights: "Private: Jane Rivers jane@acme.fr", diagnostics: [{ provider: "monid", stage: "email_verification", status: "success", message: "Jane Rivers jane@acme.fr", costUsd: 0.10 }] }),
    persist: async () => [contact],
    updateCompany: async () => undefined,
    recordActivity: async () => undefined,
    reportError: () => undefined,
    ...overrides,
  };
}

test("enrichment rejects anonymous and free users before any lookup or paid request", async () => {
  for (const authenticated of [false, true]) {
    const deps = dependencies();
    const access = await deps.getAccess();
    deps.getAccess = async () => ({ ...access, authenticated, isAdmin: false, isFreeUser: true, canOperate: false, role: "free_user" });
    deps.findCompany = async () => { assert.fail("unauthorized lookup"); };
    deps.enrich = async () => { assert.fail("unauthorized provider call"); };
    const response = await createEnrichmentHandler(deps)(request());
    assert.equal(response.status, authenticated ? 403 : 401);
  }
});

test("enrichment validates the request and company before starting a stream", async () => {
  const handler = createEnrichmentHandler(dependencies({ enrich: async () => { assert.fail("provider call"); } }));
  for (const input of [null, {}, { companyId: 4 }, { companyId: " " }, { companyId: "x".repeat(201) }]) {
    assert.equal((await handler(request(input))).status, 400);
  }
  assert.equal((await handler(new Request("https://app.test/", { method: "POST", body: "not-json" }))).status, 400);
  const missing = createEnrichmentHandler(dependencies({ findCompany: async () => null }));
  assert.equal((await missing(request())).status, 404);
});

test("admin HTTP flow runs LinkedIn discovery and verification, persists then emits safe progress and a usable contact", async () => {
  const calls: string[] = [];
  const companyUrl = "https://www.linkedin.com/company/acme-france";
  const value = (output: unknown) => ({ output, notFound: false, runId: "test-run", costUsd: 0.01 });
  const deps = dependencies({
    enrich: async (target, log, options) => {
      assert.ok(options.signal);
      log("Private upstream log: API_TOKEN_SECRET");
      const result = await searchMonidContacts(target, log, options, {
        resolveContext: async () => ({ companyLinkedinUrl: companyUrl, linkedinSource: "https://acme.fr", emailDomains: [{ domain: "acme.fr", source: "https://acme.fr", evidence: "Official" }], mailboxes: [] }),
        client: {
          employees: async () => { calls.push("linkedin"); return value([{ firstName: "Jane", lastName: "Rivers", linkedinUrl: "https://linkedin.com/in/jane-rivers", currentPosition: [{ position: "Responsable sponsoring", companyLinkedinUrl: companyUrl }] }]); },
          findEmail: async () => { calls.push("finder"); return value({ data: { email: "jane@acme.fr", first_name: "Jane", last_name: "Rivers", accept_all: false } }); },
          verifyEmail: async () => { calls.push("verifier"); return value({ data: { email: "jane@acme.fr", status: "valid", result: "deliverable", score: 100, accept_all: false, smtp_check: true, mx_records: true, smtp_server: true } }); },
          searchApolloPeople: async () => assert.fail("LinkedIn/Hunter already returned a usable email"),
          matchApolloPerson: async () => assert.fail("no unnecessary Apollo reveal"),
          usage: { costUsd: 0.03, reservedUsd: 0.10 },
        },
      });
      return { ...result, company_insights: "One verified contact" };
    },
    persist: async (id, contacts, options) => {
      calls.push("persist");
      assert.equal(id, company.id);
      assert.equal(options.includePrivate, true);
      assert.equal(contacts[0].email, "jane@acme.fr");
      return [contact];
    },
    updateCompany: async (_id, data) => { calls.push("company"); assert.ok("contactEmail" in data && data.contactEmail === "jane@acme.fr"); },
    recordActivity: async (activity) => {
      calls.push("activity");
      assert.equal(activity.usableEmails, 1);
      assert.ok(!JSON.stringify(activity).includes("jane@"));
    },
  });
  const response = await createEnrichmentHandler(deps)(request());
  assert.equal(response.headers.get("Content-Type"), "text/event-stream");
  assert.match(response.headers.get("Cache-Control")!, /private, no-store/);
  const body = await response.text();
  assert.ok(!body.includes("API_TOKEN_SECRET"));
  const stream = events(body);
  const progress = stream.filter((event) => event.type === "log").map((event) => event.progress as number);
  assert.deepEqual(progress, [...progress].sort((a, b) => a - b));
  assert.equal(stream.at(-1).type, "done");
  assert.equal(stream.at(-1).result.contacts[0].email, "jane@acme.fr");
  assert.deepEqual(calls, ["linkedin", "finder", "verifier", "persist", "company", "activity"]);
});

test("client HTTP/SSE payload excludes identities, email evidence, profile URLs and costs even if persistence returns them", async () => {
  const deps = dependencies();
  const access = await deps.getAccess();
  deps.getAccess = async () => ({ ...access, isAdmin: false, role: "client" });
  const response = await createEnrichmentHandler(deps)(request());
  const body = await response.text();
  for (const secret of ["Jane", "jane@", "jane-rivers", "costUsd", "Private:"]) assert.ok(!body.includes(secret));
  const done = events(body).at(-1);
  assert.equal(done.result.canViewContactDetails, false);
  assert.equal(done.result.contacts[0].id, contact.id);
  assert.equal(done.result.contacts[0].contactability, "verified");
});

test("Apollo via Monid reaches persistence and the agent result without exposing contacts to client roles", async () => {
  for (const isAdmin of [true, false]) {
    const calls: string[] = [];
    const value = (output: unknown) => ({ output, notFound: false, runId: "test-apollo-run", costUsd: 0.01 });
    const deps = dependencies({
      enrich: async (target, log, options) => ({
        ...await searchMonidContacts(target, log, options, {
          resolveContext: async () => ({ companyLinkedinUrl: null, linkedinSource: null, emailDomains: [], mailboxes: [] }),
          client: {
            employees: async () => assert.fail("unconfirmed LinkedIn company"),
            findEmail: async () => assert.fail("no LinkedIn identity to enrich"),
            searchApolloPeople: async () => { calls.push("search"); return value({ people: [{ id: "apollo-jane", title: "Head of Partnerships", has_email: true, organization: { name: company.name } }] }); },
            matchApolloPerson: async (id) => { calls.push("reveal"); assert.equal(id, "apollo-jane"); return value({ person: { id, name: "Jane Rivers", title: "Head of Partnerships", email: "jane@acme.fr", email_status: "verified", organization: { primary_domain: "acme.fr" } } }); },
            verifyEmail: async (email) => { calls.push("verify"); return value({ data: { email, status: "valid", result: "deliverable", score: 100, accept_all: false, smtp_check: true, mx_records: true, smtp_server: true } }); },
            usage: { costUsd: 0.06196, reservedUsd: 0.06196 },
          },
        }),
        company_insights: "Apollo via Monid",
      }),
      persist: async (_id, candidates) => {
        calls.push("persist");
        assert.equal(candidates[0].provider, "apollo");
        assert.equal(candidates[0].providerExternalId, "apollo-jane");
        assert.equal(candidates[0].email, "jane@acme.fr");
        return [{ ...contact, source: candidates[0].source, emailSource: candidates[0].email_source }];
      },
      updateCompany: async (_id, data) => { calls.push("company"); assert.ok("contactEmail" in data && data.contactEmail === "jane@acme.fr"); },
    });
    const access = await deps.getAccess();
    deps.getAccess = async () => ({ ...access, isAdmin, role: isAdmin ? "admin" : "client" });
    const body = await (await createEnrichmentHandler(deps)(request())).text();
    const done = events(body).at(-1);
    assert.equal(done.type, "done");
    assert.equal(done.result.contacts[0].contactability, "verified");
    assert.equal(done.result.canViewContactDetails, isAdmin);
    assert.deepEqual(calls, ["search", "reveal", "verify", "persist", "company"]);
    if (isAdmin) assert.equal(done.result.contacts[0].email, "jane@acme.fr");
    else for (const privateValue of ["Jane", "jane@", "jane-rivers", "costUsd"]) assert.ok(!body.includes(privateValue));
  }
});

test("upstream failures are redacted and never trigger a second paid request", async () => {
  let calls = 0;
  const deps = dependencies({
    enrich: async () => { calls += 1; throw new Error("Authorization: SecretKey jane@acme.fr"); },
    persist: async () => { assert.fail("should not persist a failure"); },
  });
  const body = await (await createEnrichmentHandler(deps)(request())).text();
  assert.equal(calls, 1);
  assert.equal(events(body).at(-1).type, "error");
  assert.ok(!body.includes("SecretKey") && !body.includes("jane@"));
});

test("a stalled provider receives cancellation, heartbeats do not pretend that progress advances", async () => {
  let cancelled = false;
  const deps = dependencies({
    enrich: (_company, _log, { signal }) => new Promise((_resolve, reject) => {
      signal!.addEventListener("abort", () => { cancelled = true; reject(new Error("aborted")); }, { once: true });
    }),
    persist: async () => { assert.fail("timed-out work must not persist"); },
  });
  const handler = createEnrichmentHandler(deps, { deadlineMs: 30, abortMs: 60, heartbeatMs: 5 });
  const body = events(await (await handler(request())).text());
  assert.equal(cancelled, true);
  assert.ok(body.some((event) => event.type === "heartbeat"));
  assert.ok(body.filter((event) => event.type === "heartbeat").every((event) => event.progress === undefined));
  assert.equal(body.at(-1).type, "error");
});

test("disconnecting the stream aborts provider work; an already aborted request never starts it", async () => {
  let cancelled = false;
  const deps = dependencies({
    enrich: (_company, log, { signal }) => new Promise((_resolve, reject) => {
      signal!.addEventListener("abort", () => { cancelled = true; reject(new Error("disconnected")); }, { once: true });
      log("Recherche LinkedIn");
    }),
    persist: async () => { assert.fail("disconnected work must not persist"); },
  });
  const reader = (await createEnrichmentHandler(deps)(request())).body!.getReader();
  await reader.read();
  await reader.cancel();
  assert.equal(cancelled, true);
  const abort = new AbortController();
  abort.abort();
  const response = await createEnrichmentHandler(dependencies({ enrich: async () => { assert.fail("already disconnected"); } }))(request(undefined, abort.signal));
  assert.equal(events(await response.text()).at(-1).type, "error");
});
