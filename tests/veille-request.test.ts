import assert from "node:assert/strict";
import test from "node:test";
import { buildVeilleRequest } from "../src/lib/agents/veille-request";

test("Veille enables Grok web search in every request", () => {
  const request = buildVeilleRequest("Actualités sponsoring à analyser");

  assert.equal(request.webSearch, true);
  assert.equal(request.prompt, "Actualités sponsoring à analyser");
  assert.equal(request.maxOutputTokens, 8192);
});
