import { anthropic } from "@/lib/claude";
import { VEILLE_CONCURRENCE_PROMPT } from "./prompts";
import type { LogCallback } from "./scout";

export interface VeilleAlert {
  type: "new_deal" | "contract_end" | "brand_entering" | "brand_leaving" | "trend";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  source: string;
  opportunity: string | null;
  threat: string | null;
  related_player: string | null;
  related_brand: string | null;
}

export interface VeilleResult {
  alerts: VeilleAlert[];
  market_summary: string;
}

export async function runVeille(
  playersList: string,
  brandsInPipeline: string,
  log: LogCallback
): Promise<VeilleResult> {
  log("Lancement de la veille concurrentielle...", "info");
  log("Recherche des dernières actualités sponsoring football...", "info");

  const prompt = VEILLE_CONCURRENCE_PROMPT
    .replace("{playersList}", playersList)
    .replace("{brandsInPipeline}", brandsInPipeline);

  log("Appel Claude avec web search...", "info");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const cleaned = text
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "");

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON found in Veille response");
  }

  const result: VeilleResult = JSON.parse(cleaned.substring(start, end + 1));

  const highCount = result.alerts.filter((a) => a.priority === "high").length;
  const medCount = result.alerts.filter((a) => a.priority === "medium").length;

  log(`${result.alerts.length} alerte(s) détectée(s) — ${highCount} haute(s), ${medCount} moyenne(s)`, "success");

  result.alerts.forEach((a) => {
    const icon = a.priority === "high" ? "!!" : a.priority === "medium" ? "!" : "·";
    log(`  ${icon} ${a.title}`, a.priority === "high" ? "success" : "data");
  });

  log(`Résumé marché : ${result.market_summary}`, "info");

  return result;
}
