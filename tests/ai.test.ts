import assert from "node:assert/strict";
import test from "node:test";
import { extractGrokText, GROK_MODEL } from "../src/lib/ai";

test("Grok 4.6 is the default model", () => {
  assert.equal(GROK_MODEL, process.env.GROK_MODEL || "grok-4.6");
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
