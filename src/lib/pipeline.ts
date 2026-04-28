import type { DealStage, ProspectStatus } from "@/types";

export const DEAL_STAGES = [
  "lead",
  "contacted",
  "meeting",
  "negotiation",
  "offer",
  "signed",
  "lost",
] as const satisfies readonly DealStage[];

export const PROSPECT_STATUSES = [
  "new",
  "contacted",
  "replied",
  "meeting",
  "offer",
  "signed",
  "lost",
] as const satisfies readonly ProspectStatus[];

export function isDealStage(stage: string): stage is DealStage {
  return DEAL_STAGES.includes(stage as DealStage);
}

export function isProspectStatus(status: string): status is ProspectStatus {
  return PROSPECT_STATUSES.includes(status as ProspectStatus);
}

export function prospectStatusForDealStage(stage: DealStage): ProspectStatus {
  const statusMap: Record<DealStage, ProspectStatus> = {
    lead: "new",
    contacted: "contacted",
    meeting: "meeting",
    negotiation: "meeting",
    offer: "offer",
    signed: "signed",
    lost: "lost",
  };

  return statusMap[stage];
}
