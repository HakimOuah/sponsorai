export const refreshFields = {
  followersIG: "Abonnés Instagram",
  followersTK: "Abonnés TikTok",
  followersX: "Abonnés X",
  instagram: "Compte Instagram",
  tiktok: "Compte TikTok",
  twitter: "Compte X",
  engagementRate: "Taux d’engagement (%)",
  positioning: "Image et communication",
  club: "Club / structure",
  league: "Championnat",
  position: "Poste / catégorie",
} as const;
export type RefreshField = keyof typeof refreshFields;
export type RefreshValues = Partial<Record<RefreshField, string | number>>;

/** Never clears unknown fields or changes identity, private notes or deal preferences. */
export function sanitizeRefresh(value: unknown): RefreshValues {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const result: RefreshValues = {};
  for (const key of Object.keys(refreshFields) as RefreshField[]) {
    const v = source[key];
    if (key.startsWith("followers") || key === "engagementRate") {
      if (
        typeof v === "number" &&
        Number.isFinite(v) &&
        v >= 0 &&
        (key === "engagementRate"
          ? v <= 100
          : Number.isInteger(v) && v <= 2147483647)
      )
        result[key] = v;
    } else if (typeof v === "string" && v.trim() && v.length <= 4000)
      result[key] = v.trim();
  }
  return result;
}
