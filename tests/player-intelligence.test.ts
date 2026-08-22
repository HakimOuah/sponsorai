import assert from "node:assert/strict";
import test from "node:test";
import {
  isPlayerIntelligence,
  PLAYER_INTELLIGENCE_FRESHNESS_MS,
} from "../src/lib/agents/player-intelligence";

test("a valid stored intelligence snapshot can be reused for one day", () => {
  assert.equal(PLAYER_INTELLIGENCE_FRESHNESS_MS, 86_400_000);
  assert.equal(
    isPlayerIntelligence({
      recent_stats: "Forme stable",
      social_content_style: "Sport et lifestyle",
      brand_affinities: [],
      existing_partnerships: [],
      brand_conflicts: [],
      public_image: "Positive",
      audience_demographics: "France",
      recent_news: "Non trouvé",
      momentum_score: 6,
      key_values: [],
      commercial_angles: [],
    }),
    true,
  );
});

test("an incomplete snapshot is never reused", () => {
  assert.equal(isPlayerIntelligence({ recent_stats: "incomplet" }), false);
});
