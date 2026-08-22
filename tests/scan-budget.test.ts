import assert from "node:assert/strict";
import test from "node:test";
import {
  SCAN_FUNCTION_BUDGET_MS,
  SCAN_PERSISTENCE_RESERVE_MS,
  SCAN_STAGE_TIMEOUT_TOTAL_MS,
} from "../src/lib/agents/scan-budget";

test("scan AI stages leave enough time for database persistence", () => {
  assert.ok(
    SCAN_STAGE_TIMEOUT_TOTAL_MS < SCAN_FUNCTION_BUDGET_MS,
    "AI stage timeouts must stay below the serverless function budget",
  );
  assert.ok(
    SCAN_PERSISTENCE_RESERVE_MS >= 60_000,
    "the scan must reserve at least one minute for scoring persistence and SSE cleanup",
  );
});
