import { generateClaudeText } from "@/lib/ai";
import { MATCHMAKER_PROMPT, buildPlayerProfile } from "./prompts";
import type {
  ScoutBrand,
  ScoredBrand,
  PlayerIntelligence,
  ScoreDetails,
} from "@/types";
import type { Player } from "@prisma/client";
import { SCAN_STAGE_TIMEOUT_MS } from "./scan-budget";
import type { LogCallback } from "./scout";

export const MATCHMAKER_BATCH_SIZE = 5;
export const MATCHMAKER_CONCURRENCY = 3;
export const MATCHMAKER_MAX_BRANDS = 30;
export const SCORE_AXES = [
  "image_coherence",
  "audience_fit",
  "sponsoring_history",
  "conversion_potential",
  "accessibility",
  "timing",
  "exclusivity_risk",
  "brand_momentum",
] as const;

const SCORE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["scores"],
  properties: {
    scores: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "brand_index",
          "rationale",
          "score_details",
          "recommended_approach",
        ],
        properties: {
          brand_index: {
            type: "integer",
            description: "Index exact fourni dans le lot.",
          },
          rationale: {
            type: "string",
            description: "Deux phrases courtes maximum.",
          },
          recommended_approach: {
            type: "string",
            description: "Deux phrases courtes maximum.",
          },
          score_details: {
            type: "object",
            additionalProperties: false,
            required: [...SCORE_AXES],
            properties: Object.fromEntries(
              SCORE_AXES.map((axis) => [
                axis,
                {
                  type: "integer",
                  description: "Note entière de 1 à 10.",
                },
              ]),
            ),
          },
        },
      },
    },
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseMatchmakerBatch(
  text: string,
  brands: ScoutBrand[],
): ScoredBrand[] {
  // Never salvage truncated JSON: a successful batch must cover every input once.
  const data: unknown = JSON.parse(text);
  if (
    !isRecord(data) ||
    !Array.isArray(data.scores) ||
    data.scores.length !== brands.length
  ) {
    throw new Error(
      "Matchmaker a retourné un lot incomplet. Les marques restent conservées.",
    );
  }
  const seen = new Set<number>();
  return data.scores.map((row: unknown) => {
    if (!isRecord(row) || !Number.isInteger(row.brand_index)) {
      throw new Error("Matchmaker a retourné un index de marque invalide.");
    }
    const index = row.brand_index as number;
    const details = row.score_details;
    if (
      index < 0 ||
      index >= brands.length ||
      seen.has(index) ||
      !isRecord(details) ||
      SCORE_AXES.some(
        (axis) =>
          !Number.isInteger(details[axis]) ||
          Number(details[axis]) < 1 ||
          Number(details[axis]) > 10,
      ) ||
      typeof row.rationale !== "string" ||
      !row.rationale.trim() ||
      typeof row.recommended_approach !== "string" ||
      !row.recommended_approach.trim()
    ) {
      throw new Error(
        "Matchmaker a retourné un scoring invalide. Les marques restent conservées.",
      );
    }
    seen.add(index);
    const brand = brands[index];
    const scoreDetails = Object.fromEntries(
      SCORE_AXES.map((axis) => [axis, details[axis]]),
    ) as unknown as ScoreDetails;
    const average = Math.round(
      SCORE_AXES.reduce((sum, axis) => sum + scoreDetails[axis], 0) /
        SCORE_AXES.length,
    );
    const capped =
      scoreDetails.exclusivity_risk <= 3 ||
      !brand.commercial_angle?.trim() ||
      !brand.opportunity_signal?.trim() ||
      /signal faible/i.test(brand.opportunity_signal);
    const score = capped ? Math.min(6, average) : average;
    return {
      ...brand,
      rationale: row.rationale.trim(),
      recommended_approach: row.recommended_approach.trim(),
      score_details: scoreDetails,
      score,
      priority: score >= 7 ? "A" : score >= 5 ? "B" : "C",
    };
  });
}

export async function runMatchmaker(
  player: Player,
  brands: ScoutBrand[],
  log: LogCallback,
  playerIntelligence?: PlayerIntelligence,
): Promise<ScoredBrand[]> {
  if (brands.length === 0) return [];
  if (brands.length > MATCHMAKER_MAX_BRANDS) {
    throw new Error(
      "Trop de marques pour un scoring borné. Lancez un nouveau scan.",
    );
  }
  const batches: ScoutBrand[][] = [];
  for (let index = 0; index < brands.length; index += MATCHMAKER_BATCH_SIZE) {
    batches.push(brands.slice(index, index + MATCHMAKER_BATCH_SIZE));
  }
  const playerProfile = buildPlayerProfile(player);
  const intelligence = playerIntelligence
    ? JSON.stringify(playerIntelligence)
    : "Non disponible — scorer à partir du profil de base, sans inventer de preuves.";
  const results: ScoredBrand[][] = new Array(batches.length);
  const controller = new AbortController();
  const deadline = Date.now() + SCAN_STAGE_TIMEOUT_MS.matchmaker;
  const signal = AbortSignal.any([
    controller.signal,
    AbortSignal.timeout(SCAN_STAGE_TIMEOUT_MS.matchmaker),
  ]);
  let nextBatch = 0;
  let scoredCount = 0;
  log(
    `Claude évalue ${brands.length} marques en ${batches.length} petits lots, sans recherche web.`,
    "info",
  );

  const workers = Array.from(
    { length: Math.min(MATCHMAKER_CONCURRENCY, batches.length) },
    async () => {
      while (nextBatch < batches.length) {
        signal.throwIfAborted();
        const batchIndex = nextBatch++;
        const batch = batches[batchIndex];
        const prompt = MATCHMAKER_PROMPT.replace(
          "{playerProfile}",
          playerProfile,
        )
          .replace("{playerIntelligence}", intelligence)
          .replace(
            "{brandsJSON}",
            JSON.stringify(
              batch.map((brand, brand_index) => ({ ...brand, brand_index })),
            ),
          );
        const text = await generateClaudeText({
          prompt,
          maxOutputTokens: 4096,
          maxWebSearchUses: 0,
          thinking: "disabled",
          effort: "low",
          outputSchema: SCORE_SCHEMA,
          timeoutMs: Math.max(1, deadline - Date.now()),
          signal,
        });
        results[batchIndex] = parseMatchmakerBatch(text, batch);
        scoredCount += batch.length;
        log(
          `${scoredCount}/${brands.length} marques évaluées par Matchmaker.`,
          "info",
        );
      }
    },
  );
  try {
    await Promise.all(workers);
  } catch (error) {
    controller.abort(error);
    await Promise.allSettled(workers);
    throw error;
  }
  const scoredBrands = results.flat().sort((a, b) => b.score - a.score);
  log(`Scoring terminé — ${scoredBrands.length} marques scorées.`, "success");
  return scoredBrands;
}
