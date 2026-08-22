import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateStaticContactScore,
  hasActionableContact,
  normalizeContactRole,
} from "../src/lib/agents/contact-quality";

test("contact roles are normalized into reusable learning dimensions", () => {
  assert.equal(normalizeContactRole("Head of Sports Partnerships"), "SPORTS_PARTNERSHIPS");
  assert.equal(normalizeContactRole("Director, Creator Marketing"), "CREATOR_PARTNERSHIPS");
  assert.equal(normalizeContactRole("Finance Director"), "OTHER");
});

test("writing starts only after Enrichisseur found a current usable contact", () => {
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
