export type ContactEmailStatus =
  | "verified"
  | "public_source"
  | "guessed"
  | "missing";

export interface ContactCandidate {
  name: string;
  role: string;
  email: string | null;
  email_status: ContactEmailStatus;
  email_evidence?: string | null;
  email_pattern?: string | null;
  email_candidates?: string[];
  linkedin: string | null;
  confidence: "high" | "medium" | "low";
  verification_status:
    | "verified_current"
    | "unverified"
    | "past_or_wrong_company";
  current_at_company: boolean;
  role_relevance?: "high" | "medium" | "low";
  evidence: string;
  source: string;
  providerExternalId?: string | null;
}

export interface PublicContactSummary {
  id: string;
  role: string;
  roleNormalized: string;
  currentRoleVerified: boolean;
  contactability: ContactEmailStatus;
  relevance: number;
  score: number | null;
  scoreVersion: string;
  source: string | null;
}
