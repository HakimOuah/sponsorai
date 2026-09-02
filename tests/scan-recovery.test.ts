import assert from "node:assert/strict";
import test from "node:test";
import {
  getScanRecovery,
  SCAN_RECOVERY_MAX_AGE_MS,
} from "../src/lib/agents/scan-recovery";
import { SCORE_AXES } from "../src/lib/agents/matchmaker";

const now = Date.now();
const brand = {
  name: "Marque",
  country: "France",
  sector: "Sport",
  rationale: "Preuve",
  partnership_type: "ambassadeur",
};
const scan = {
  id: "failed-scan",
  playerId: "dayot",
  status: "failed",
  createdAt: new Date(now - 60_000),
  rawData: [brand],
  scoredData: null,
  playerIntelligence: null,
};

test("failed scans recover their exact saved brands for the same athlete", () => {
  const recovery = getScanRecovery(scan, "dayot", now);
  assert.equal(recovery?.scanId, scan.id);
  assert.deepEqual(recovery?.brands, [brand]);
  assert.equal(recovery?.scoredBrands, undefined);
});

test("running, completed, foreign, stale and malformed scans cannot be resumed", () => {
  assert.equal(getScanRecovery(scan, "another-athlete", now), null);
  assert.equal(getScanRecovery(undefined, "dayot", now), null);
  for (const changed of [
    { status: "running" },
    { status: "completed" },
    { rawData: [] },
    { rawData: [{}] },
    { rawData: [brand, brand] },
    { rawData: [{ ...brand, website: 42 }] },
    { createdAt: new Date(now - SCAN_RECOVERY_MAX_AGE_MS - 1) },
    {
      rawData: Array.from({ length: 31 }, (_, index) => ({
        ...brand,
        name: String(index),
      })),
    },
  ])
    assert.equal(getScanRecovery({ ...scan, ...changed }, "dayot", now), null);
});

test("a persistence failure reuses complete scores without another AI call", () => {
  const scored = {
    ...brand,
    score: 8,
    priority: "A",
    recommended_approach: "Présenter le projet.",
    score_details: Object.fromEntries(SCORE_AXES.map((axis) => [axis, 8])),
  };
  assert.deepEqual(
    getScanRecovery({ ...scan, scoredData: [scored] }, "dayot", now)
      ?.scoredBrands,
    [scored],
  );
  assert.equal(
    getScanRecovery(
      { ...scan, scoredData: [{ ...scored, name: "Autre" }] },
      "dayot",
      now,
    )?.scoredBrands,
    undefined,
  );
  assert.equal(
    getScanRecovery(
      { ...scan, scoredData: [{ ...scored, score_details: {} }] },
      "dayot",
      now,
    )?.scoredBrands,
    undefined,
  );
});
