import { generateAIText } from "@/lib/ai";
import {
  REDACTEUR_PROMPT,
  EMAIL_TYPE_INSTRUCTIONS,
  buildPlayerProfile,
} from "./prompts";
import type { Player, Company, Prospect } from "@prisma/client";
import {
  getLanguageInstruction,
  type OutreachLanguage,
} from "./outreach-language";

interface GeneratedEmail {
  subject: string;
  body: string;
}

export async function runRedacteur(
  player: Player,
  company: Company,
  prospect: Prospect,
  emailType: "first_contact" | "followup_1" | "followup_2",
  options?: {
    contactName?: string | null;
    contactRole?: string | null;
    language?: OutreachLanguage;
    representativeName?: string | null;
    recipientEmailKind?: "personal_professional" | "functional_generic" | "unknown";
  },
): Promise<GeneratedEmail> {
  const playerProfile = buildPlayerProfile(player);
  const representativeName = options?.representativeName || "Le représentant";
  const playerName = `${player.firstName} ${player.lastName}`;
  const recipientRouting =
    options?.recipientEmailKind === "functional_generic"
      ? `boîte fonctionnelle de l’entreprise : ne suppose pas que ${options?.contactName || "le décideur"} lira personnellement le message. Utilise une salutation générale et indique clairement le service ou la personne à qui transmettre la proposition.`
      : "adresse professionnelle attribuée au destinataire sélectionné";

  const prompt = REDACTEUR_PROMPT.replace("{playerProfile}", playerProfile)
    .replaceAll("{representativeName}", representativeName)
    .replaceAll("{playerName}", playerName)
    .replace("{companyName}", company.name)
    .replace("{companySector}", company.sector || "Non renseigné")
    .replace("{companyCountry}", company.country || "Non renseigné")
    .replace(
      "{contactName}",
      options?.contactName || company.contactName || "Responsable partenariats",
    )
    .replace("{contactRole}", options?.contactRole || company.contactRole || "—")
    .replace("{recipientRouting}", recipientRouting)
    .replace("{rationale}", prospect.rationale || "Correspondance identifiée par l'agent IA")
    .replace(
      "{recommendedApproach}",
      prospect.recommendedApproach || "Approche directe"
    )
    .replace("{partnershipType}", prospect.partnershipType || "À définir")
    .replace(/{emailType}/g, emailType)
    .replace(
      "{emailTypeInstructions}",
      EMAIL_TYPE_INSTRUCTIONS[emailType] || ""
    )
    .replace(
      "{languageInstruction}",
      getLanguageInstruction(options?.language || "fr"),
    );

  let generated = await generateAndParseEmail(prompt);

  if (!usesRepresentativeVoice(generated.body, representativeName, playerName)) {
    generated = await generateAndParseEmail(`${prompt}

CORRECTION OBLIGATOIRE : le brouillon précédent a été refusé, car il parlait au nom du sportif ou n'identifiait pas clairement son représentant. Réécris entièrement le message. Le narrateur et signataire doit être ${representativeName}, représentant de ${playerName}.`);
  }

  return generated;
}

async function generateAndParseEmail(prompt: string): Promise<GeneratedEmail> {
  const text = await generateAIText({ prompt, maxOutputTokens: 2048 });

  // Parse JSON response
  const cleaned = text
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "");

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in Rédacteur response");
  }

  const parsed = JSON.parse(cleaned.substring(start, end + 1));

  return {
    subject: parsed.subject || "Opportunité de partenariat",
    body: parsed.body || "",
  };
}

export function usesRepresentativeVoice(
  body: string,
  representativeName: string,
  playerName: string,
): boolean {
  const normalizedBody = normalizeCopy(body);
  const normalizedRepresentative = normalizeCopy(representativeName);
  const normalizedPlayer = normalizeCopy(playerName);
  const playerFirstName = normalizedPlayer.split(" ")[0];
  const impersonatesPlayer =
    normalizedBody.includes(`je suis ${normalizedPlayer}`) ||
    normalizedBody.includes(`je suis ${playerFirstName},`);

  return (
    !impersonatesPlayer &&
    normalizedRepresentative.length > 2 &&
    normalizedBody.includes(normalizedRepresentative)
  );
}

function normalizeCopy(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
