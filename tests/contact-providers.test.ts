import assert from "node:assert/strict";
import test from "node:test";
import type { Company } from "@prisma/client";
import { getContactProviders, searchStructuredContactProviders, type ContactProvider } from "../src/lib/contacts/providers";
import type { ContactCandidate } from "../src/lib/contacts/types";

const candidate: ContactCandidate = { name: "Jane Rivers", role: "Head of Partnerships", email: "jane@acme.fr", email_status: "verified", linkedin: null, confidence: "high", verification_status: "verified_current", current_at_company: true, evidence: "Current", source: "Test" };
const company = { id: "test-acme", name: "Acme France" } as Company;
const provider = (id: ContactProvider["id"], search: ContactProvider["search"], configured = true): ContactProvider => ({ id, isConfigured: () => configured, search });

test("Monid is first and a usable result avoids unnecessary Apollo spend", async () => {
  assert.deepEqual(getContactProviders().map((item) => item.id), ["monid", "apollo"]);
  const result = await searchStructuredContactProviders(company, undefined, {}, [
    provider("monid", async () => ({ contacts: [candidate], diagnostics: [], emailDiscoveryComplete: true })),
    provider("apollo", async () => { assert.fail("unnecessary Apollo spend"); }),
  ]);
  assert.equal(result.contacts[0].email, candidate.email);
});

test("missing or failed Monid falls back to Apollo without retrying or leaking an upstream error", async () => {
  for (const configured of [false, true]) {
    let attempts = 0;
    const result = await searchStructuredContactProviders(company, undefined, {}, [
      provider("monid", async () => { attempts += 1; throw new Error("API_SECRET"); }, configured),
      provider("apollo", async () => ({ contacts: [candidate], diagnostics: [] })),
    ]);
    assert.equal(attempts, configured ? 1 : 0);
    assert.equal(result.contacts[0].email, candidate.email);
    assert.ok(!JSON.stringify(result).includes("API_SECRET"));
  }
});

test("Apollo cannot promote an address Monid rejected as catch-all or inconclusive", async () => {
  const result = await searchStructuredContactProviders(company, undefined, {}, [
    provider("monid", async () => ({ contacts: [{ ...candidate, email: null, email_status: "missing" }], diagnostics: [], rejectedEmails: [candidate.email!], emailDiscoveryComplete: true })),
    provider("apollo", async () => ({ contacts: [candidate], diagnostics: [] })),
  ]);
  assert.equal(result.contacts[0].email, null);
  assert.deepEqual(result.rejectedEmails, [candidate.email]);
  assert.equal(result.emailDiscoveryComplete, true);
});

test("cancellation prevents starting a subsequent provider", async () => {
  const controller = new AbortController();
  controller.abort();
  const result = await searchStructuredContactProviders(company, undefined, { signal: controller.signal }, [provider("monid", async () => { assert.fail("cancelled request"); })]);
  assert.equal(result.contacts.length, 0);
});
