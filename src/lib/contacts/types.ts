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
  email_source?: string | null;
  email_kind?:
    | "personal_professional"
    | "functional_generic"
    | "unknown";
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

export type ContactDiscoveryStage =
  | "people_search"
  | "email_enrichment"
  | "public_web_search";

export type ContactDiscoveryStatus =
  | "success"
  | "partial"
  | "no_result"
  | "failed";

export interface ContactDiscoveryDiagnostic {
  provider: "apollo" | "web_search";
  stage: ContactDiscoveryStage;
  status: ContactDiscoveryStatus;
  message: string;
  requested?: number;
  matched?: number;
  usableEmails?: number;
  creditsConsumed?: number | null;
}

export interface ContactProviderSearchResult {
  contacts: ContactCandidate[];
  diagnostics: ContactDiscoveryDiagnostic[];
}

export interface PublicContactSummary {
  id: string;
  name?: string | null;
  role: string;
  roleNormalized: string;
  currentRoleVerified: boolean;
  contactability: ContactEmailStatus;
  relevance: number;
  score: number | null;
  scoreVersion: string;
  source: string | null;
  email?: string | null;
  emailStatus?: ContactEmailStatus | null;
  emailSource?: string | null;
  emailEvidence?: string | null;
  emailKind?: "personal_professional" | "functional_generic" | "unknown";
}
