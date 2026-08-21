import type { GenerateAITextOptions } from "@/lib/ai";

export function buildVeilleRequest(prompt: string): GenerateAITextOptions {
  return {
    prompt,
    maxOutputTokens: 8192,
    webSearch: true,
  };
}
