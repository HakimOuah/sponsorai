import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { SCOUT_DISCOVERY_PROMPT } from "../src/lib/agents/prompts";
import {
  SCOUT_BATCHES,
  buildScoutIntelligenceBrief,
} from "../src/lib/agents/scout";

test("Scout asks the web-search call for directly structured JSON", () => {
  assert.match(SCOUT_DISCOVERY_PROMPT, /exactement UNE requête/);
  assert.match(SCOUT_DISCOVERY_PROMPT, /\{targetCount\} entreprises/);
  assert.match(SCOUT_DISCOVERY_PROMPT, /"opportunity_signal"/);
});

test("Scout sends Claude a compact commercial brief", () => {
  const brief = buildScoutIntelligenceBrief({
    recent_stats: "stats",
    social_content_style: "style",
    brand_affinities: ["mode"],
    existing_partnerships: ["Sponsor"],
    brand_conflicts: ["Concurrent"],
    public_image: "image",
    audience_demographics: "audience",
    recent_news: "actualité",
    momentum_score: 8,
    key_values: ["travail"],
    commercial_angles: [{
      name: "Mode",
      why: "why",
      ideal_brand_profile: "D2C",
      target_regions: ["France"],
      offer_types: ["ambassadeur"],
      proof_points: ["preuve"],
    }],
  });

  assert.match(brief, /"commercial_angles"/);
  assert.doesNotMatch(brief, /"recent_stats"/);
  assert.doesNotMatch(brief, /"proof_points"/);
});

test("Scout runs six focused waves and keeps at most fifteen candidates", () => {
  assert.equal(SCOUT_BATCHES.length, 6);
  assert.ok(SCOUT_BATCHES.every((batch) => batch.targetCount === "2 à 3"));
});

test("runScout uses one Claude call per parallel wave and no Grok formatting call", () => {
  const scoutPath = fileURLToPath(
    new URL("../src/lib/agents/scout.ts", import.meta.url),
  );
  const source = readFileSync(scoutPath, "utf8");
  const runScoutSource = source.slice(source.indexOf("export async function runScout"));
  const claudeCalls = runScoutSource.match(/generateClaudeText\(\{/g) ?? [];
  const grokCalls = runScoutSource.match(/generateAIText\(\{/g) ?? [];

  assert.equal(
    claudeCalls.length,
    1,
    "each parallel Scout wave must search and structure in one Claude call",
  );
  assert.equal(grokCalls.length, 0, "Scout must not use Grok for brand search");
  assert.match(runScoutSource, /Promise\.allSettled/);
  assert.match(runScoutSource, /maxWebSearchUses:\s*1/);
  assert.match(runScoutSource, /brands\.length < 12/);
  assert.match(runScoutSource, /Rattrapage multi-secteurs/);
});
