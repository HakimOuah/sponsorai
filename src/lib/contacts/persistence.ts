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

function providerFromSource(source: string): string {
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
  candidates: ContactCandidate[]
): Promise<PublicContactSummary[]> {
  const summaries: PublicContactSummary[] = [];
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error("Company not found");

  for (const candidate of candidates.slice(0, 3)) {
    const provider = providerFromSource(candidate.source);
    const roleNormalized = normalizeContactRole(candidate.role);
    const relevance = Math.min(100, getContactRelevance(candidate.role) * 30 + 10);
    const contactability = candidate.email && isUsableEmailStatus(candidate.email_status)
      ? candidate.email_status
      : "missing";
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

    const existing = await prisma.contact.findFirst({
      where: candidate.providerExternalId
        ? {
            provider,
            providerExternalId: candidate.providerExternalId,
          }
        : {
            companyId,
            provider,
            fullName: { equals: candidate.name, mode: "insensitive" },
          },
    });

    const contact = existing
      ? await prisma.contact.update({
          where: { id: existing.id },
          data: {
            companyId,
            roleRaw: candidate.role,
            roleNormalized,
            providerExternalId:
              candidate.providerExternalId || existing.providerExternalId,
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
            providerExternalId: candidate.providerExternalId || null,
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

    if (!currentEmployment) {
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
      await prisma.contactEmail.upsert({
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
      });
    }

    await prisma.evidence.create({
      data: {
        companyId,
        contactId: contact.id,
        evidenceType: "employment",
        claim: candidate.evidence,
        sourceName: candidate.source,
        sourceUrl: candidateSourceUrl(candidate),
        confidence: employmentConfidence(candidate.confidence),
      },
    });

    summaries.push({
      id: contact.id,
      role: contact.roleRaw,
      roleNormalized: contact.roleNormalized,
      currentRoleVerified: contact.employmentStatus === "verified_current",
      contactability: contact.contactability as PublicContactSummary["contactability"],
      relevance: contact.relevanceScore,
      score: contact.contactScore,
      scoreVersion: contact.contactScoreVersion,
      source: contact.source,
    });
  }

  return summaries.sort((a, b) => (b.score || 0) - (a.score || 0));
}

export async function getPublicContactsForCompany(
  companyId: string
): Promise<PublicContactSummary[]> {
  const contacts = await prisma.contact.findMany({
    where: { companyId, active: true },
    orderBy: [{ contactScore: "desc" }, { relevanceScore: "desc" }],
  });

  return contacts.map((contact) => ({
    id: contact.id,
    role: contact.roleRaw,
    roleNormalized: contact.roleNormalized,
    currentRoleVerified: contact.employmentStatus === "verified_current",
    contactability: contact.contactability as PublicContactSummary["contactability"],
    relevance: contact.relevanceScore,
    score: contact.contactScore,
    scoreVersion: contact.contactScoreVersion,
    source: contact.source,
  }));
}
