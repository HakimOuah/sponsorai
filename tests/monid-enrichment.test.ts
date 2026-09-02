import assert from "node:assert/strict";
import test from "node:test";
import type { Company } from "@prisma/client";
import { searchMonidContacts, selectCurrentLinkedinContacts, isDeliverableHunterEmail } from "../src/lib/contacts/monid";
import { MonidError } from "../src/lib/contacts/monid-client";
import type { CompanyContactContext } from "../src/lib/contacts/company-context";
import { visibleContact, visibleDiagnostics } from "../src/lib/contacts/visibility";
import { companyContactUpdate } from "../src/lib/contacts/company-primary";
import { getContactRelevance } from "../src/lib/agents/contact-quality";
import type { PublicContactSummary } from "../src/lib/contacts/types";

const company = { id: "acme", name: "Acme France", website: "https://acme.fr", country: "France" } as Company;
const companyUrl = "https://www.linkedin.com/company/acme-france";
const profile = (overrides: Record<string, unknown> = {}) => ({
  firstName: "Jane", lastName: "Rivers", linkedinUrl: "https://www.linkedin.com/in/jane-rivers",
  currentPosition: [{ position: "Responsable Sponsoring", companyLinkedinUrl: companyUrl, endDate: { text: "Present" } }],
  ...overrides,
});
const context: CompanyContactContext = {
  companyLinkedinUrl: companyUrl, linkedinSource: "https://acme.fr",
  emailDomains: [{ domain: "acme-group.com", source: "https://acme.fr/presse", evidence: "Contacts presse" }, { domain: "acme.fr", source: "https://acme.fr", evidence: "Website" }],
  mailboxes: [{ email: "contact@acme.fr", source: "https://acme.fr/contact" }],
};
const receipt = (output: unknown) => ({ output, runId: "TEST", costUsd: 0.01, notFound: false });
const verified = (email: string, overrides: Record<string, unknown> = {}) => ({ data: { email, status: "valid", result: "deliverable", score: 90, accept_all: false, smtp_check: true, mx_records: true, smtp_server: true, block: false, ...overrides } });
const emptyClient = () => ({
  employees: async () => receipt([profile()]),
  findEmail: async (_name: string, _domain: string) => receipt({ data: {} }),
  verifyEmail: async (email: string) => receipt(verified(email)),
  searchApolloPeople: async () => receipt({ people: [] }),
  matchApolloPerson: async (_id: string) => receipt({ person: null }),
  usage: { costUsd: 0.05, reservedUsd: 0.10 },
});

test("Monid rejects former employees, company homonyms, obfuscated names and wrong roles", () => {
  const inputs = [
    profile(),
    profile({ firstName: "Past", currentPosition: [{ position: "Marketing Director", companyLinkedinUrl: companyUrl, endDate: { year: 2024, text: "2024" } }] }),
    profile({ firstName: "Other", currentPosition: [{ position: "Marketing Director", companyLinkedinUrl: "https://www.linkedin.com/company/acme-unrelated" }] }),
    profile({ lastName: "R***" }),
    profile({ firstName: "Finance", currentPosition: [{ position: "Finance Director", companyLinkedinUrl: companyUrl }] }),
  ];
  const contacts = selectCurrentLinkedinContacts(inputs, companyUrl, company.id);
  assert.equal(contacts.length, 1);
  assert.equal(contacts[0].name, "Jane Rivers");
  assert.equal(contacts[0].email, null);
  assert.equal(getContactRelevance("Responsable Sponsoring et Partenariats"), 3);
  assert.equal(getContactRelevance("Directrice marque et communication commerciale"), 2);
});

test("email lookup uses the evidenced corporate domain, verifies delivery separately and preserves source distinctions", async () => {
  const calls: string[] = [];
  const client = emptyClient();
  client.findEmail = async (_name, domain) => { calls.push(domain); return receipt({ data: { first_name: "Jane", last_name: "Rivers", email: "jane.rivers@acme-group.com", accept_all: false, verification: { status: "valid" } } }); };
  client.verifyEmail = async (email) => { calls.push(email); return receipt(verified(email)); };
  client.searchApolloPeople = async () => assert.fail("no Apollo call when LinkedIn/Hunter already found an email");
  const result = await searchMonidContacts(company, undefined, {}, { client, resolveContext: async () => context });
  assert.deepEqual(calls, ["acme-group.com", "jane.rivers@acme-group.com"]);
  assert.equal(result.contacts[0].email_status, "verified");
  assert.equal(result.contacts[0].email_kind, "personal_professional");
  assert.match(result.contacts[0].email_evidence!, /n’est pas une preuve de publication/);
  assert.equal(result.contacts[0].source, "Monid · LinkedIn (HarvestAPI)");
  assert.equal(result.emailDiscoveryComplete, true);
});

