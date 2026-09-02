import assert from "node:assert/strict";
import test from "node:test";
import {
  CONTACT_READINESS_FRESHNESS_DAYS,
  getContactReadiness,
  type ContactForReadiness,
  type ContactReadinessEmail,
} from "../src/lib/contacts/readiness";

const now = new Date("2026-09-02T10:00:00.000Z");
const recent = "2026-09-01T10:00:00.000Z";
const expired = "2026-08-02T09:59:59.999Z";

function email(overrides: Partial<ContactReadinessEmail> = {}): ContactReadinessEmail {
  return { id: "email-1", email: "jane.rivers@acme.fr", status: "verified", source: "Hunter via Monid", evidence: "SMTP positif, domaine non catch-all", isPrimary: true, verifiedAt: recent, updatedAt: recent, ...overrides };
}

function contact(overrides: Partial<ContactForReadiness> = {}): ContactForReadiness {
  return { id: "contact-1", fullName: "Jane Rivers", roleRaw: "Head of Partnerships", roleNormalized: "BRAND_PARTNERSHIPS", active: true, employmentStatus: "verified_current", contactScore: 88, relevanceScore: 100, updatedAt: recent, sourceUrl: "https://www.linkedin.com/in/jane-rivers", contactEmails: [email()], ...overrides };
}

function mailbox(overrides: Partial<ContactForReadiness> = {}): ContactForReadiness {
  return contact({ id: "mailbox", fullName: "Acme France", roleRaw: "Boîte de contact de l’entreprise", roleNormalized: "COMPANY_MAILBOX", contactScore: 100, sourceUrl: "https://acme.fr/contact", contactEmails: [email({ email: "partnerships@acme.fr", source: "https://acme.fr/contact", evidence: "Boîte fonctionnelle officielle vérifiée" })], ...overrides });
}

test("recent named marketing decision maker is ready with only a safe allowlisted summary", () => {
  const summary = getContactReadiness([contact()], { now });
  assert.deepEqual(summary, { status: "ready_person", bestContactId: "contact-1", recipientKind: "personal_professional", readyPersonCount: 1, readyGenericCount: 0, incompleteCount: 0, reason: null, checkedAt: recent });
  const json = JSON.stringify(summary);
  for (const secret of ["Jane", "Rivers", "jane.rivers", "@acme", "linkedin", "Hunter", "SMTP", "email-1"]) assert.ok(!json.includes(secret));
  assert.deepEqual(JSON.parse(json), summary);
});

test("empty contacts never turn company-level legacy readiness into a verified recipient", () => {
  assert.deepEqual(getContactReadiness([], { now }), { status: "incomplete", bestContactId: null, recipientKind: null, readyPersonCount: 0, readyGenericCount: 0, incompleteCount: 0, reason: "no_contacts", checkedAt: null });
});

test("an official technically verified service mailbox stays distinct from a person", () => {
  const summary = getContactReadiness([mailbox()], { now });
  assert.equal(summary.status, "ready_generic");
  assert.equal(summary.recipientKind, "functional_generic");
  assert.equal(summary.readyPersonCount, 0);
  assert.equal(summary.readyGenericCount, 1);
});

test("a named contact always outranks a generic mailbox even with a lower learned score", () => {
  for (const contacts of [[mailbox(), contact({ contactScore: 10 })], [contact({ contactScore: 10 }), mailbox()]]) {
    const summary = getContactReadiness(contacts, { now });
    assert.equal(summary.bestContactId, "contact-1");
    assert.equal(summary.status, "ready_person");
    assert.equal(summary.readyGenericCount, 1);
  }
});

test("public-source emails do not get the technical verified badge, including generic addresses", () => {
  for (const person of [contact(), mailbox()]) {
    person.contactEmails = [email({ ...person.contactEmails[0], status: "public_source", verifiedAt: null })];
    const summary = getContactReadiness([person], { now });
    assert.equal(summary.status, "incomplete");
    assert.equal(summary.reason, "email_unverified");
  }
});

test("guessed, rejected, bounced, unknown and catch-all provider results cannot be ready", () => {
  for (const status of ["guessed", "missing", "unverified", "rejected", "bounced", "unknown", "catch_all", "accept_all", "invalid"]) {
    assert.equal(getContactReadiness([contact({ contactEmails: [email({ status })] })], { now }).status, "incomplete", status);
  }
});

test("inactive, past, wrong-company or unverified employments are excluded", () => {
  const cases: Array<Partial<ContactForReadiness>> = [{ active: false }, { employmentStatus: "past_or_wrong_company" }, { employmentStatus: "past" }, { employmentStatus: "unverified" }];
  for (const overrides of cases) assert.equal(getContactReadiness([contact(overrides)], { now }).status, "incomplete");
});

test("irrelevant employees cannot become qualified contacts just because they have email", () => {
  for (const roleRaw of ["Software Engineer", "Head of HR", "Chief Financial Officer", "Sales Associate"]) {
    const summary = getContactReadiness([contact({ roleRaw, relevanceScore: 100, contactScore: 100 })], { now });
    assert.equal(summary.status, "incomplete", roleRaw);
    assert.equal(summary.reason, "irrelevant_contact");
  }
});

test("a role label, masked identity or missing surname does not represent a named decision maker", () => {
  for (const fullName of ["", "Jane", "Jane D.", "Head of Partnerships", "Responsable partenariats", "LinkedIn Member", "Jane Ri***", "Non renseigné"]) {
    assert.equal(getContactReadiness([contact({ fullName })], { now }).reason, "identity_missing", fullName);
  }
});

