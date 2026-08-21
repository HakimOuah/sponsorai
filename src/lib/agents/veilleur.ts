import { generateAIText } from "@/lib/ai";
import { VEILLEUR_PROMPT } from "./prompts";
import type { LogCallback } from "./scout";

export interface ReplyAnalysis {
  sentiment: "positive" | "neutral" | "negative" | "question";
  category: string;
  summary: string;
  next_action: string;
  urgency: "high" | "medium" | "low";
  key_info: string | null;
  suggested_stage: string;
}

export async function runVeilleur(
  context: {
    companyName: string;
    playerName: string;
    emailType: string;
    emailSubject: string;
    replyContent: string;
  },
  log: LogCallback
): Promise<ReplyAnalysis> {
  log(`Analyse de la réponse de ${context.companyName}...`, "info");

  const prompt = VEILLEUR_PROMPT
    .replace("{companyName}", context.companyName)
    .replace("{playerName}", context.playerName)
    .replace("{emailType}", context.emailType)
    .replace("{emailSubject}", context.emailSubject)
    .replace("{replyContent}", context.replyContent);

  log("Appel Grok pour classification...", "info");

  const text = await generateAIText({
    prompt,
    maxOutputTokens: 2048,
  });

  const cleaned = text
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "");

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON found in Veilleur response");
  }

  const result: ReplyAnalysis = JSON.parse(cleaned.substring(start, end + 1));

  const sentimentEmoji: Record<string, string> = {
    positive: "POSITIF",
    neutral: "NEUTRE",
    negative: "NÉGATIF",
    question: "QUESTION",
  };

  log(`Sentiment : ${sentimentEmoji[result.sentiment] || result.sentiment}`,
    result.sentiment === "positive" ? "success" :
    result.sentiment === "negative" ? "error" : "info"
  );
  log(`Catégorie : ${result.category}`, "data");
  log(`Résumé : ${result.summary}`, "info");
  log(`Action recommandée : ${result.next_action}`, "success");
  log(`Urgence : ${result.urgency}`, result.urgency === "high" ? "success" : "info");

  if (result.key_info) {
    log(`Info clé : ${result.key_info}`, "data");
  }

  return result;
}
