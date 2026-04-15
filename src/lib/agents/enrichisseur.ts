import { anthropic } from "@/lib/claude";
import { ENRICHISSEUR_PROMPT } from "./prompts";
import type { Company } from "@prisma/client";
import type { LogCallback } from "./scout";

export interface EnrichContact {
  name: string;
  role: string;
  email: string | null;
  linkedin: string | null;
  confidence: "high" | "medium" | "low";
  source: string;
}

export interface EnrichResult {
  contacts: EnrichContact[];
  company_insights: string;
}

export async function runEnrichisseur(
  company: Company,
  log: LogCallback
): Promise<EnrichResult> {
  log(`Recherche de contacts pour ${company.name}...`, "info");

  const prompt = ENRICHISSEUR_PROMPT
    .replace("{companyName}", company.name)
    .replace("{companySector}", company.sector || "Non renseigné")
    .replace("{companyCountry}", company.country || "Non renseigné")
    .replace("{companyWebsite}", company.website || "Non renseigné")
    .replace("{companyDescription}", company.description || "Non renseigné");

  log("Appel Claude avec web search...", "info");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Parse JSON
  const cleaned = text
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "");

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON found in Enrichisseur response");
  }

  const result: EnrichResult = JSON.parse(cleaned.substring(start, end + 1));

  log(`${result.contacts.length} contact(s) trouvé(s)`, "success");
  result.contacts.forEach((c, i) => {
    log(
      `  ${i + 1}. ${c.name} — ${c.role} [${c.confidence}]${c.email ? ` · ${c.email}` : ""}`,
      "data"
    );
  });

  if (result.company_insights) {
    log(`Insight : ${result.company_insights}`, "info");
  }

  return result;
}
