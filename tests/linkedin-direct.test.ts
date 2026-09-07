import assert from "node:assert/strict";
import test from "node:test";
import type { Company } from "@prisma/client";
import { selectDirectContacts, type DirectProfile } from "../src/lib/contacts/linkedin-direct";
import { searchMonidContacts } from "../src/lib/contacts/monid";

const url = "https://www.linkedin.com/company/acme";
const profile: DirectProfile = { name: "Jane Rivers", role: "Head of Sponsorship", linkedin: "https://www.linkedin.com/in/jane-rivers", companyLinkedinUrl: url, current: true, evidence: "Head of Sponsorship | Acme | 2025 - Present", observedAt: Date.now() };
test("direct results require current exact-company attributed fresh profiles", () => {
  for (const patch of [{ current: false }, { companyLinkedinUrl: url + "-other" }, { name: "Jane R." }, { observedAt: 0 }, { role: "Accountant" }, { evidence: "" }]) {
    assert.equal(selectDirectContacts({ status: "success", profiles: [{ ...profile, ...patch }], excludedProfiles: [] }, url, "acme").length, 0);
  }
  assert.equal(selectDirectContacts({ status: "success", profiles: [profile], excludedProfiles: [profile.linkedin] }, url, "acme").length, 0);
  assert.equal(selectDirectContacts({ status: "success", profiles: [profile, profile], excludedProfiles: [] }, url, "acme").length, 1);
});
const receipt = (output: unknown) => ({ output, runId: "test", costUsd: 0, notFound: false });
test("direct identification skips paid LinkedIn but preserves verified email lookup", async () => {
  let found = 0;
  const result = await searchMonidContacts({ id: "acme", name: "Acme", website: "https://acme.com" } as Company, undefined, {}, {
    directSearch: async () => ({ status: "success", profiles: [profile], excludedProfiles: [] }),
    resolveContext: async () => ({ companyLinkedinUrl: url, linkedinSource: "https://acme.com", emailDomains: [{ domain: "acme.com", source: "https://acme.com", evidence: "official" }], mailboxes: [] }),
    client: {
      employees: async () => assert.fail("Paid LinkedIn should not run"),
      findEmail: async () => { found++; return receipt({ data: { first_name: "Jane", last_name: "Rivers", email: "jane.rivers@acme.com" } }); },
      verifyEmail: async () => receipt({ data: { email: "jane.rivers@acme.com", status: "valid", result: "deliverable", score: 99, accept_all: false, smtp_check: true, mx_records: true, smtp_server: true, block: false } }),
      searchApolloPeople: async () => assert.fail("No Apollo when verified"),
      matchApolloPerson: async () => assert.fail("No Apollo when verified"), usage: { costUsd: 0, reservedUsd: 0 },
    },
  });
  assert.equal(found, 1);
  assert.equal(result.contacts[0].email, "jane.rivers@acme.com");
  assert.equal(result.contacts[0].provider, "linkedin_direct");
});
test("offline direct connector immediately falls back to Monid", async () => {
  let calls = 0;
  await searchMonidContacts({ id: "acme", name: "Acme", website: "https://acme.com" } as Company, undefined, {}, {
    directSearch: async () => ({ status: "unavailable", profiles: [], excludedProfiles: [] }),
    resolveContext: async () => ({ companyLinkedinUrl: url, linkedinSource: "https://acme.com", emailDomains: [], mailboxes: [] }),
    client: { employees: async () => { calls++; return receipt([]); }, findEmail: async () => receipt({}), verifyEmail: async () => receipt({}), searchApolloPeople: async () => receipt({ people: [] }), matchApolloPerson: async () => receipt({}), usage: { costUsd: 0, reservedUsd: 0 } },
  });
  assert.equal(calls, 1);
});
