export const SPORTS = [
  "Football",
  "Basket-ball",
  "Rugby",
  "Tennis",
  "Handball",
  "Volley-ball",
  "Athlétisme",
  "Cyclisme",
  "Natation",
  "Boxe / MMA",
  "Judo / Arts martiaux",
  "Golf",
  "Padel",
  "Ski / Sports d'hiver",
  "Équitation",
  "Gymnastique",
  "Aviron",
  "Escrime",
  "Esport",
] as const;

export type KnownSport = (typeof SPORTS)[number];

export function isKnownSport(sport?: string | null): sport is KnownSport {
  return !!sport && (SPORTS as readonly string[]).includes(sport);
}

type SportMeta = { emoji: string; color: string };

const SPORT_META: Record<string, SportMeta> = {
  Football: { emoji: "⚽", color: "#3EF2A0" },
  "Basket-ball": { emoji: "🏀", color: "#f59e0b" },
  Rugby: { emoji: "🏉", color: "#8b5cf6" },
  Tennis: { emoji: "🎾", color: "#a3e635" },
  Handball: { emoji: "🤾", color: "#38bdf8" },
  "Volley-ball": { emoji: "🏐", color: "#fb923c" },
  Athlétisme: { emoji: "🏃", color: "#f43f5e" },
  Cyclisme: { emoji: "🚴", color: "#22d3ee" },
  Natation: { emoji: "🏊", color: "#3b82f6" },
  "Boxe / MMA": { emoji: "🥊", color: "#ef4444" },
  "Judo / Arts martiaux": { emoji: "🥋", color: "#e879f9" },
  Golf: { emoji: "⛳", color: "#84cc16" },
  Padel: { emoji: "🎾", color: "#2dd4bf" },
  "Ski / Sports d'hiver": { emoji: "🎿", color: "#60a5fa" },
  Équitation: { emoji: "🐎", color: "#d97706" },
  Gymnastique: { emoji: "🤸", color: "#f472b6" },
  Aviron: { emoji: "🚣", color: "#0ea5e9" },
  Escrime: { emoji: "🤺", color: "#c084fc" },
  Esport: { emoji: "🎮", color: "#a78bfa" },
};

const DEFAULT_META: SportMeta = { emoji: "🏅", color: "#8FA69E" };

export function getSportMeta(sport?: string | null): SportMeta {
  if (!sport) return DEFAULT_META;
  return SPORT_META[sport] ?? DEFAULT_META;
}
