import type { getProspects } from "@/lib/actions/prospection";

export type ProspectionProspect = Awaited<
  ReturnType<typeof getProspects>
>[number];
export type ProspectionView = "ready" | "incomplete" | "all";
