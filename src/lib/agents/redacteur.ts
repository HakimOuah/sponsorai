import { anthropic } from "@/lib/claude";
import {
  REDACTEUR_PROMPT,
  EMAIL_TYPE_INSTRUCTIONS,
  buildPlayerProfile,
} from "./prompts";
import type { Player, Company, Prospect } from "@prisma/client";

interface GeneratedEmail {
  subject: string;
  body: string;
}

export async function runRedacteur(
  player: Player,
  company: Company,
  prospect: Prospect,
  emailType: "first_contact" | "followup_1" | "followup_2"
): Promise<GeneratedEmail> {
  const playerProfile = buildPlayerProfile(player);

  const prompt = REDACTEUR_PROMPT.replace("{playerProfile}", playerProfile)
    .replace("{companyName}", company.name)
    .replace("{companySector}", company.sector || "Non renseigné")
    .replace("{companyCountry}", company.country || "Non renseigné")
    .replace("{contactName}", company.contactName || "Responsable partenariats")
    .replace("{contactRole}", company.contactRole || "—")
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
    );

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

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
