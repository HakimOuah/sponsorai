import assert from "node:assert/strict";
import test from "node:test";
import { applyMatchmakerLearning } from "../src/lib/agents/matchmaker-learning";
import type { ScoredBrand } from "../src/types";

const brand: ScoredBrand = {
  name: "Maison M",
  sector: "sportswear",
  country: "France",
  rationale: "Test",
  partnership_type: "ambassador",
  score: 7.8,
  priority: "B",
  recommended_approach: "Test",
  score_details: {
    image_coherence: 8,
    audience_fit: 8,
    sponsoring_history: 7,
    conversion_potential: 7,
    accessibility: 7,
    timing: 7,
    exclusivity_risk: 8,
    brand_momentum: 8,
  },
};

test("historical feedback and active signals adjust but bound Matchmaker scores", () => {
  const [adjusted] = applyMatchmakerLearning([brand], [
    {
      name: "maison m",
      brandRatings: ["excellent", "excellent"],
      opportunityStrengths: [0.9],
    },
  ]);

  assert.ok(adjusted.score > brand.score);
  assert.equal(adjusted.priority, "A");
  assert.equal(adjusted.base_score, brand.score);
  assert.equal(adjusted.score_version, "matchmaker-v2-learning-v1");
  assert.ok(adjusted.score <= 10);
});
