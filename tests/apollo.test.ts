import assert from "node:assert/strict";
import test from "node:test";
import type { Company } from "@prisma/client";
import { checkApolloConnection, searchApolloContacts } from "../src/lib/agents/apollo";
import { MonidClient, MonidError } from "../src/lib/contacts/monid-client";

const company = { name: "Acme France", website: "https://acme.fr" } as Company;
const preview = (patch = {}) => ({ id: "apollo-1", first_name: "Jane", last_name_obfuscated: "R***", title: "Head of Partnerships", has_email: true, organization: { name: company.name }, ...patch });
const person = (patch = {}) => ({ id: "apollo-1", name: "Jane Rivers", title: "Head of Partnerships", email: "jane@acme.fr", email_status: "verified", linkedin_url: "https://www.linkedin.com/in/jane-rivers", organization: { name: company.name, primary_domain: "acme.fr" }, ...patch });
const receipt = (output: unknown) => ({ output, runId: "TEST", costUsd: 0.05, notFound: false });
const verified = (email: string, patch = {}) => ({ data: { email, status: "valid", result: "deliverable", score: 95, accept_all: false, smtp_check: true, mx_records: true, smtp_server: true, ...patch } });
const client = () => ({
  searchApolloPeople: async (_domain: string, _titles: readonly string[]) => receipt({ people: [preview()] }),
  matchApolloPerson: async (_id: string) => receipt({ person: person() }),
  verifyEmail: async (email: string) => receipt(verified(email)),
});

test("Apollo through Monid matches a stable id, verifies the work email and preserves the persisted provider/id", async () => {
  const api = client();
  const calls: string[] = [];
  api.searchApolloPeople = async (domain, titles) => {
    calls.push(domain);
    assert.ok(titles.includes("sponsorship manager"));
    return receipt({ people: [preview()] });
  };
  api.matchApolloPerson = async (id) => { calls.push(id); return receipt({ person: person() }); };
  api.verifyEmail = async (email) => { calls.push(email); return receipt(verified(email)); };
  const result = await searchApolloContacts(company, undefined, {}, { client: api });
  assert.deepEqual(calls, ["acme.fr", "apollo-1", "jane@acme.fr"]);
  assert.equal(result.contacts[0].email, "jane@acme.fr");
  assert.equal(result.contacts[0].provider, "apollo");
  assert.equal(result.contacts[0].providerExternalId, "apollo-1");
  assert.equal(result.contacts[0].email_status, "verified");
  assert.match(result.contacts[0].email_source!, /via Monid/);
});

test("Apollo does not spend a reveal on unavailable emails, wrong companies, unrelated roles or duplicate ids", async () => {
  const api = client();
  api.searchApolloPeople = async () => receipt({ people: [
    preview({ has_email: false }), preview({ id: "other", organization: { name: "Acme unrelated" } }),
    preview({ id: "finance", title: "Finance Director" }),
  ] });
  api.matchApolloPerson = async () => assert.fail("no reveal required");
  assert.equal((await searchApolloContacts(company, undefined, {}, { client: api })).contacts.length, 0);
  let calls = 0;
  api.searchApolloPeople = async () => receipt({ people: [preview(), preview()] });
  api.matchApolloPerson = async () => { calls += 1; return receipt({ person: person() }); };
  await searchApolloContacts(company, undefined, {}, { client: api });
  assert.equal(calls, 1);
});

test("reveals at most three people and keeps prior usable contacts when a later call fails", async () => {
  const api = client();
  const previews = Array.from({ length: 10 }, (_, index) => preview({ id: `apollo-${index}` }));
  api.searchApolloPeople = async () => receipt({ people: previews });
  const ids: string[] = [];
  api.matchApolloPerson = async (id) => { ids.push(id); return receipt({ person: person({ id, name: `Jane Rivers${id}`, email: `jane.${id}@acme.fr` }) }); };
  assert.equal((await searchApolloContacts(company, undefined, {}, { client: api })).contacts.length, 3);
  assert.equal(ids.length, 3);
  ids.length = 0;
  api.matchApolloPerson = async (id) => {
    ids.push(id);
    if (ids.length > 1) throw new MonidError("budget");
    return receipt({ person: person({ id }) });
  };
  const result = await searchApolloContacts(company, undefined, {}, { client: api });
  assert.equal(result.contacts[0].email, "jane@acme.fr");
  assert.equal(ids.length, 2);
  assert.ok(result.diagnostics.some((item) => item.status === "failed"));
});

test("rejects changed ids, incomplete identities and a current employer different from the searched company", async () => {
  for (const patch of [{ id: "someone-else" }, { name: "Jane R***" }, { name: "Jane" }, { organization: { name: "Unrelated", primary_domain: "unrelated.fr" } }]) {
    const api = client();
    api.matchApolloPerson = async () => receipt({ person: person(patch) });
    api.verifyEmail = async () => assert.fail("invalid identity");
    const result = await searchApolloContacts(company, undefined, {}, { client: api });
    assert.equal(result.contacts.length, 0);
  }
});

