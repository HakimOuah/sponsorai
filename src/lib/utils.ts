import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractJSON<T = unknown>(text: string): T[] {
  let cleaned = text
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");

  cleaned = cleaned.replace(/```json\s*/g, "").replace(/```\s*/g, "");

  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON array found in response");
  }

  let jsonStr = cleaned.substring(start, end + 1);

  try {
    return JSON.parse(jsonStr);
  } catch {
    const lastComplete = jsonStr.lastIndexOf("}");
    if (lastComplete > 0) {
      jsonStr = jsonStr.substring(0, lastComplete + 1);
      jsonStr = jsonStr.replace(/,\s*$/, "");
      jsonStr += "]";
      return JSON.parse(jsonStr);
    }
    throw new Error("Failed to parse JSON from response");
  }
}

export function extractJSONObject<T = unknown>(text: string): T {
  let cleaned = text
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");

  cleaned = cleaned.replace(/```json\s*/g, "").replace(/```\s*/g, "");

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in response");
  }

  const jsonStr = cleaned.substring(start, end + 1);
  return JSON.parse(jsonStr);
}

export function formatCurrency(value: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(
    value
  );
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}
