import {
  canDraftForContact,
  getContactRelevance,
  isBusinessEmailForCompany,
  isUsableEmailStatus,
} from "@/lib/agents/contact-quality";

export const CONTACT_READINESS_FRESHNESS_DAYS = 30;
const NAMED_WORD = new RegExp("\\p{L}{2}", "u");

type ObservedDate = Date | string | null;

export interface ContactReadinessEmail {
  id: string;
  email: string;
  status: string;
  source?: string | null;
  evidence?: string | null;
  isPrimary?: boolean;
  verifiedAt: ObservedDate;
  updatedAt?: ObservedDate;
}

/** Private database input. Only the allowlisted summary may leave the server. */
export interface ContactForReadiness {
  id: string;
  fullName: string;
  roleRaw: string;
  roleNormalized: string;
  active: boolean;
  employmentStatus: string;
  updatedAt: ObservedDate;
  sourceUrl?: string | null;
  contactScore?: number | null;
  relevanceScore?: number | null;
  /** Most recent bounced outbound Email.updatedAt for this contact, if any. */
  lastBouncedAt?: ObservedDate;
  contactEmails: readonly ContactReadinessEmail[];
}

export type ContactReadinessReason =
  | "no_contacts"
  | "inactive_contact"
  | "employment_unverified"
  | "contact_stale"
  | "irrelevant_contact"
  | "identity_missing"
  | "email_missing"
  | "email_unverified"
  | "email_stale"
  | "email_bounced"
  | "email_not_business"
  | "generic_unattributed";

export interface ContactReadinessSummary {
  status: "ready_person" | "ready_generic" | "incomplete";
  bestContactId: string | null;
  recipientKind: "personal_professional" | "functional_generic" | null;
  readyPersonCount: number;
  readyGenericCount: number;
  incompleteCount: number;
  reason: ContactReadinessReason | null;
  /** Technical email verification date, never inferred from a record edit. */
  checkedAt: string | null;
}

interface ReadinessOptions {
  now?: Date | number;
  freshnessDays?: number;
}

type Evaluation = {
  contact: ContactForReadiness;
  status: ContactReadinessSummary["status"];
  reason: ContactReadinessReason | null;
  verifiedAt: number | null;
};

/**
 * A ready result is stricter than manual drafting: a public-source email still
 * needs a recent technical check. This never grants sending authorization.
 * Contact.updatedAt is the existing persistence timestamp refreshed when its
 * current employment is checked; email freshness always uses verifiedAt.
 */
export function getContactReadiness(
  contacts: readonly ContactForReadiness[],
  options: ReadinessOptions = {},
): ContactReadinessSummary {
  const now = options.now instanceof Date ? options.now.getTime() : options.now ?? Date.now();
  const freshnessDays = options.freshnessDays ?? CONTACT_READINESS_FRESHNESS_DAYS;
  if (!Number.isFinite(now) || !Number.isFinite(freshnessDays) || freshnessDays <= 0) {
    throw new RangeError("Contact readiness requires a valid date and a positive freshness window");
  }
  const oldest = now - freshnessDays * 86_400_000;
  const evaluated = contacts.map((contact) => evaluateContact(contact, oldest, now));
  const ready = evaluated.filter((entry) => entry.status !== "incomplete").sort(compareCandidates);
  const best = ready[0];
  const incomplete = evaluated.filter((entry) => entry.status === "incomplete");

  // Do not spread database objects here: names, coordinates and evidence must
  // remain private, including for non-admin callers of server actions/SSE.
  return {
    status: best?.status || "incomplete",
    bestContactId: best?.contact.id || null,
    recipientKind: best ? best.status === "ready_person" ? "personal_professional" : "functional_generic" : null,
    readyPersonCount: evaluated.filter((entry) => entry.status === "ready_person").length,
    readyGenericCount: evaluated.filter((entry) => entry.status === "ready_generic").length,
    incompleteCount: incomplete.length,
    reason: best ? null : incomplete.sort(compareCandidates)[0]?.reason || "no_contacts",
    checkedAt: best?.verifiedAt != null ? new Date(best.verifiedAt).toISOString() : null,
  };
}

