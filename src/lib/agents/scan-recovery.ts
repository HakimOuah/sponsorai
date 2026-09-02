import type { PlayerIntelligence, ScoredBrand, ScoutBrand } from "@/types";
import { isPlayerIntelligence } from "./player-intelligence";
import { MATCHMAKER_MAX_BRANDS, SCORE_AXES } from "./matchmaker";

export const SCAN_RECOVERY_MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface SavedScan {
  id: string;
  playerId: string;
  status: string;
  createdAt: Date;
  rawData: unknown;
  scoredData: unknown;
  playerIntelligence: unknown;
}

interface ScanRecovery {
  scanId: string;
  brands: ScoutBrand[];
  scoredBrands?: ScoredBrand[];
  playerIntelligence?: PlayerIntelligence;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isScoutBrand(value: unknown): value is ScoutBrand {
  return (
    isRecord(value) &&
    ["name", "sector", "country", "rationale", "partnership_type"].every(
      (key) => typeof value[key] === "string",
    ) &&
    Boolean((value.name as string).trim()) &&
    [
      "website",
      "commercial_angle",
      "opportunity_signal",
      "existing_sports_sponsoring",
      "estimated_budget",
    ].every((key) => value[key] === undefined || typeof value[key] === "string")
  );
}

function cachedScores(
  data: unknown,
  brands: ScoutBrand[],
): ScoredBrand[] | undefined {
  if (!Array.isArray(data) || data.length !== brands.length) return undefined;
  const seen = new Set<string>();
  const scores: ScoredBrand[] = [];
  for (const row of data) {
    if (
      !isRecord(row) ||
      typeof row.name !== "string" ||
      seen.has(row.name) ||
      typeof row.score !== "number" ||
      !Number.isFinite(row.score) ||
      row.score < 1 ||
      row.score > 10 ||
      !["A", "B", "C"].includes(String(row.priority)) ||
      typeof row.rationale !== "string" ||
      typeof row.recommended_approach !== "string" ||
      !isRecord(row.score_details)
    )
      return undefined;
    const details = row.score_details;
    if (
      SCORE_AXES.some(
        (axis) =>
          !Number.isInteger(details[axis]) ||
          Number(details[axis]) < 1 ||
          Number(details[axis]) > 10,
      )
    )
      return undefined;
    const brand = brands.find((candidate) => candidate.name === row.name);
    if (!brand) return undefined;
    seen.add(row.name);
    scores.push({
      ...row,
      ...brand,
      rationale: row.rationale,
    } as unknown as ScoredBrand);
  }
  return scores;
}

export function getScanRecovery(
  scan: SavedScan | null | undefined,
  playerId: string,
  now = Date.now(),
): ScanRecovery | null {
  if (
    !scan ||
    scan.status !== "failed" ||
    scan.playerId !== playerId ||
    !Number.isFinite(scan.createdAt.getTime()) ||
    now - scan.createdAt.getTime() > SCAN_RECOVERY_MAX_AGE_MS ||
    !Array.isArray(scan.rawData) ||
    scan.rawData.length === 0 ||
    scan.rawData.length > MATCHMAKER_MAX_BRANDS ||
    !scan.rawData.every(isScoutBrand)
  )
    return null;
  const brands = scan.rawData;
  if (new Set(brands.map((brand) => brand.name)).size !== brands.length)
    return null;
  return {
    scanId: scan.id,
    brands,
    scoredBrands: cachedScores(scan.scoredData, brands),
    playerIntelligence: isPlayerIntelligence(scan.playerIntelligence)
      ? scan.playerIntelligence
      : undefined,
  };
}
