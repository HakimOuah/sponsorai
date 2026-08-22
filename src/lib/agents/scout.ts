import { generateAIText, generateClaudeText } from "@/lib/ai";
import { extractJSON, extractJSONObject } from "@/lib/utils";
import {
  SCOUT_RESEARCH_PROMPT,
  SCOUT_DISCOVERY_PROMPT,
  buildPlayerProfile,
} from "./prompts";
import type { ScoutBrand, PlayerIntelligence } from "@/types";
import type { Player } from "@prisma/client";
import { SCAN_STAGE_TIMEOUT_MS } from "./scan-budget";
import {
  deduplicateBrandCandidates,
  filterAlreadyEvaluatedBrands,
} from "./scout-deduplication";

export type LogCallback = (message: string, type?: "info" | "success" | "error" | "data") => void;

export const SCOUT_BATCHES = [
  {
    name: "France locale & nationale",
    targetCount: "2 à 3",
    directive:
      "Priorise les marques françaises et les entreprises régionales ou nationales accessibles, en croissance et cohérentes avec le territoire du profil.",
  },
  {
    name: "Europe accessible",
    targetCount: "2 à 3",
    directive:
      "Cherche des marques européennes accessibles qui se développent en France et partagent l'audience, les valeurs ou les usages du profil.",
  },
  {
    name: "MENA & diaspora",
    targetCount: "2 à 3",
    directive:
      "Explore le MENA et les marchés internationaux directement reliés à la nationalité, l'audience, les valeurs ou les angles commerciaux du profil. Évite les rapprochements géographiques artificiels.",
  },
  {
    name: "Nutrition, bien-être & D2C",
    targetCount: "2 à 3",
    directive:
      "Recherche des marques D2C et émergentes de nutrition, récupération, santé ou bien-être avec un signal récent et une vraie capacité à activer ce profil.",
  },
  {
    name: "Lifestyle, mode & technologie",
    targetCount: "2 à 3",
    directive:
      "Recherche des marques émergentes de mode, streetwear, accessoires, technologie grand public ou lifestyle qui correspondent réellement à l'image et à l'audience du profil.",
  },
  {
    name: "Services, mobilité & employeurs",
    targetCount: "2 à 3",
    directive:
      "Cible des entreprises de services, mobilité, fintech, assurance, télécom, formation ou des employeurs régionaux. Cherche un angle d'ancrage territorial, de jeunesse, de performance ou d'inclusion différent des vagues produit et lifestyle.",
  },
] as const;

export function buildScoutIntelligenceBrief(
  intelligence?: PlayerIntelligence,
): string {
  if (!intelligence) {
    return "Dossier indisponible : se baser uniquement sur le profil.";
  }

  const angles = (intelligence.commercial_angles || []).slice(0, 4).map((angle) => ({
    name: angle.name,
    ideal_brand_profile: angle.ideal_brand_profile,
    target_regions: angle.target_regions,
  }));

  return JSON.stringify({
    public_image: intelligence.public_image,
    audience_demographics: intelligence.audience_demographics,
    recent_news: intelligence.recent_news,
    key_values: (intelligence.key_values || []).slice(0, 5),
    brand_affinities: (intelligence.brand_affinities || []).slice(0, 6),
    existing_partnerships: intelligence.existing_partnerships || [],
    brand_conflicts: intelligence.brand_conflicts || [],
    commercial_angles: angles,
  });
}

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
    timeoutMs: SCAN_STAGE_TIMEOUT_MS.playerResearch,
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

  // Search and structure in one call. The former second formatting call was
  // slow enough to make otherwise successful scans time out.
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

  const buildDiscoveryPrompt = (
    batch: { targetCount: string; directive: string },
    additionalExclusions: string[] = [],
  ) => {
    const runtimeExclusions = additionalExclusions.length > 0
      ? `${exclusionSection}\n\nCANDIDATS DÉJÀ TROUVÉS PENDANT CE SCAN — NE PAS LES RÉPÉTER :\n${additionalExclusions.map((name) => `- ${name}`).join("\n")}`
      : exclusionSection;

    return SCOUT_DISCOVERY_PROMPT
      .replace("{playerProfile}", playerProfile)
      .replace("{exclusionSection}", runtimeExclusions)
      .replace("{playerIntelligenceBrief}", buildScoutIntelligenceBrief(intelligence))
      .replace(/\{targetCount\}/g, batch.targetCount)
      .replace("{batchDirective}", batch.directive);
  };

  const runDiscoveryBatch = async (
    batch: { name: string; targetCount: string; directive: string },
    additionalExclusions: string[] = [],
    timeoutMs: number = SCAN_STAGE_TIMEOUT_MS.scoutSearch,
  ) => {
    log(`Vague ${batch.name} en cours...`, "info");
    const searchText = await generateClaudeText({
      prompt: buildDiscoveryPrompt(batch, additionalExclusions),
      maxOutputTokens: 2200,
      maxWebSearchUses: 1,
      effort: "low",
      timeoutMs,
    });
    const batchBrands = extractJSON<ScoutBrand>(searchText);
    log(`Vague ${batch.name} terminée — ${batchBrands.length} marques`, "success");
    return batchBrands;
  };

  log("Claude Sonnet 5 lance 6 recherches ciblées en parallèle...", "info");

  const batchResults = await Promise.allSettled(
    SCOUT_BATCHES.map((batch) => runDiscoveryBatch(batch))
  );

  const generatedBrands: ScoutBrand[] = [];
  const batchErrors: unknown[] = [];

  batchResults.forEach((result, index) => {
    if (result.status === "fulfilled") {
      generatedBrands.push(...result.value);
      return;
    }

    batchErrors.push(result.reason);
    log(`Vague ${SCOUT_BATCHES[index].name} interrompue — les autres résultats sont conservés`, "error");
  });

  if (generatedBrands.length === 0) {
    throw batchErrors[0] || new Error("Aucune vague Scout n'a abouti");
  }

  let brands = deduplicateBrandCandidates(generatedBrands);

  if (brands.length < 12) {
    log(`Seulement ${brands.length} marques uniques — lancement d'une vague de rattrapage...`, "info");
    try {
      const recoveryBrands = await runDiscoveryBatch(
        {
          name: "Rattrapage multi-secteurs",
          targetCount: "4 à 5",
          directive:
            "Complète les résultats avec des marques accessibles issues de secteurs encore absents. Élargis la géographie seulement si elle reste cohérente avec le profil et privilégie les entreprises ayant un signal d'activation récent.",
        },
        brands.map((brand) => brand.name),
        SCAN_STAGE_TIMEOUT_MS.scoutRecovery,
      );
      brands = deduplicateBrandCandidates([...brands, ...recoveryBrands]);
    } catch {
      log("Vague de rattrapage interrompue — les résultats déjà obtenus sont conservés", "error");
    }
  }

  brands = brands.slice(0, 15);
  log(`Recherche parallèle terminée — ${brands.length} marques uniques`, "success");

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
