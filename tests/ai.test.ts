import assert from "node:assert/strict";
import test from "node:test";
import {
  CLAUDE_SCOUT_MODEL,
  CLAUDE_SCOUT_THINKING,
  extractClaudeText,
  extractGrokText,
  GROK_MODEL,
} from "../src/lib/ai";

test("Grok 4.6 is the default model", () => {
  assert.equal(GROK_MODEL, process.env.GROK_MODEL || "grok-4.6");
});

test("Claude Sonnet 5 is the default Scout model", () => {
  assert.equal(
    CLAUDE_SCOUT_MODEL,
    process.env.CLAUDE_SCOUT_MODEL || "claude-sonnet-5",
  );
});

test("Claude Scout disables adaptive thinking to keep web scans responsive", () => {
  assert.equal(CLAUDE_SCOUT_THINKING, "disabled");
});

test("extractGrokText reads the Responses API output_text shortcut", () => {
  assert.equal(extractGrokText({ output_text: "  résultat  " }), "résultat");
});

test("extractGrokText reads message content blocks", () => {
  assert.equal(
    extractGrokText({
      output: [
        { type: "web_search_call" },
        {
          type: "message",
          content: [
            { type: "output_text", text: "première partie" },
            { type: "output_text", text: "deuxième partie" },
          ],
        },
      ],
    }),
    "première partie\ndeuxième partie"
  );
});

test("extractClaudeText ignores web-search blocks and keeps cited text", () => {
  assert.equal(
    extractClaudeText({
      stop_reason: "end_turn",
      content: [
        { type: "server_tool_use" },
        { type: "web_search_tool_result" },
        { type: "text", text: "  [{\"name\":\"Maison M\"}]  ", citations: [] },
      ],
    }),
    '[{"name":"Maison M"}]',
  );
});

test("extractClaudeText combines paused turns", () => {
  assert.equal(
    extractClaudeText([
      { stop_reason: "pause_turn", content: [{ type: "text", text: "[" }] },
      { stop_reason: "end_turn", content: [{ type: "text", text: "]" }] },
    ]),
    "[\n]",
  );
});
