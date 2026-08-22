export const SCAN_FUNCTION_BUDGET_MS = 300_000;

export const SCAN_STAGE_TIMEOUT_MS = {
  playerResearch: 55_000,
  // Scout now searches and returns structured JSON in a single call. The old
  // 45-second formatting call was both redundant and the source of retries.
  // Six focused Claude searches run concurrently; this is the per-batch
  // deadline and therefore also the initial wall-clock Scout ceiling.
  scoutSearch: 70_000,
  // A single complementary search is allowed when fewer than 12 unique brands
  // remain. Its shorter ceiling preserves a full minute for persistence.
  scoutRecovery: 45_000,
  // Matchmaker now scores at most 15 brands instead of up to 30.
  matchmaker: 65_000,
} as const;

export const SCAN_STAGE_TIMEOUT_TOTAL_MS = Object.values(
  SCAN_STAGE_TIMEOUT_MS,
).reduce((total, timeout) => total + timeout, 0);

export const SCAN_PERSISTENCE_RESERVE_MS =
  SCAN_FUNCTION_BUDGET_MS - SCAN_STAGE_TIMEOUT_TOTAL_MS;