test("Apollo via the same Monid client works without a LinkedIn page and before a generic mailbox", async () => {
  const calls: string[] = [];
  const client = emptyClient();
  client.employees = async () => assert.fail("no unverified LinkedIn company lookup");
  client.searchApolloPeople = async () => {
    calls.push("apollo-search");
    return receipt({ people: [{ id: "person-1", first_name: "Jane", last_name_obfuscated: "R***", title: "Head of Partnerships", has_email: true, organization: { name: "Acme France" } }] });
  };
  client.matchApolloPerson = async (id) => {
    calls.push(id);
    return receipt({ person: { id, name: "Jane Rivers", title: "Head of Partnerships", email: "jane@acme.fr", email_status: "verified", organization: { primary_domain: "acme.fr" } } });
  };
  client.verifyEmail = async (email) => { calls.push(email); return receipt(verified(email)); };
  const result = await searchMonidContacts(company, undefined, {}, { client, resolveContext: async () => ({ ...context, companyLinkedinUrl: null }) });
  assert.deepEqual(calls, ["apollo-search", "person-1", "jane@acme.fr"]);
  assert.equal(result.contacts[0].provider, "apollo");
  assert.equal(result.contacts[0].email, "jane@acme.fr");
  assert.ok(result.diagnostics.some((entry) => entry.provider === "apollo" && entry.status === "success"));
  assert.equal(result.diagnostics.find((entry) => entry.stage === "budget")?.costUsd, client.usage.costUsd);
});

test("Apollo stays available if official context resolution fails, with no invented alternate domain", async () => {
  let calls = 0;
  const client = emptyClient();
  client.searchApolloPeople = async () => { calls += 1; return receipt({ people: [] }); };
  const result = await searchMonidContacts(company, undefined, {}, { client, resolveContext: async () => { throw new Error("private upstream body"); } });
  assert.equal(calls, 1);
  assert.equal(result.contacts.length, 0);
  assert.ok(!JSON.stringify(result).includes("private upstream body"));
});

test("Apollo cannot resurrect a rejected Hunter email and duplicate a LinkedIn identity", async () => {
  const client = emptyClient();
  client.findEmail = async () => receipt({ data: { first_name: "Jane", last_name: "Rivers", email: "jane@acme.fr", accept_all: true } });
  client.searchApolloPeople = async () => receipt({ people: [{ id: "person-1", name: "Jane Rivers", title: "Head of Partnerships", has_email: true, organization: { name: company.name } }] });
  client.matchApolloPerson = async (id) => receipt({ person: { id, name: "Jane Rivers", title: "Head of Partnerships", email: "jane@acme.fr", email_status: "verified", organization: { primary_domain: "acme.fr" } } });
  client.verifyEmail = async () => assert.fail("previously rejected email must not be retried");
  const result = await searchMonidContacts(company, undefined, {}, { client, resolveContext: async () => ({ ...context, mailboxes: [] }) });
  assert.equal(result.contacts.length, 1);
  assert.equal(result.contacts[0].email, null);
  assert.ok(result.rejectedEmails?.includes("jane@acme.fr"));
});

test("the LinkedIn shortlist prioritizes sponsorship owners and senior brand leaders over generic roles", () => {
  const roles = ["Event Business Specialist", "Directrice marque et communication", "Expert Sponsoring", "Head of Brand", "Marketing Director"];
  const inputs = roles.map((position, index) => profile({ firstName: `Person${index}`, linkedinUrl: `https://linkedin.com/in/person-${index}`, openToWork: index === 4, currentPosition: [{ position, companyLinkedinUrl: companyUrl }] }));
  const contacts = selectCurrentLinkedinContacts(inputs, companyUrl, company.id);
  assert.deepEqual(contacts.map((contact) => contact.role), ["Expert Sponsoring", "Directrice marque et communication", "Head of Brand"]);
  assert.ok(!contacts.some((contact) => contact.name.startsWith("Person4")));
});

test("no named email falls back to a separate official mailbox, including when zero people exist", async () => {
  for (const people of [[profile()], []]) {
    const client = emptyClient();
    client.employees = async () => receipt(people);
    const result = await searchMonidContacts(company, undefined, {}, { client, resolveContext: async () => context });
    const box = result.contacts.find((contact) => contact.kind === "company_mailbox");
    assert.ok(box);
    assert.equal(box.name, company.name);
    assert.equal(box.email, "contact@acme.fr");
    assert.equal(box.email_kind, "functional_generic");
    assert.equal(box.linkedin, null);
    assert.ok(!box.email_evidence?.includes("Jane"));
    if (people.length) assert.equal(result.contacts[0].email, null);
  }
});

