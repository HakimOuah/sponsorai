import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import type { Contact, ContactEmail, Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { getPublicContactsForCompany, persistContactCandidates } from "../src/lib/contacts/persistence";
import type { ContactCandidate } from "../src/lib/contacts/types";

const candidate: ContactCandidate = {
  name: "Jane Rivers", role: "Head of Partnerships", provider: "monid", providerExternalId: "linkedin-jane",
  linkedin: "https://linkedin.com/in/jane-rivers", email: null, email_status: "missing",
  confidence: "high", verification_status: "verified_current", current_at_company: true,
  evidence: "Current position", source: "Monid · LinkedIn", kind: "person",
};

function isolatedDatabase(t: TestContext, existing = true) {
  // Prisma delegates are dynamic proxies; assign methods directly and restore each one.
  const replace = (target: object, key: string, implementation: unknown) => {
    const delegate = target as Record<string, unknown>;
    const original = delegate[key];
    delegate[key] = implementation;
    t.after(() => { delegate[key] = original; });
  };
  const contact = {
    id: "test-contact", companyId: "test-company", fullName: "Jane Rivers", roleRaw: candidate.role,
    roleNormalized: "BRAND_PARTNERSHIPS", provider: "apollo", providerExternalId: "old-id",
    employmentStatus: "verified_current", employmentConfidence: 0.95, relevanceScore: 100,
    contactability: "verified", contactScore: 85, contactScoreVersion: "test", active: true,
    source: "Apollo", sourceUrl: candidate.linkedin,
  } as Contact;
  const emails = existing ? [{ id: "old-email", contactId: contact.id, email: "jane@acme.fr", emailHash: "old-hash", status: "verified", source: "Previous verified source", evidence: "Previous proof", isPrimary: true }] as ContactEmail[] : [];
  const state = { contact, emails, creates: 0, employments: 0, transactions: 0, exists: existing };
  const eligible = () => state.emails.filter((email) => ["verified", "public_source"].includes(email.status)).sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary)).slice(0, 1);
  replace(prisma.company, "findUnique", async () => ({ id: "test-company", sector: "Sports", country: "France", companySizeBucket: "small" }));
  replace(prisma.rolePerformanceStat, "findFirst", async () => null);
  replace(prisma.contact, "findFirst", async (args: Prisma.ContactFindFirstArgs) => {
    assert.equal(args.where?.companyId, "test-company", "deduplication must be scoped to the company");
    return state.exists ? { ...state.contact, contactEmails: eligible() } : null;
  });
  replace(prisma.contact, "findMany", async () => [{ ...state.contact, contactEmails: eligible() }]);
  replace(prisma.contact, "update", async (args: Prisma.ContactUpdateArgs) => Object.assign(state.contact, args.data));
  replace(prisma.contact, "create", async (args: Prisma.ContactCreateArgs) => {
    state.creates += 1;
    state.exists = true;
    return Object.assign(state.contact, args.data);
  });
  replace(prisma.contact, "updateMany", async () => {
    if (!eligible().length) state.contact.contactability = "missing";
    return { count: 1 };
  });
  replace(prisma.employment, "findFirst", async () => ({ id: "employment" }));
  replace(prisma.employment, "create", async () => { state.employments += 1; return {}; });
  replace(prisma.evidence, "create", async () => ({}));
  replace(prisma.contactEmail, "updateMany", async (args: Prisma.ContactEmailUpdateManyArgs) => {
    for (const email of state.emails) {
      const filter = args.where?.email as { in?: string[] } | undefined;
      const hashFilter = args.where?.emailHash as { not?: string } | undefined;
      if ((filter?.in?.includes(email.email)) || (hashFilter?.not && email.emailHash !== hashFilter.not)) Object.assign(email, args.data);
    }
    return { count: 1 };
  });
  replace(prisma.contactEmail, "upsert", async (args: Prisma.ContactEmailUpsertArgs) => {
    const found = state.emails.find((email) => email.emailHash === args.where.contactId_emailHash?.emailHash);
    if (found) return Object.assign(found, args.update);
    const created = { id: `email-${state.emails.length}`, ...args.create } as ContactEmail;
    state.emails.push(created);
    return created;
  });
  replace(prisma, "$transaction", async (queries: Promise<unknown>[]) => { state.transactions += 1; return Promise.all(queries); });
  return state;
}

test("re-enrichment preserves a previously verified address and returns the same state as a page reload", async (t) => {
  const state = isolatedDatabase(t);
  const result = await persistContactCandidates("test-company", [candidate], { includePrivate: true });
  assert.equal(result[0].email, "jane@acme.fr");
  assert.equal(result[0].emailSource, "Previous verified source");
  assert.equal(result[0].contactability, "verified");
  assert.equal(state.contact.providerExternalId, "test-company:linkedin-jane");
  assert.equal(state.creates, 0, "same person from a new provider must not duplicate the contact");
  const reloaded = await getPublicContactsForCompany("test-company", { includePrivate: true });
  assert.equal(reloaded[0].email, result[0].email);
  assert.equal(reloaded[0].contactability, result[0].contactability);
});

test("a negatively verified address is invalidated before any stored contact is reused", async (t) => {
  const state = isolatedDatabase(t);
  const result = await persistContactCandidates("test-company", [candidate], { includePrivate: true, rejectedEmails: ["jane@acme.fr"] });
  assert.equal(state.emails[0].status, "unverified");
  assert.equal(state.emails[0].isPrimary, false);
  assert.equal(state.contact.contactability, "missing");
  assert.equal(result[0].email, null);
  assert.equal((await getPublicContactsForCompany("test-company", { includePrivate: true }))[0].email, null);
});

test("new verified email becomes the sole primary in a transaction; non-admin summaries remain redacted", async (t) => {
  const state = isolatedDatabase(t);
  const result = await persistContactCandidates("test-company", [{ ...candidate, email: "jane@acme-group.com", email_status: "verified", email_source: "Hunter", email_evidence: "Technical validation" }]);
  assert.equal(state.transactions, 1);
  assert.equal(state.emails.filter((email) => email.isPrimary).length, 1);
  assert.equal(state.emails.find((email) => email.isPrimary)?.email, "jane@acme-group.com");
  assert.ok(!JSON.stringify(result).includes("jane@"));
  const reloaded = await getPublicContactsForCompany("test-company");
  assert.ok(!JSON.stringify(reloaded).includes("jane@"));
  assert.equal(reloaded[0].contactability, "verified");
});

test("official mailboxes are stored as separate service contacts, not employee records", async (t) => {
  const state = isolatedDatabase(t, false);
  const result = await persistContactCandidates("test-company", [{ ...candidate, name: "Acme France", role: "Boîte de contact de l’entreprise", kind: "company_mailbox", email: "contact@acme.fr", email_status: "verified", email_kind: "functional_generic", email_evidence: "Boîte fonctionnelle officielle", linkedin: null }], { includePrivate: true });
  assert.equal(state.creates, 1);
  assert.equal(state.contact.roleNormalized, "COMPANY_MAILBOX");
  assert.equal(state.employments, 0);
  assert.equal(result[0].kind, "company_mailbox");
  assert.equal(result[0].emailKind, "functional_generic");
});
