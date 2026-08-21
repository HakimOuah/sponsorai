import { NextRequest, NextResponse } from "next/server";
import { generateAIText } from "@/lib/ai";
import { extractJSONObject } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PlayerEnrichment {
  profileType?: "athlete" | "club" | null;
  sport?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  age?: number | null;
  nationality?: string | null;
  club?: string | null;
  league?: string | null;
  position?: string | null;
  city?: string | null;
  languages?: string | null;
  instagram?: string | null;
  followersIG?: number | null;
  tiktok?: string | null;
  followersTK?: number | null;
  twitter?: string | null;
  followersX?: number | null;
  engagementRate?: number | null;
  positioning?: string | null;
  targetPartnerships?: string | null;
  notes?: string | null;
  confidence?: "high" | "medium" | "low";
  sources?: string[];
}

export async function POST(request: NextRequest) {
  const { firstName, lastName, query, profileType, sport } = await request.json();
  const playerQuery = [firstName, lastName].filter(Boolean).join(" ").trim() || query?.trim();

  if (!playerQuery) {
    return NextResponse.json(
      { error: "Profile name required" },
      { status: 400 }
    );
  }

  const prompt = `Tu es un assistant de recherche pour un CRM de sponsoring sportif multi-sport.

MISSION : retrouver les informations publiques d'un sportif, d'une équipe ou d'un club amateur à partir de son nom et préparer un formulaire de profil commercial.

PROFIL À RECHERCHER : ${playerQuery}
TYPE PRESSENTI : ${profileType || "Non précisé"}
SPORT PRESSENTI : ${sport || "Non précisé"}

Recherche sur le web des sources fiables : sport, structure/club actuel, championnat/niveau, discipline ou poste, âge si sportif individuel, localisation, réseaux sociaux publics, audience approximative, style d'image, langues probables et types de deals pertinents.

Retourne UNIQUEMENT un JSON strict, sans markdown :
{
  "profileType": "athlete | club",
  "sport": "Sport principal",
  "firstName": "Prénom, nom public ou nom du club",
  "lastName": "Nom de famille, ville/complément, ou 'Club' si club amateur",
  "age": 25,
  "nationality": "Pays",
  "club": "Club, association, équipe ou structure",
  "league": "Championnat, division, niveau ou zone de compétition",
  "position": "Poste, discipline ou catégorie",
  "city": "Ville ou pays principal",
  "languages": "FR, EN",
  "instagram": "@username ou null",
  "followersIG": 123000,
  "tiktok": "@username ou null",
  "followersTK": null,
  "twitter": "@username ou null",
  "followersX": null,
  "engagementRate": null,
  "positioning": "Synthèse courte de l'image publique, du style de contenu, des valeurs et du potentiel de marque",
  "targetPartnerships": "Types de deals recommandés",
  "notes": "Sources et incertitudes importantes en 2-4 phrases",
  "confidence": "high | medium | low",
  "sources": ["url ou nom de source 1", "url ou nom de source 2"]
}

RÈGLES :
- Ne devine pas les chiffres sociaux. Si tu n'es pas sûr, mets null.
- Si plusieurs profils ont ce nom, choisis le profil sportif le plus probable et indique l'ambiguïté dans notes.
- Pour un club amateur, remplis firstName avec le nom du club et lastName avec la ville, la catégorie ou "Club".
- targetPartnerships doit éviter les équipementiers sportifs majeurs quand ils sont peu accessibles (Nike, Adidas, Puma, New Balance, Under Armour, Reebok, Jordan) et privilégier des catégories plus réalistes : commerces locaux, restauration, santé, mobilité, immobilier, banques/assurances locales, nutrition, tech, tourisme, mode, équipement régional, événements, communautés locales.
- Le champ notes doit mentionner les sources consultées et les points incertains.
- Tous les champs inconnus doivent être null, pas "Non trouvé".`;

  try {
    const text = await generateAIText({
      prompt,
      maxOutputTokens: 4096,
      webSearch: true,
    });

    const enrichment = extractJSONObject<PlayerEnrichment>(text);

    return NextResponse.json({ enrichment });
  } catch (error) {
    console.error("Player enrichment error:", error);
    return NextResponse.json(
      { error: "Failed to enrich player" },
      { status: 500 }
    );
  }
}
