const XAI_RESPONSES_URL = "https://api.x.ai/v1/responses";

export const GROK_MODEL = process.env.GROK_MODEL || "grok-4.6";

type ReasoningEffort = "none" | "low" | "medium" | "high";

export interface GenerateAITextOptions {
  prompt: string;
  maxOutputTokens?: number;
  webSearch?: boolean;
  reasoningEffort?: ReasoningEffort;
}

type GrokResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

export async function generateAIText({
  prompt,
  maxOutputTokens = 4096,
  webSearch = false,
  reasoningEffort = "low",
}: GenerateAITextOptions): Promise<string> {
  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;

  if (!apiKey) {
    throw new Error("GROK_API_KEY is not configured");
  }

  const response = await fetch(XAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      input: [{ role: "user", content: prompt }],
      max_output_tokens: maxOutputTokens,
      reasoning: { effort: reasoningEffort },
      ...(webSearch ? { tools: [{ type: "web_search" }] } : {}),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(180_000),
  });

  if (!response.ok) {
    const details = (await response.text()).slice(0, 800);
    throw new Error(`Grok API failed (${response.status}): ${details}`);
  }

  const data = (await response.json()) as GrokResponse;
  const text = extractGrokText(data);

  if (!text) {
    throw new Error("Grok API returned no text output");
  }

  return text;
}

export function extractGrokText(data: GrokResponse): string {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  return (data.output || [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content || [])
    .filter((content) => content.type === "output_text" && content.text)
    .map((content) => content.text!.trim())
    .filter(Boolean)
    .join("\n");
}