test("stale contact observations and stale technical verifications are evaluated independently", () => {
  assert.equal(getContactReadiness([contact({ updatedAt: expired })], { now }).reason, "contact_stale");
  assert.equal(getContactReadiness([contact({ contactEmails: [email({ verifiedAt: expired, updatedAt: recent })] })], { now }).reason, "email_stale");
  assert.equal(CONTACT_READINESS_FRESHNESS_DAYS, 30);
});

test("the 30-day freshness boundary is inclusive without trusting future or malformed dates", () => {
  const boundary = new Date(now.getTime() - 30 * 86_400_000);
  assert.equal(getContactReadiness([contact({ updatedAt: boundary, contactEmails: [email({ verifiedAt: boundary })] })], { now }).status, "ready_person");
  for (const date of [null, "invalid", new Date(now.getTime() + 1)]) {
    assert.equal(getContactReadiness([contact({ contactEmails: [email({ verifiedAt: date })] })], { now }).reason, "email_stale");
    assert.equal(getContactReadiness([contact({ updatedAt: date })], { now }).reason, "contact_stale");
  }
});

test("recent database edits do not substitute for an absent technical verification timestamp", () => {
  assert.equal(getContactReadiness([contact({ contactEmails: [email({ verifiedAt: null, updatedAt: recent })] })], { now }).reason, "email_stale");
});

test("a bounce after verification excludes the contact even while its email still says verified", () => {
  for (const lastBouncedAt of [recent, now, "invalid"]) {
    assert.equal(getContactReadiness([contact({ lastBouncedAt })], { now }).reason, "email_bounced");
    assert.equal(getContactReadiness([mailbox({ lastBouncedAt })], { now }).reason, "email_bounced");
  }
  assert.equal(getContactReadiness([contact({ lastBouncedAt: "2026-08-31T10:00:00.000Z" })], { now }).status, "ready_person");
});

test("readiness follows the actual primary recipient rather than hiding it behind a secondary", () => {
  for (const primary of [email({ verifiedAt: expired }), email({ status: "public_source", verifiedAt: null })]) {
    const secondary = email({ id: "email-2", email: "jane@acme.fr", isPrimary: false });
    assert.equal(getContactReadiness([contact({ contactEmails: [secondary, primary] })], { now }).status, "incomplete");
  }
});

test("invalidated primaries are excluded like the writer, allowing an independently verified alternative", () => {
  const person = contact({ contactEmails: [email({ status: "unverified" }), email({ id: "email-2", email: "jane@acme.fr", isPrimary: false })] });
  assert.equal(getContactReadiness([person], { now }).status, "ready_person");
});

test("equal primary flags preserve PostgreSQL null-first verification ordering", () => {
  const person = contact({ contactEmails: [email({ isPrimary: false }), email({ id: "public", status: "public_source", verifiedAt: null, isPrimary: false })] });
  assert.equal(getContactReadiness([person], { now }).reason, "email_unverified");
});

test("legacy generic addresses attached to a person are never advertised as their personal email", () => {
  const person = contact({ contactEmails: [email({ email: "contact@acme.fr", source: "https://acme.fr/contact" })] });
  assert.equal(getContactReadiness([person], { now }).status, "ready_generic");
});

test("generic attribution needs an actual recorded source and rejects credential-bearing URLs", () => {
  for (const source of [null, "Guessed", "javascript:alert(1)", "https://secret:secret@acme.fr/contact", "https://linkedin.com/in/jane-rivers"]) {
    const person = mailbox({ sourceUrl: null, contactEmails: [email({ email: "contact@acme.fr", source })] });
    assert.equal(getContactReadiness([person], { now }).reason, "generic_unattributed");
  }
});

test("an unrelated third-party source cannot qualify a legacy generic address", () => {
  const person = contact({ contactEmails: [email({ email: "contact@acme.fr", source: "https://unrelated-news.fr/contact" })] });
  assert.equal(getContactReadiness([person], { now }).reason, "generic_unattributed");
});

test("free mailboxes, malformed addresses and unrelated service mailboxes are not qualified", () => {
  for (const address of ["jane@gmail.com", "jane@outlook.com", "jane@", "jane rivers@acme.fr", "no-reply@acme.fr", "careers@acme.fr", "support@acme.fr"]) {
    assert.equal(getContactReadiness([contact({ contactEmails: [email({ email: address })] })], { now }).status, "incomplete", address);
  }
});

test("best contact choice is deterministic and does not mutate its inputs", () => {
  const a = contact({ id: "a" });
  const b = contact({ id: "b" });
  const inactive = contact({ id: "inactive", active: false });
  const input = [b, inactive, a];
  const before = JSON.stringify(input);
  for (const contacts of [input, [...input].reverse()]) {
    const result = getContactReadiness(contacts, { now });
    assert.equal(result.bestContactId, "a");
    assert.equal(result.readyPersonCount, 2);
    assert.equal(result.incompleteCount, 1);
  }
  assert.equal(JSON.stringify(input), before);
});

test("custom freshness windows are explicit and invalid options fail closed", () => {
  const earlier = "2026-08-25T10:00:00.000Z";
  assert.equal(getContactReadiness([contact({ updatedAt: earlier })], { now, freshnessDays: 7 }).reason, "contact_stale");
  for (const freshnessDays of [0, -1, Infinity, NaN]) assert.throws(() => getContactReadiness([], { now, freshnessDays }), RangeError);
  assert.throws(() => getContactReadiness([], { now: new Date("invalid") }), RangeError);
});
