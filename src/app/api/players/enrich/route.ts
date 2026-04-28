import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/claude";
import { extractJSONObject } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PlayerEnrichment {
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
  const { firstName, lastName, query } = await request.json();
  const playerQuery = [firstName, lastName].filter(Boolean).join(" ").trim() || query?.trim();

  if (!playerQuery) {
    return NextResponse.json(
      { error: "Player name required" },
      { status: 400 }
    );
  }

  const prompt = `Tu es un assistant de recherche pour un CRM de sponsoring sportif.

MISSION : retrouver les informations publiques d'un footballeur professionnel à partir de son nom et préparer un formulaire joueur.

JOUEUR À RECHERCHER : ${playerQuery}

Recherche sur le web des sources fiables : club actuel, ligue, poste, âge, nationalité, ville/pays de base, réseaux sociaux publics, audience approximative, style d'image, langues probables et types de deals pertinents.

Retourne UNIQUEMENT un JSON strict, sans markdown :
{
  "firstName": "Prénom",
  "lastName": "Nom",
  "age": 25,
  "nationality": "Pays",
  "club": "Club actuel",
  "league": "Ligue actuelle",
  "position": "Poste",
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
- Si plusieurs joueurs ont ce nom, choisis le footballeur professionnel le plus probable et indique l'ambiguïté dans notes.
- targetPartnerships doit éviter les équipementiers sportifs majeurs (Nike, Adidas, Puma, New Balance, Under Armour, Reebok, Jordan) et privilégier des catégories plus accessibles : lifestyle, nutrition, tech, gaming, automobile, voyage, fintech, beauté/grooming, mode hors équipementier, communautés/diaspora.
- Le champ notes doit mentionner les sources consultées et les points incertains.
- Tous les champs inconnus doivent être null, pas "Non trouvé".`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 8,
        },
      ],
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

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
