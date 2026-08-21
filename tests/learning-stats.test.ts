import assert from "node:assert/strict";
import test from "node:test";
import {
  aggregateRolePerformance,
  bayesianRate,
  calculateContextualContactScore,
} from "../src/lib/learning/stats";

test("Bayesian smoothing prevents five perfect attempts from beating a strong large sample", () => {
  const tinySample = bayesianRate(5, 5, 0.12, 20);
  const largeSample = bayesianRate(400, 500, 0.12, 20);
  assert.ok(tinySample < largeSample);
});

test("role aggregation optimizes meetings, deals and signed value", () => {
  const base = {
    roleNormalized: "SPORTS_PARTNERSHIPS",
    sector: "sportswear",
    companySizeBucket: ">5000",
    sport: "football",
    country: "France",
    outcomeValue: null,
  };
  const aggregates = aggregateRolePerformance([
    { ...base, type: "EMAIL_SENT" },
    { ...base, type: "REPLIED" },
    { ...base, type: "POSITIVE_REPLY" },
    { ...base, type: "MEETING_BOOKED" },
    { ...base, type: "SIGNED", outcomeValue: 25000 },
  ]);

  assert.equal(aggregates[0].attempts, 1);
  assert.equal(aggregates[0].meetings, 1);
  assert.equal(aggregates[0].signedDeals, 1);
  assert.equal(aggregates[0].signedValue, 25000);
  assert.ok(aggregates[0].contextualUtility > 0);
});

test("contextual utility cannot push a contact score outside 0-100", () => {
  assert.equal(calculateContextualContactScore(100, 1), 100);
  assert.equal(calculateContextualContactScore(0, 0), 0);
});
