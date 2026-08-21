import type { ScoredBrand } from "@/types";
import { normalizeBrandName } from "./scout-deduplication";

export interface BrandLearningContext {
  name: string;
  brandRatings: string[];
  opportunityStrengths: number[];
}

function ratingAdjustment(ratings: string[]): number {
  if (ratings.length === 0) return 0;
  const values: Record<string, number> = {
    excellent: 0.4,
    possible: 0.1,
    mauvais: -0.7,
  };
  return ratings.reduce((sum, rating) => sum + (values[rating] || 0), 0) / ratings.length;
}

function signalAdjustment(strengths: number[]): number {
  if (strengths.length === 0) return 0;
  const average = strengths.reduce((sum, value) => sum + value, 0) / strengths.length;
  return Math.max(-0.2, Math.min(0.4, (average - 0.5) * 0.8));
}

export function applyMatchmakerLearning(
  brands: ScoredBrand[],
  contexts: BrandLearningContext[]
): ScoredBrand[] {
  const contextByName = new Map(
    contexts.map((context) => [normalizeBrandName(context.name), context])
  );

  return brands
    .map((brand) => {
      const context = contextByName.get(normalizeBrandName(brand.name));
      const learningAdjustment = context
        ? ratingAdjustment(context.brandRatings) +
          signalAdjustment(context.opportunityStrengths)
        : 0;
      const score = Math.max(1, Math.min(10, Number((brand.score + learningAdjustment).toFixed(2))));
      const priority: ScoredBrand["priority"] = score >= 8 ? "A" : score >= 6 ? "B" : "C";

      return {
        ...brand,
        base_score: brand.score,
        score,
        priority,
        learning_adjustment: Number(learningAdjustment.toFixed(2)),
        score_version: "matchmaker-v2-learning-v1",
      };
    })
    .sort((a, b) => b.score - a.score);
}
