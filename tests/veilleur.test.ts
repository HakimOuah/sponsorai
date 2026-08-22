import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

test("Veilleur classifies replies with Claude Sonnet 5 instead of Grok", () => {
  const veilleurPath = fileURLToPath(
    new URL("../src/lib/agents/veilleur.ts", import.meta.url),
  );
  const source = readFileSync(veilleurPath, "utf8");

  assert.match(source, /generateClaudeText\(\{/);
  assert.doesNotMatch(source, /generateAIText\(\{/);
  assert.match(source, /thinking:\s*"disabled"/);
  assert.match(source, /timeoutMs:\s*45_000/);
});