test("unknown, catch-all, invalid, mismatched and previously rejected emails remain blocked", async () => {
  for (const patch of [{ accept_all: true }, { result: "undeliverable" }, { status: "unknown" }, { email: "someone.else@acme.fr" }, { smtp_check: false }]) {
    const api = client();
    api.verifyEmail = async (email) => receipt(verified(email, patch));
    const result = await searchApolloContacts(company, undefined, {}, { client: api });
    assert.equal(result.contacts[0].email, null);
    assert.deepEqual(result.rejectedEmails, ["jane@acme.fr"]);
  }
  const api = client();
  api.verifyEmail = async () => assert.fail("do not retry a previously rejected email");
  const result = await searchApolloContacts(company, undefined, {}, { client: api, rejectedEmails: new Set(["jane@acme.fr"]) });
  assert.equal(result.contacts[0].email, null);
});

test("requires evidence for alternate domains and never labels a generic mailbox as a person's email", async () => {
  for (const email of ["jane@gmail.com", "jane@unrelated.fr", "contact@acme.fr", "press.team@acme.fr", "jobs@acme.fr", "not-an-email"]) {
    const api = client();
    api.matchApolloPerson = async () => receipt({ person: person({ email }) });
    api.verifyEmail = async () => assert.fail("do not verify an untrusted or generic address as a person");
    const result = await searchApolloContacts(company, undefined, {}, { client: api });
    assert.equal(result.contacts[0].email, null);
    assert.deepEqual(result.rejectedEmails, [], "missing attribution must not invalidate another contact or official mailbox");
  }
  const api = client();
  api.matchApolloPerson = async () => receipt({ person: person({ email: "jane@acme-group.com", organization: { name: company.name, primary_domain: "acme-group.com" } }) });
  const result = await searchApolloContacts(company, undefined, {}, { client: api, trustedDomains: ["acme-group.com"] });
  assert.equal(result.contacts[0].email, "jane@acme-group.com");
});

test("an unverified Apollo label does not invalidate an independently verified stored address", async () => {
  const api = client();
  api.matchApolloPerson = async () => receipt({ person: person({ email_status: "unknown" }) });
  api.verifyEmail = async () => assert.fail("no verified provider address to check");
  const result = await searchApolloContacts(company, undefined, {}, { client: api });
  assert.equal(result.contacts[0].email, null);
  assert.deepEqual(result.rejectedEmails, []);
});

test("sanitizes errors and honours an already expired deadline", async () => {
  const api = client();
  api.matchApolloPerson = async () => { throw new Error("private-key jane@acme.fr"); };
  const result = await searchApolloContacts(company, undefined, {}, { client: api });
  assert.ok(!JSON.stringify(result).includes("private-key"));
  assert.ok(!JSON.stringify(result).includes("jane@"));
  api.searchApolloPeople = async () => assert.fail("deadline expired");
  assert.equal((await searchApolloContacts(company, undefined, { deadline: Date.now() - 1 }, { client: api })).contacts.length, 0);
});

test("the full Apollo transport works with only Monid and the health check never runs a paid operation", async (t) => {
  const oldMonid = process.env.MONID_API_KEY;
  const oldApollo = process.env.APOLLO_API_KEY;
  const oldFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = oldFetch;
    if (oldMonid === undefined) delete process.env.MONID_API_KEY; else process.env.MONID_API_KEY = oldMonid;
    if (oldApollo === undefined) delete process.env.APOLLO_API_KEY; else process.env.APOLLO_API_KEY = oldApollo;
  });
  process.env.MONID_API_KEY = "monid-test-only";
  delete process.env.APOLLO_API_KEY;
  const runs: string[] = [];
  globalThis.fetch = async (input, init) => {
    assert.equal(new URL(String(input)).origin, "https://api.monid.ai");
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer monid-test-only");
    assert.equal(new Headers(init?.headers).get("x-api-key"), null);
    const body = JSON.parse(String(init?.body));
    if (String(input).endsWith("/inspect")) return Response.json({ price: { type: "PER_CALL", amount: { value: body.endpoint.includes("api_search") ? 0 : 0.05, currency: "USD" } } });
    runs.push(body.endpoint);
    let output: unknown;
    if (body.endpoint === "/mixed_people/api_search") {
      assert.deepEqual(body.input.queryParams["q_organization_domains_list[]"], ["acme.fr"]);
      output = { people: [preview()] };
    } else if (body.endpoint === "/people/match") {
      assert.deepEqual(body.input, { queryParams: { id: "apollo-1", reveal_personal_emails: false, reveal_phone_number: false } });
      output = { person: person() };
    } else {
      assert.equal(body.endpoint, "/email-verifier");
      output = verified(body.input.queryParams.email);
    }
    return Response.json({ runId: `TEST_${runs.length}`, status: "COMPLETED", providerResponse: { httpStatus: 200 }, output, cost: { value: body.endpoint.includes("api_search") ? 0 : 0.05, currency: "USD" } });
  };
  const shared = new MonidClient();
  const result = await searchApolloContacts(company, undefined, {}, { client: shared });
  assert.equal(result.contacts[0].email, "jane@acme.fr");
  assert.deepEqual(runs, ["/mixed_people/api_search", "/people/match", "/email-verifier"]);
  assert.equal(shared.usage.costUsd, 0.10);
  runs.length = 0;
  assert.equal((await checkApolloConnection()).ok, true);
  assert.equal(runs.length, 0);
  delete process.env.MONID_API_KEY;
  process.env.APOLLO_API_KEY = "unused-old-apollo";
  assert.equal((await checkApolloConnection()).configured, false);
});
