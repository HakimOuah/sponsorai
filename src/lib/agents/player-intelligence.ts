import type { PlayerIntelligence } from "@/types";

export const PLAYER_INTELLIGENCE_FRESHNESS_MS = 24 * 60 * 60 * 1000;

export function isPlayerIntelligence(value: unknown): value is PlayerIntelligence {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const intelligence = value as Partial<PlayerIntelligence>;
  return (
    typeof intelligence.recent_stats === "string" &&
    typeof intelligence.social_content_style === "string" &&
    Array.isArray(intelligence.brand_affinities) &&
    Array.isArray(intelligence.existing_partnerships) &&
    Array.isArray(intelligence.brand_conflicts) &&
    typeof intelligence.public_image === "string" &&
    typeof intelligence.audience_demographics === "string" &&
    typeof intelligence.recent_news === "string" &&
    typeof intelligence.momentum_score === "number" &&
    Array.isArray(intelligence.key_values) &&
    Array.isArray(intelligence.commercial_angles)
  );
}
