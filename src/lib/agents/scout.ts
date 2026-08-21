import { generateAIText } from "@/lib/ai";
import { extractJSON, extractJSONObject } from "@/lib/utils";
import {
  SCOUT_RESEARCH_PROMPT,
  SCOUT_SEARCH_PROMPT,
  SCOUT_STRUCTURE_PROMPT,
  buildPlayerProfile,
} from "./prompts";
import type { ScoutBrand, PlayerIntelligence } from "@/types";
import type { Player } from "@prisma/client";
import { filterAlreadyEvaluatedBrands } from "./scout-deduplication";

export type LogCallback = (message: string, type?: "info" | "success" | "error" | "data") => void;

export async function runPlayerResearch(
  player: Player,
  log: LogCallback
): Promise<PlayerIntelligence> {
  const playerProfile = buildPlayerProfile(player);

  log("Phase 0 — Recherche d'intelligence sur le profil sportif...", "info");
  log(`Analyse approfondie de ${player.firstName} ${player.lastName}...`, "info");

  const prompt = SCOUT_RESEARCH_PROMPT.replace("{playerProfile}", playerProfile);

  const responseText = await generateAIText({
    prompt,
    maxOutputTokens: 4096,
    webSearch: true,
  });

  const intelligence = extractJSONObject<PlayerIntelligence>(responseText);

  if (!intelligence) {
    log("Impossible de constituer le dossier d'intelligence — utilisation du profil de base", "error");
    return {
      recent_stats: "Non trouvé",
      social_content_style: "Non trouvé",
      brand_affinities: [],
      existing_partnerships: [],
      brand_conflicts: [],
      public_image: "Non trouvé",
      audience_demographics: "Non trouvé",
      recent_news: "Non trouvé",
      momentum_score: 5,
      key_values: [],
      commercial_angles: [],
    };
  }

  log(`Dossier intelligence constitué`, "success");
  log(`  Image publique : ${intelligence.public_image}`, "data");
  log(`  Momentum : ${intelligence.momentum_score}/10`, "data");
  log(`  Partenariats existants : ${intelligence.existing_partnerships?.length || 0} identifiés`, "data");
  log(`  Affinités marques : ${intelligence.brand_affinities?.join(", ") || "aucune"}`, "data");
  log(`  Angles commerciaux : ${intelligence.commercial_angles?.length || 0}`, "data");

  if (intelligence.existing_partnerships?.length > 0) {
    log(`  ⚠ Partenariats à éviter (concurrents) : ${intelligence.existing_partnerships.join(", ")}`, "data");
  }
  if (intelligence.brand_conflicts?.length > 0) {
    log(`  Conflits marques déduits : ${intelligence.brand_conflicts.join(", ")}`, "data");
  }

  return intelligence;
}

export async function runScout(
  player: Player,
  log: LogCallback,
  options?: {
    playerIntelligence?: PlayerIntelligence;
    excludedBrands?: string[];
  }
): Promise<ScoutBrand[]> {
  const playerProfile = buildPlayerProfile(player);
  const intelligence = options?.playerIntelligence;
  const excludedBrands = options?.excludedBrands || [];

  // Step 1: Web search with enriched context
  log("Phase 1 — Recherche de marques avec contexte enrichi...", "info");
  log(`Profil : ${player.firstName} ${player.lastName} (${player.club})`, "info");

  if (excludedBrands.length > 0) {
    log(`${excludedBrands.length} marques exclues (déjà évaluées pour ce profil)`, "info");
  }

  // Build exclusion section
  let exclusionSection = "";
  if (excludedBrands.length > 0) {
    exclusionSection = `MARQUES À EXCLURE ABSOLUMENT (déjà évaluées pour ce profil sportif, NE PAS les proposer à nouveau) :\n${excludedBrands.map((b) => `- ${b}`).join("\n")}`;
  }
  if (intelligence?.existing_partnerships?.length) {
    exclusionSection += `\n\nPARTENARIATS EXISTANTS DU PROFIL (CONFLITS D'EXCLUSIVITÉ À ÉVITER) :\n${intelligence.existing_partnerships.map((p) => `- ${p} (et tous ses concurrents directs)`).join("\n")}`;
  }
  if (intelligence?.brand_conflicts?.length) {
    exclusionSection += `\n\nMARQUES / CATÉGORIES CONCURRENTES À ÉVITER :\n${intelligence.brand_conflicts.map((p) => `- ${p}`).join("\n")}`;
  }

  let searchPrompt = SCOUT_SEARCH_PROMPT
    .replace("{playerProfile}", playerProfile)
    .replace("{exclusionSection}", exclusionSection);

  if (intelligence) {
    searchPrompt = searchPrompt.replace(
      "{playerIntelligence}",
      JSON.stringify(intelligence, null, 2)
    );
  } else {
    searchPrompt = searchPrompt.replace(
      "{playerIntelligence}",
      "Non disponible — se baser uniquement sur le profil ci-dessus."
    );
  }

  log("Appel Grok avec web search activé...", "info");

  const searchText = await generateAIText({
    prompt: searchPrompt,
    maxOutputTokens: 4096,
    webSearch: true,
  });

  const brandMentions = searchText.split("\n").filter((l) => l.trim()).length;
  log(`Recherche terminée — ~${brandMentions} lignes de résultats`, "success");

  // Step 2: Structure JSON
  log("Structuration des résultats en JSON...", "info");

  const structurePrompt = SCOUT_STRUCTURE_PROMPT.replace(
    "{searchResults}",
    searchText
  );

  const structureText = await generateAIText({
    prompt: structurePrompt,
    maxOutputTokens: 8192,
  });

  const brands = extractJSON<ScoutBrand>(structureText);

  // Post-filter: remove any excluded brands that slipped through
  const filteredBrands = filterAlreadyEvaluatedBrands(brands, excludedBrands);

  const removed = brands.length - filteredBrands.length;
  if (removed > 0) {
    log(`${removed} marques en doublon filtrées (déjà évaluées pour ce profil)`, "info");
  }

  log(`${filteredBrands.length} marques structurées avec succès`, "success");

  filteredBrands.forEach((brand, i) => {
    const confidence = (brand as ScoutBrand & { confidence_score?: number }).confidence_score;
    log(
      `  ${i + 1}. ${brand.name} (${brand.sector}, ${brand.country})${confidence ? ` — confiance: ${confidence}/10` : ""}`,
      "data"
    );
  });

  return filteredBrands;
}
