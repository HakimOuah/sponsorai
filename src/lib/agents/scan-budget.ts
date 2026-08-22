export const SCAN_FUNCTION_BUDGET_MS = 300_000;

export const SCAN_STAGE_TIMEOUT_MS = {
  playerResearch: 55_000,
  // Scout now searches and returns structured JSON in a single call. The old
  // 45-second formatting call was both redundant and the source of retries.
  scoutSearch: 105_000,
  matchmaker: 80_000,
} as const;

export const SCAN_STAGE_TIMEOUT_TOTAL_MS = Object.values(
  SCAN_STAGE_TIMEOUT_MS,
).reduce((total, timeout) => total + timeout, 0);

export const SCAN_PERSISTENCE_RESERVE_MS =
  SCAN_FUNCTION_BUDGET_MS - SCAN_STAGE_TIMEOUT_TOTAL_MS;
