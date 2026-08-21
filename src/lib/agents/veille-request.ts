export const VEILLE_WEB_SEARCH_MAX_USES = 8;

export function buildVeilleRequest(prompt: string) {
  return {
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    tools: [
      {
        type: "web_search_20250305" as const,
        name: "web_search" as const,
        max_uses: VEILLE_WEB_SEARCH_MAX_USES,
      },
    ],
    messages: [{ role: "user" as const, content: prompt }],
  };
}
