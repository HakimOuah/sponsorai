export const OUTREACH_LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "Anglais" },
  { value: "es", label: "Espagnol" },
  { value: "de", label: "Allemand" },
  { value: "it", label: "Italien" },
  { value: "pt", label: "Portugais" },
] as const;

export type OutreachLanguage = (typeof OUTREACH_LANGUAGES)[number]["value"];

const COUNTRY_LANGUAGE_HINTS: Record<string, OutreachLanguage> = {
  france: "fr",
  belgique: "fr",
  belgium: "fr",
  suisse: "fr",
  switzerland: "fr",
  espagne: "es",
  spain: "es",
  mexique: "es",
  mexico: "es",
  allemagne: "de",
  germany: "de",
  autriche: "de",
  austria: "de",
  italie: "it",
  italy: "it",
  portugal: "pt",
  brésil: "pt",
  brazil: "pt",
  "royaume-uni": "en",
  "united kingdom": "en",
  uk: "en",
  "états-unis": "en",
  "united states": "en",
  usa: "en",
  canada: "en",
  emirats: "en",
  "émirats arabes unis": "en",
  uae: "en",
};

export function isOutreachLanguage(
  value: unknown,
): value is OutreachLanguage {
  return OUTREACH_LANGUAGES.some((language) => language.value === value);
}

export function suggestOutreachLanguage(country?: string | null): {
  language: OutreachLanguage;
  confidence: "medium" | "low";
  reason: string;
} {
  const normalized = country?.trim().toLowerCase();
  if (normalized && COUNTRY_LANGUAGE_HINTS[normalized]) {
    return {
      language: COUNTRY_LANGUAGE_HINTS[normalized],
      confidence: "medium",
      reason: `Suggestion basée sur le pays de l’entreprise (${country}).`,
    };
  }

  return {
    language: "en",
    confidence: "low",
    reason:
      "Aucune préférence explicite détectée : l’anglais international est proposé.",
  };
}

export function getLanguageInstruction(language: OutreachLanguage): string {
  const labels: Record<OutreachLanguage, string> = {
    fr: "français",
    en: "anglais professionnel international",
    es: "espagnol professionnel",
    de: "allemand professionnel",
    it: "italien professionnel",
    pt: "portugais professionnel",
  };
  return `Rédige intégralement l'objet et le corps en ${labels[language]}. N'ajoute aucune traduction ni explication dans une autre langue.`;
}

