import assert from "node:assert/strict";
import test from "node:test";
import {
  buildEvaluatedBrandsQuery,
  deduplicateBrandCandidates,
  filterAlreadyEvaluatedBrands,
  getExcludedBrandNames,
} from "../src/lib/agents/scout-deduplication";

test("the Scout exclusion query is scoped to the selected athlete", () => {
  assert.deepEqual(buildEvaluatedBrandsQuery("player-123"), {
    where: { playerId: "player-123" },
    select: {
      company: {
        select: { name: true },
      },
    },
  });
});

test("evaluated brand names are deduplicated without losing their display name", () => {
  assert.deepEqual(
    getExcludedBrandNames([
      { company: { name: "Maison M" } },
      { company: { name: " maison   m " } },
      { company: { name: "Atlas Mobility" } },
    ]),
    ["Maison M", "Atlas Mobility"]
  );
});

test("Scout filters only brands already evaluated for the selected athlete", () => {
  const candidates = [
    { name: "Maison M" },
    { name: "Atlas Mobility" },
    { name: "North Studio" },
  ];

  assert.deepEqual(
    filterAlreadyEvaluatedBrands(candidates, [" maison   m "]),
    [{ name: "Atlas Mobility" }, { name: "North Studio" }]
  );
});

test("parallel Scout waves are deduplicated before scoring", () => {
  assert.deepEqual(
    deduplicateBrandCandidates([
      { name: "Maison M" },
      { name: " maison   m " },
      { name: "Atlas Mobility" },
      { name: "Basic-Fit" },
      { name: "Basic Fit" },
      { name: "Royal Air Maroc" },
      { name: "Royal Air Maroc Cargo Business Class" },
    ]),
    [
      { name: "Maison M" },
      { name: "Atlas Mobility" },
      { name: "Basic-Fit" },
      { name: "Royal Air Maroc" },
    ],
  );
});
