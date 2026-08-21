import assert from "node:assert/strict";
import test from "node:test";
import {
  buildVeilleRequest,
  VEILLE_WEB_SEARCH_MAX_USES,
} from "../src/lib/agents/veille-request";

test("Veille enables Anthropic web search in every request", () => {
  const request = buildVeilleRequest("Actualités sponsoring à analyser");

  assert.deepEqual(request.tools, [
    {
      type: "web_search_20250305",
      name: "web_search",
      max_uses: VEILLE_WEB_SEARCH_MAX_USES,
    },
  ]);
  assert.equal(request.messages[0].content, "Actualités sponsoring à analyser");
});
