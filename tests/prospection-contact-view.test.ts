import test from "node:test";
import assert from "node:assert/strict";
import {
  getProspectionContactView,
  getProspectionScoreDetails,
  redactProspectionContext,
} from "../src/lib/contacts/prospection-view";

const now = new Date("2026-09-02T12:00:00Z");
const contact = {
  id: "private-contact-id",
  fullName: "Alice Martin",
  roleRaw: "Head of Sports Partnerships",
  roleNormalized: "SPORTS_PARTNERSHIPS",
  active: true,
  employmentStatus: "verified_current",
  contactability: "missing",
  relevanceScore: 3,
  contactScore: 91,
  updatedAt: now,
  sourceUrl: "https://www.linkedin.com/in/alice-martin",
  privateToken: "must-not-serialize",
  contactEmails: [
    {
      id: "email-id",
      email: "alice@brand.example",
      status: "verified",
      source: "hunter",
      evidence: "Private verification record",
      verifiedAt: now,
      isPrimary: true,
    },
  ],
};

test("prospection exposes a readiness summary and explicit contact ID without private details", () => {
  const view = getProspectionContactView([contact], { now });
  assert.equal(view.readiness.status, "ready_person");
  assert.equal(view.readiness.bestContactId, contact.id);
  assert.equal(view.contacts[0].contactability, "verified");
  assert.deepEqual(
    Object.keys(view.contacts[0]).sort(),
    [
      "id",
      "roleRaw",
      "roleNormalized",
      "employmentStatus",
      "contactability",
      "relevanceScore",
      "contactScore",
      "readinessStatus",
    ].sort(),
  );
  assert.doesNotMatch(
    JSON.stringify(view),
    /alice|martin|brand\.example|linkedin|Private verification|must-not-serialize|email-id/i,
  );
});

test("generic readiness remains distinct without attributing the inbox to a person", () => {
  const generic = {
    ...contact,
    id: "generic-id",
    contactEmails: [
      {
        ...contact.contactEmails[0],
        email: "contact@brand.example",
        source: "https://brand.example/contact",
      },
    ],
  };
  const view = getProspectionContactView([generic], { now });
  assert.equal(view.readiness.status, "ready_generic");
  assert.equal(view.readiness.recipientKind, "functional_generic");
  assert.equal(view.contacts[0].readinessStatus, "ready_generic");
  assert.doesNotMatch(
    JSON.stringify(view),
    /alice|martin|contact@brand|https:/i,
  );
});

test("bounced and merely public emails cannot become ready client DTOs", () => {
  const bounced = getProspectionContactView(
    [{ ...contact, lastBouncedAt: now }],
    { now },
  );
  assert.equal(bounced.readiness.status, "incomplete");
  assert.equal(bounced.readiness.bestContactId, null);
  const publicEmail = getProspectionContactView(
    [
      {
        ...contact,
        contactEmails: [
          { ...contact.contactEmails[0], status: "public_source" },
        ],
      },
    ],
    { now },
  );
  assert.equal(publicEmail.readiness.status, "incomplete");
});

test("free-text context cannot reveal known names, email addresses or LinkedIn profiles", () => {
  const value = redactProspectionContext(
    "Alice Martin : alice@brand.example, https://www.linkedin.com/in/alice-martin (sports marketing).",
    [contact.fullName],
  );
  assert.doesNotMatch(value || "", /alice|martin|brand\.example|linkedin/i);
  assert.match(value || "", /sports marketing/);
  assert.equal(redactProspectionContext(null, []), null);
});

test("scores sent to the browser allow only known numeric criteria, never arbitrary model metadata", () => {
  assert.deepEqual(
    getProspectionScoreDetails({
      timing: 8,
      image_coherence: 50,
      audience_fit: -1,
      contactName: contact.fullName,
      email: contact.contactEmails[0].email,
      accessibility: "alice@brand.example",
      sponsoring_history: Number.NaN,
    }),
    { image_coherence: 10, audience_fit: 0, timing: 8 },
  );
  assert.equal(getProspectionScoreDetails({ note: "private metadata" }), null);
});
