import assert from "node:assert/strict";
import test from "node:test";
import {
  canDraftForContact,
  calculateStaticContactScore,
  hasActionableContact,
  normalizeContactRole,
} from "../src/lib/agents/contact-quality";

test("a current verified decision maker can be selected for drafting without an email", () => {
  assert.equal(
    canDraftForContact({
      active: true,
      employmentStatus: "verified_current",
    }),
    true,
  );
});

test("drafting still rejects inactive or unverified employment", () => {
  assert.equal(
    canDraftForContact({
      active: false,
      employmentStatus: "verified_current",
    }),
    false,
  );
  assert.equal(
    canDraftForContact({
      active: true,
      employmentStatus: "unverified",
    }),
    false,
  );
  assert.equal(
    canDraftForContact({ employmentStatus: "verified_current" }),
    false,
  );
});

test("contact roles are normalized into reusable learning dimensions", () => {
  assert.equal(normalizeContactRole("Head of Sports Partnerships"), "SPORTS_PARTNERSHIPS");
  assert.equal(normalizeContactRole("Director, Creator Marketing"), "CREATOR_PARTNERSHIPS");
  assert.equal(normalizeContactRole("Finance Director"), "OTHER");
});

test("outreach becomes actionable only with a current usable contact", () => {
  assert.equal(
    hasActionableContact([
      { employmentStatus: "verified_current", contactability: "guessed" },
      { employmentStatus: "unverified", contactability: "verified" },
    ]),
    false,
  );
  assert.equal(
    hasActionableContact([
      {
        employmentStatus: "verified_current",
        contactability: "public_source",
      },
    ]),
    true,
  );
});

test("verified and relevant contacts score above guessed contacts", () => {
  const verified = calculateStaticContactScore({
    role: "Head of Sports Partnerships",
    contactability: "verified",
    employmentConfidence: 0.95,
  });
  const guessed = calculateStaticContactScore({
    role: "Marketing Manager",
    contactability: "guessed",
    employmentConfidence: 0.6,
  });

  assert.ok(verified > guessed);
  assert.ok(verified <= 100);
});
