const XAI_RESPONSES_URL = "https://api.x.ai/v1/responses";
const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";

export const GROK_MODEL = process.env.GROK_MODEL || "grok-4.6";
export const CLAUDE_SCOUT_MODEL =
  process.env.CLAUDE_SCOUT_MODEL || "claude-sonnet-5";
export const CLAUDE_SCOUT_THINKING = "disabled" as const;

type ReasoningEffort = "none" | "low" | "medium" | "high";

export interface GenerateAITextOptions {
  prompt: string;
  maxOutputTokens?: number;
  webSearch?: boolean;
  reasoningEffort?: ReasoningEffort;
  timeoutMs?: number;
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

type ClaudeContentBlock = {
  type?: string;
  text?: string;
  [key: string]: unknown;
};

type ClaudeResponse = {
  content?: ClaudeContentBlock[];
  stop_reason?: string | null;
};

export interface GenerateClaudeTextOptions {
  prompt: string;
  maxOutputTokens?: number;
  maxWebSearchUses?: number;
  effort?: "low" | "medium" | "high";
  thinking?: "disabled" | "adaptive";
  timeoutMs?: number;
}

export async function generateAIText({
  prompt,
  maxOutputTokens = 4096,
  webSearch = false,
  reasoningEffort = "low",
  timeoutMs = 90_000,
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
    signal: AbortSignal.timeout(timeoutMs),
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

export async function generateClaudeText({
  prompt,
  maxOutputTokens = 7000,
  maxWebSearchUses = 4,
  effort = "low",
  thinking = CLAUDE_SCOUT_THINKING,
  timeoutMs = 120_000,
}: GenerateClaudeTextOptions): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const tools = [
    {
      type: "web_search_20260209",
      name: "web_search",
      max_uses: maxWebSearchUses,
    },
  ];
  const messages: Array<{
    role: "user" | "assistant";
    content: string | ClaudeContentBlock[];
  }> = [{ role: "user", content: prompt }];
  const responses: ClaudeResponse[] = [];
  const deadline = Date.now() + timeoutMs;

  for (let continuation = 0; continuation < 2; continuation += 1) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
    }

    const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_SCOUT_MODEL,
        max_tokens: maxOutputTokens,
        messages,
        tools,
        thinking: { type: thinking },
        output_config: { effort },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(remainingMs),
    });

    if (!response.ok) {
      const details = (await response.text()).slice(0, 800);
      throw new Error(`Claude API failed (${response.status}): ${details}`);
    }

    const data = (await response.json()) as ClaudeResponse;
    responses.push(data);

    if (data.stop_reason !== "pause_turn") break;
    if (continuation === 1) {
      throw new Error("Claude web search paused too many times");
    }

    messages.push({ role: "assistant", content: data.content || [] });
  }

  const text = extractClaudeText(responses);
  if (!text) {
    throw new Error("Claude API returned no text output");
  }

  return text;
}

export function extractClaudeText(
  data: ClaudeResponse | ClaudeResponse[],
): string {
  const responses = Array.isArray(data) ? data : [data];

  return responses
    .flatMap((response) => response.content || [])
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text!.trim())
    .filter(Boolean)
    .join("\n");
}
