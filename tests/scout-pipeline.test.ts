import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { SCOUT_SEARCH_PROMPT } from "../src/lib/agents/prompts";

test("Scout asks the web-search call for directly structured JSON", () => {
  assert.match(SCOUT_SEARCH_PROMPT, /Retourne DIRECTEMENT un tableau JSON STRICT/);
  assert.match(SCOUT_SEARCH_PROMPT, /"opportunity_signal"/);
  assert.match(SCOUT_SEARCH_PROMPT, /"confidence_score"/);
});

test("runScout performs only one AI call", () => {
  const scoutPath = fileURLToPath(
    new URL("../src/lib/agents/scout.ts", import.meta.url),
  );
  const source = readFileSync(scoutPath, "utf8");
  const runScoutSource = source.slice(source.indexOf("export async function runScout"));
  const aiCalls = runScoutSource.match(/generateAIText\(\{/g) ?? [];

  assert.equal(
    aiCalls.length,
    1,
    "Scout must search and structure brands in a single model call",
  );
});