function evaluateContact(contact: ContactForReadiness, oldest: number, now: number): Evaluation {
  const incomplete = (reason: ContactReadinessReason): Evaluation => ({ contact, status: "incomplete", reason, verifiedAt: null });
  if (!contact.active) return incomplete("inactive_contact");
  if (!canDraftForContact(contact)) return incomplete("employment_unverified");
  if (!isFresh(contact.updatedAt, oldest, now)) return incomplete("contact_stale");

  // Mirror the Rédacteur's effective recipient: a primary public/stale address
  // must not be concealed by a secondary verified address in a readiness badge.
  const email = [...contact.contactEmails]
    .filter((item) => isUsableEmailStatus(item.status))
    .sort(compareEmails)[0];
  if (!email) return incomplete(contact.contactEmails.some((item) => item.email.trim()) ? "email_unverified" : "email_missing");
  if (!email.email.trim()) return incomplete("email_missing");
  if (email.status !== "verified") return incomplete("email_unverified");
  if (!isFresh(email.verifiedAt, oldest, now)) return incomplete("email_stale");
  const verifiedAt = timestamp(email.verifiedAt)!;
  const lastBouncedAt = timestamp(contact.lastBouncedAt);
  if (contact.lastBouncedAt != null && (lastBouncedAt === null || lastBouncedAt >= verifiedAt)) return incomplete("email_bounced");
  const address = email.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || !isBusinessEmailForCompany(address)) return incomplete("email_not_business");

  const local = address.split("@")[0];
  if (/^(?:support|sales|service|help|hr|recruitment|jobs|careers|noreply|no-reply|admin|office)(?:[._-]|$)/i.test(local)) {
    return incomplete("irrelevant_contact");
  }
  const generic = contact.roleNormalized === "COMPANY_MAILBOX" ||
    /^(?:sponsor(?:ing|ship)?|partnerships?|partenariats?|marketing|brand|communications?|influence|press|presse|media|contact|info|hello|bonjour)(?:[._-]|$)/i.test(local) ||
    /bo[iî]te fonctionnelle/i.test(email.evidence || "");
  if (generic) {
    // Persisted service contacts are published on official pages upstream.
    // Legacy records may attach a mailbox to a person: keep the generic label
    // and require the recorded source rather than presenting it as that person.
    if (!hasOfficialMailboxSource(contact, email, address)) return incomplete("generic_unattributed");
    return { contact, status: "ready_generic", reason: null, verifiedAt };
  }
  if (getContactRelevance(contact.roleRaw) < 2) return incomplete("irrelevant_contact");
  if (!hasNamedIdentity(contact.fullName, contact.roleRaw)) return incomplete("identity_missing");
  return { contact, status: "ready_person", reason: null, verifiedAt };
}

function timestamp(value: ObservedDate | undefined): number | null {
  if (value == null) return null;
  const result = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(result) ? result : null;
}

function isFresh(value: ObservedDate | undefined, oldest: number, now: number): boolean {
  const date = timestamp(value);
  return date !== null && date >= oldest && date <= now;
}

function hasNamedIdentity(name: string, role: string): boolean {
  const normalized = name.trim().replace(/\s+/g, " ").toLowerCase();
  return normalized !== role.trim().replace(/\s+/g, " ").toLowerCase() &&
    normalized.split(" ").filter((word) => NAMED_WORD.test(word)).length >= 2 &&
    !/\*|\.\.\.|…|linkedin member|anonymous|unknown|inconnu|non renseign|a identifier|à identifier|responsable|direct(?:or|eur)|head of|chief |service |contact |équipe|team /i.test(normalized);
}

function hasOfficialMailboxSource(contact: ContactForReadiness, email: ContactReadinessEmail, address: string): boolean {
  const domain = address.split("@")[1];
  return [email.source, contact.sourceUrl].some((value) => {
    try {
      const url = new URL(value || "");
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      if (!["http:", "https:"].includes(url.protocol) || !host || url.username || url.password ||
          /(^|\.)(linkedin\.com|facebook\.com|instagram\.com|twitter\.com|x\.com)$/.test(host)) return false;
      // COMPANY_MAILBOX is only assigned by the official-source discovery path,
      // which can confirm a group email domain different from its public site.
      return contact.roleNormalized === "COMPANY_MAILBOX" || host === domain || host.endsWith(`.${domain}`);
    } catch { return false; }
  });
}

function compareEmails(a: ContactReadinessEmail, b: ContactReadinessEmail): number {
  // PostgreSQL DESC puts NULL verifiedAt first, like existing Prisma readers.
  return Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)) ||
    (timestamp(b.verifiedAt) ?? Infinity) - (timestamp(a.verifiedAt) ?? Infinity) ||
    compareIds(a.id, b.id);
}

function compareCandidates(a: Evaluation, b: Evaluation): number {
  return Number(b.status === "ready_person") - Number(a.status === "ready_person") ||
    finiteScore(b.contact.contactScore) - finiteScore(a.contact.contactScore) ||
    finiteScore(b.contact.relevanceScore) - finiteScore(a.contact.relevanceScore) ||
    (b.verifiedAt ?? 0) - (a.verifiedAt ?? 0) || compareIds(a.contact.id, b.contact.id);
}

function finiteScore(value?: number | null): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function compareIds(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
