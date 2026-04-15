import { anthropic } from "@/lib/claude";
import { extractJSON } from "@/lib/utils";
import { MATCHMAKER_PROMPT, buildPlayerProfile } from "./prompts";
import type { ScoutBrand, ScoredBrand, PlayerIntelligence } from "@/types";
import type { Player } from "@prisma/client";
import type { LogCallback } from "./scout";

export async function runMatchmaker(
  player: Player,
  brands: ScoutBrand[],
  log: LogCallback,
  playerIntelligence?: PlayerIntelligence
): Promise<ScoredBrand[]> {
  log("Phase 2 — Scoring multi-critères (8 axes)...", "info");
  log(`${brands.length} marques à scorer pour ${player.firstName} ${player.lastName}`, "info");

  const playerProfile = buildPlayerProfile(player);

  let prompt = MATCHMAKER_PROMPT
    .replace("{playerProfile}", playerProfile)
    .replace("{brandsJSON}", JSON.stringify(brands, null, 2));

  if (playerIntelligence) {
    prompt = prompt.replace(
      "{playerIntelligence}",
      JSON.stringify(playerIntelligence, null, 2)
    );
  } else {
    prompt = prompt.replace(
      "{playerIntelligence}",
      "Non disponible — scorer en se basant sur le profil de base."
    );
  }

  log("Appel Claude pour le scoring enrichi...", "info");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText =
    response.content[0].type === "text" ? response.content[0].text : "";

  const scoredBrands = extractJSON<ScoredBrand>(responseText);

  // Sort by score descending
  scoredBrands.sort((a, b) => (b.score || 0) - (a.score || 0));

  const countA = scoredBrands.filter((b) => b.priority === "A").length;
  const countB = scoredBrands.filter((b) => b.priority === "B").length;
  const countC = scoredBrands.filter((b) => b.priority === "C").length;

  log(`Scoring terminé — ${scoredBrands.length} marques scorées`, "success");
  log(`Répartition : ${countA} A | ${countB} B | ${countC} C`, "success");

  scoredBrands.forEach((brand, i) => {
    const details = brand.score_details;
    const flags: string[] = [];
    if (details?.exclusivity_risk !== undefined && details.exclusivity_risk <= 3) {
      flags.push("⚠ exclusivité");
    }
    if (details?.brand_momentum !== undefined && details.brand_momentum >= 8) {
      flags.push("🚀 momentum");
    }
    log(
      `  ${i + 1}. [${brand.priority}] ${brand.name} — ${brand.score}/10${flags.length > 0 ? ` (${flags.join(", ")})` : ""}`,
      "data"
    );
  });

  return scoredBrands;
}
