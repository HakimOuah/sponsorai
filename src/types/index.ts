export type ProspectStatus =
  | "new"
  | "contacted"
  | "replied"
  | "meeting"
  | "offer"
  | "signed"
  | "lost";

export type DealStage =
  | "lead"
  | "contacted"
  | "meeting"
  | "negotiation"
  | "offer"
  | "signed"
  | "lost";

export type EmailType =
  | "first_contact"
  | "followup_1"
  | "followup_2"
  | "reply"
  | "custom";

export type EmailStatus =
  | "draft"
  | "sent"
  | "opened"
  | "replied"
  | "bounced";

export type ScanStatus = "running" | "completed" | "failed";

export type Priority = "A" | "B" | "C";

export type ActivityType =
  | "scan_completed"
  | "email_sent"
  | "deal_updated"
  | "reply_received";

export interface ScoreDetails {
  image_coherence: number;
  audience_fit: number;
  sponsoring_history: number;
  conversion_potential: number;
  accessibility: number;
  timing: number;
  exclusivity_risk: number;
  brand_momentum: number;
}

export interface PlayerIntelligence {
  recent_stats: string;
  social_content_style: string;
  brand_affinities: string[];
  existing_partnerships: string[];
  public_image: string;
  audience_demographics: string;
  recent_news: string;
  momentum_score: number;
  key_values: string[];
}

export interface ScoutBrand {
  name: string;
  sector: string;
  country: string;
  website?: string;
  rationale: string;
  partnership_type: string;
  existing_sports_sponsoring?: string;
  estimated_budget?: string;
}

export interface ScoredBrand extends ScoutBrand {
  score: number;
  priority: Priority;
  score_details: ScoreDetails;
  recommended_approach: string;
}
