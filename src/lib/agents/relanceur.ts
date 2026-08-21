import { anthropic } from "@/lib/claude";
import { RELANCEUR_PROMPT, buildPlayerProfile } from "./prompts";
import type { Player } from "@prisma/client";
import type { LogCallback } from "./scout";

interface NewsItem {
  headline: string;
  source: string;
  date: string;
  relevance: string;
  hook_potential: string;
}

export interface RelanceurResult {
  news_found: NewsItem[];
  best_hook: string;
  email: { subject: string; body: string };
  timing_score: number;
  timing_rationale: string;
}

export async function runRelanceur(
  player: Player,
  context: {
    companyName: string;
    companySector: string;
    firstEmailDate: string;
    firstEmailSubject: string;
    daysSince: number;
  },
  log: LogCallback
): Promise<RelanceurResult> {
  log(`Recherche d'actualité pour ${player.firstName} ${player.lastName}...`, "info");
  log(`Marque ciblée : ${context.companyName} (${context.companySector})`, "info");
  log(`Dernier contact il y a ${context.daysSince} jours`, "info");

  const playerProfile = buildPlayerProfile(player);

  const prompt = RELANCEUR_PROMPT
    .replace("{playerProfile}", playerProfile)
    .replace("{companyName}", context.companyName)
    .replace("{companySector}", context.companySector)
    .replace("{firstEmailDate}", context.firstEmailDate)
    .replace("{firstEmailSubject}", context.firstEmailSubject)
    .replace("{daysSince}", context.daysSince.toString());

  log("Appel Claude avec web search...", "info");

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

  const cleaned = text
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "");

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON found in Relanceur response");
  }

  const result: RelanceurResult = JSON.parse(cleaned.substring(start, end + 1));

  log(`${result.news_found.length} actualité(s) trouvée(s)`, "success");
  result.news_found.forEach((n, i) => {
    log(`  ${i + 1}. [${n.relevance}] ${n.headline}`, "data");
  });
  log(`Accroche choisie : ${result.best_hook}`, "success");
  log(`Timing score : ${result.timing_score}/10 — ${result.timing_rationale}`, "info");

  return result;
}
