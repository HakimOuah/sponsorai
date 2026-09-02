import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  calculateStaticContactScore,
  getContactRelevance,
  isUsableEmailStatus,
  normalizeContactRole,
} from "@/lib/agents/contact-quality";
import { calculateContextualContactScore } from "@/lib/learning/stats";
import type { ContactCandidate, PublicContactSummary } from "./types";
import { visibleContact } from "./visibility";

function providerFromSource(source: string): string {
  if (source.toLowerCase().includes("monid")) return "monid";
  return source.toLowerCase().includes("apollo") ? "apollo" : "web_search";
}

function emailHash(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

function employmentConfidence(confidence: ContactCandidate["confidence"]): number {
  if (confidence === "high") return 0.95;
  if (confidence === "medium") return 0.75;
  return 0.4;
}

function candidateSourceUrl(candidate: ContactCandidate): string | null {
  if (candidate.linkedin) return candidate.linkedin;

  try {
    const url = new URL(candidate.source);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export async function persistContactCandidates(
  companyId: string,
  candidates: ContactCandidate[],
  options: { includePrivate?: boolean; rejectedEmails?: string[] } = {},
): Promise<PublicContactSummary[]> {
  const summaries: PublicContactSummary[] = [];
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error("Company not found");

  if (options.rejectedEmails?.length) {
    await prisma.contactEmail.updateMany({
      where: { contact: { companyId }, email: { in: options.rejectedEmails } },
      data: { status: "unverified", isPrimary: false },
    });
    await prisma.contact.updateMany({
      where: {
        companyId,
        contactEmails: { none: { status: { in: ["verified", "public_source"] } } },
      },
      data: { contactability: "missing" },
    });
  }

  for (const candidate of candidates.slice(0, 3)) {
    const provider = candidate.provider || providerFromSource(candidate.source);
    const roleNormalized = candidate.kind === "company_mailbox" ? "COMPANY_MAILBOX" : normalizeContactRole(candidate.role);
    const externalId = candidate.providerExternalId
      ? candidate.providerExternalId.startsWith(`${companyId}:`)
        ? candidate.providerExternalId
        : `${companyId}:${candidate.providerExternalId}`
      : null;
    const existing = await prisma.contact.findFirst({
      where: {
        companyId,
        OR: [
          ...(externalId ? [{ provider, providerExternalId: { in: [externalId, candidate.providerExternalId!] } }] : []),
          ...(candidate.linkedin ? [{ sourceUrl: candidate.linkedin }] : []),
          { fullName: { equals: candidate.name, mode: "insensitive" } },
        ],
      },
      include: {
        contactEmails: {
          where: { status: { in: ["verified", "public_source"] } },
          orderBy: [{ isPrimary: "desc" }, { verifiedAt: "desc" }],
          take: 1,
        },
      },
    });
    // A lookup without a result must not erase an already qualified address.
    // Explicitly rejected addresses were invalidated above, before this read.
    const primaryEmail = candidate.email && isUsableEmailStatus(candidate.email_status)
      ? {
          email: candidate.email.trim().toLowerCase(),
          status: candidate.email_status,
          source: candidate.email_source || candidate.source,
          evidence: candidate.email_evidence || null,
        }
      : existing?.contactEmails[0];
    const relevance = Math.min(100, getContactRelevance(candidate.role) * 30 + 10);
    const contactability = primaryEmail?.status || "missing";
    const staticScore = calculateStaticContactScore({
      role: candidate.role,
      contactability,
      employmentConfidence: employmentConfidence(candidate.confidence),
    });
    const historicalStat = await prisma.rolePerformanceStat.findFirst({
      where: {
        roleNormalized,
        sector: company.sector || "unknown",
        companySizeBucket: company.companySizeBucket,
        sport: "football",
        country: company.country || "unknown",
      },
      orderBy: [{ attempts: "desc" }, { contextualUtility: "desc" }],
    });
    const score = calculateContextualContactScore(
      staticScore,
      historicalStat?.contextualUtility || 0
    );

    const contact = existing
      ? await prisma.contact.update({
          where: { id: existing.id },
          data: {
            companyId,
            fullName: candidate.name,
            provider,
            roleRaw: candidate.role,
            roleNormalized,
            providerExternalId:
              externalId || (provider === existing.provider ? existing.providerExternalId : null),
            employmentStatus: candidate.verification_status,
            employmentConfidence: employmentConfidence(candidate.confidence),
            relevanceScore: relevance,
            contactScore: score,
            contactScoreVersion: "contact-score-v2-contextual",
            contactability,
            source: candidate.source,
            sourceUrl: candidateSourceUrl(candidate),
            active: candidate.current_at_company,
          },
        })
      : await prisma.contact.create({
          data: {
            companyId,
            fullName: candidate.name,
            roleRaw: candidate.role,
            roleNormalized,
            provider,
            providerExternalId: externalId,
            employmentStatus: candidate.verification_status,
            employmentConfidence: employmentConfidence(candidate.confidence),
            relevanceScore: relevance,
            contactScore: score,
            contactScoreVersion: "contact-score-v2-contextual",
            contactability,
            source: candidate.source,
            sourceUrl: candidateSourceUrl(candidate),
            active: candidate.current_at_company,
          },
        });

    const currentEmployment = await prisma.employment.findFirst({
      where: {
        contactId: contact.id,
        companyId,
        status: "current",
        titleRaw: candidate.role,
      },
    });

    if (!currentEmployment && candidate.kind !== "company_mailbox") {
      await prisma.employment.create({
        data: {
          contactId: contact.id,
          companyId,
          titleRaw: candidate.role,
          titleNormalized: roleNormalized,
          status: "current",
          confidence: employmentConfidence(candidate.confidence),
          sourceUrl: candidateSourceUrl(candidate),
        },
      });
    }

    if (candidate.email && isUsableEmailStatus(candidate.email_status)) {
      const hash = emailHash(candidate.email);
      await prisma.$transaction([
        prisma.contactEmail.updateMany({
          where: { contactId: contact.id, emailHash: { not: hash }, isPrimary: true },
          data: { isPrimary: false },
        }),
        prisma.contactEmail.upsert({
          where: {
            contactId_emailHash: { contactId: contact.id, emailHash: hash },
          },
          update: {
            status: candidate.email_status,
            source: candidate.email_source || candidate.source,
            evidence: candidate.email_evidence || null,
            isPrimary: true,
            verifiedAt: candidate.email_status === "verified" ? new Date() : null,
          },
          create: {
            contactId: contact.id,
            email: candidate.email.trim().toLowerCase(),
            emailHash: hash,
            status: candidate.email_status,
            source: candidate.email_source || candidate.source,
            evidence: candidate.email_evidence || null,
            isPrimary: true,
            verifiedAt: candidate.email_status === "verified" ? new Date() : null,
          },
        }),
      ]);
    }

    await prisma.evidence.create({
      data: {
        companyId,
        contactId: contact.id,
        evidenceType: candidate.kind === "company_mailbox" ? "company_mailbox" : "employment",
        claim: candidate.evidence,
        sourceName: candidate.source,
        sourceUrl: candidateSourceUrl(candidate),
        confidence: employmentConfidence(candidate.confidence),
      },
    });

    summaries.push(visibleContact({
      id: contact.id,
      kind: candidate.kind || "person",
      name: options.includePrivate ? contact.fullName : null,
      role: contact.roleRaw,
      roleNormalized: contact.roleNormalized,
      currentRoleVerified: contact.employmentStatus === "verified_current",
      contactability: contact.contactability as PublicContactSummary["contactability"],
      relevance: contact.relevanceScore,
      score: contact.contactScore,
      scoreVersion: contact.contactScoreVersion,
      source: contact.source,
      profileSource: contact.sourceUrl,
      email: options.includePrivate ? primaryEmail?.email || null : null,
      emailStatus: options.includePrivate ? (primaryEmail?.status as PublicContactSummary["emailStatus"]) || null : null,
      emailSource: options.includePrivate
        ? primaryEmail?.source || null
        : null,
      emailEvidence: options.includePrivate
        ? primaryEmail?.evidence || null
        : null,
      emailKind: options.includePrivate
        ? classifyEmailKind(primaryEmail?.email, primaryEmail?.evidence)
        : undefined,
    }, options.includePrivate === true));
  }

  return summaries.sort((a, b) => (b.score || 0) - (a.score || 0));
}

export async function getPublicContactsForCompany(
  companyId: string,
  options: { includePrivate?: boolean } = {},
): Promise<PublicContactSummary[]> {
  const contacts = await prisma.contact.findMany({
    where: { companyId, active: true },
    orderBy: [{ contactScore: "desc" }, { relevanceScore: "desc" }],
    include: {
      contactEmails: {
        where: { status: { in: ["verified", "public_source"] } },
        orderBy: [{ isPrimary: "desc" }, { verifiedAt: "desc" }],
        take: 1,
      },
    },
  });

  return contacts.map((contact) => {
    const primaryEmail = contact.contactEmails[0];

    return visibleContact({
      id: contact.id,
      kind: contact.roleNormalized === "COMPANY_MAILBOX" ? "company_mailbox" : "person",
      name: options.includePrivate ? contact.fullName : null,
      role: contact.roleRaw,
      roleNormalized: contact.roleNormalized,
      currentRoleVerified: contact.employmentStatus === "verified_current",
      contactability: primaryEmail
        ? primaryEmail.status as PublicContactSummary["contactability"]
        : "missing",
      relevance: contact.relevanceScore,
      score: contact.contactScore,
      scoreVersion: contact.contactScoreVersion,
      source: contact.source,
      profileSource: contact.sourceUrl,
      email: options.includePrivate ? primaryEmail?.email || null : null,
      emailStatus: options.includePrivate
        ? (primaryEmail?.status as PublicContactSummary["emailStatus"]) || null
        : null,
      emailSource: options.includePrivate ? primaryEmail?.source || null : null,
      emailEvidence: options.includePrivate
        ? primaryEmail?.evidence || null
        : null,
      emailKind: options.includePrivate
        ? classifyEmailKind(primaryEmail?.email, primaryEmail?.evidence)
        : undefined,
    }, options.includePrivate === true);
  });
}

function classifyEmailKind(
  email?: string | null,
  evidence?: string | null,
): "personal_professional" | "functional_generic" | "unknown" {
  if (!email) return "unknown";
  if (evidence?.toLowerCase().includes("boîte fonctionnelle")) {
    return "functional_generic";
  }

  const localPart = email.split("@")[0]?.toLowerCase() || "";
  const functionalPrefixes = [
    "contact",
    "info",
    "hello",
    "marketing",
    "communication",
    "communications",
    "partnerships",
    "partenariats",
    "sponsoring",
    "sponsorship",
    "press",
    "presse",
    "media",
  ];

  return functionalPrefixes.some(
    (prefix) => localPart === prefix || localPart.startsWith(`${prefix}.`),
  )
    ? "functional_generic"
    : "personal_professional";
}