test("catch-all or inconclusive results are not promoted by another fallback", async () => {
  const client = emptyClient();
  client.findEmail = async (_name, domain) => receipt({ data: { first_name: "Jane", last_name: "Rivers", email: `jane@${domain}`, accept_all: true, verification: { status: "valid" } } });
  client.verifyEmail = async (email) => receipt(verified(email, { accept_all: true }));
  const result = await searchMonidContacts(company, undefined, {}, { client, resolveContext: async () => context });
  assert.equal(result.contacts.length, 1);
  assert.equal(result.contacts[0].email, null);
  assert.deepEqual(result.rejectedEmails?.sort(), ["contact@acme.fr", "jane@acme-group.com", "jane@acme.fr"]);
});

test("the official mailbox fallback never retries an address already rejected in this enrichment", async () => {
  const client = emptyClient();
  client.findEmail = async () => receipt({ data: { first_name: "Jane", last_name: "Rivers", email: "contact@acme.fr", accept_all: true } });
  client.verifyEmail = async () => assert.fail("do not resurrect or pay twice for a rejected address");
  const result = await searchMonidContacts(company, undefined, {}, { client, resolveContext: async () => context });
  assert.ok(result.contacts.every((contact) => !contact.email));
  assert.deepEqual(result.rejectedEmails, ["contact@acme.fr"]);
});

test("Hunter rejects invalid, mismatched, unknown, low-score, SMTP-failed and accept-all records", () => {
  const email = "jane@acme.fr";
  assert.equal(isDeliverableHunterEmail(verified(email), email), true);
  for (const patch of [{ status: "unknown" }, { result: "undeliverable" }, { accept_all: true }, { accept_all: null }, { smtp_check: false }, { score: 40 }, { block: true }, { email: "other@acme.fr" }]) {
    assert.equal(isDeliverableHunterEmail(verified(email, patch), email), false);
  }
});

test("wrong-person or personal-domain finder output cannot become a usable email", async () => {
  for (const data of [{ first_name: "Other", last_name: "Person", email: "other@acme-group.com" }, { first_name: "Jane", last_name: "Rivers", email: "jane@gmail.com" }]) {
    const client = emptyClient();
    client.findEmail = async () => receipt({ data: { ...data, accept_all: false } });
    const result = await searchMonidContacts(company, undefined, {}, { client, resolveContext: async () => ({ ...context, mailboxes: [] }) });
    assert.equal(result.contacts[0].email, null);
  }
});

test("a budget failure keeps verified current profiles available without inventing an email", async () => {
  const client = emptyClient();
  client.findEmail = async () => { throw new MonidError("budget"); };
  const result = await searchMonidContacts(company, undefined, {}, { client, resolveContext: async () => ({ ...context, mailboxes: [] }) });
  assert.equal(result.contacts[0].name, "Jane Rivers");
  assert.equal(result.contacts[0].email, null);
  assert.ok(result.diagnostics.some((item) => item.status === "failed" && /coût/.test(item.message)));
});

test("clients get a strict summary: no identities, private source URLs, cost receipts or emails", () => {
  const contact: PublicContactSummary = {
    id: "contact", role: "Sponsoring", roleNormalized: "SPORTS_PARTNERSHIPS", currentRoleVerified: true,
    contactability: "verified", relevance: 100, score: 95, scoreVersion: "test",
    name: "Jane Rivers", email: "jane@acme.fr", emailStatus: "verified", emailEvidence: "Jane Rivers, jane@acme.fr",
    source: "https://linkedin.com/in/jane-rivers", profileSource: "https://linkedin.com/in/jane-rivers", emailSource: "private-source", emailKind: "personal_professional",
  };
  const publicJson = JSON.stringify(visibleContact(contact, false));
  for (const secret of ["Jane", "jane@", "jane-rivers", "private-source"]) assert.ok(!publicJson.includes(secret));
  assert.equal(visibleContact(contact, true).email, contact.email);
  const diagnostics = [{ provider: "monid" as const, stage: "email_verification" as const, status: "success" as const, message: "Jane Rivers: jane@acme.fr", costUsd: 0.10 }];
  assert.ok(!JSON.stringify(visibleDiagnostics(diagnostics, false)).includes("jane@"));
  assert.equal(visibleDiagnostics(diagnostics, false)[0].costUsd, undefined);
});

test("a company primary contact never mixes an old recipient with a new verification record", () => {
  const old = { ...company, contactName: "Old Recipient", contactEmail: "old@acme.fr", contactEmailStatus: "verified" } as Company;
  const candidate = { ...selectCurrentLinkedinContacts([profile()], companyUrl, company.id)[0], email: "jane@acme-group.com", email_status: "verified" as const };
  assert.equal(companyContactUpdate(old, candidate), null);
  const update = companyContactUpdate({ ...old, contactEmailStatus: "missing" }, candidate);
  assert.ok(update && "contactName" in update);
  assert.equal(update?.contactName, "Jane Rivers");
  assert.equal(update?.contactEmail, "jane@acme-group.com");
  assert.equal(update?.outreachReady, true);
  assert.deepEqual(companyContactUpdate(old, undefined, ["old@acme.fr"]), { contactEmailStatus: "missing", outreachReady: false });
});
