import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const LEARNING_EVENT_TYPES = [
  "BRAND_MATCHED",
  "BRAND_FEEDBACK",
  "CONTACT_SELECTED",
  "CONTACT_FEEDBACK",
  "OUTREACH_APPROVED",
  "EMAIL_SENT",
  "DELIVERED",
  "OPENED",
  "BOUNCED",
  "REPLIED",
  "POSITIVE_REPLY",
  "NEGATIVE_REPLY",
  "MEETING_BOOKED",
  "MEETING_COMPLETED",
  "PROPOSAL_SENT",
  "NEGOTIATION_STARTED",
  "CONTRACT_SENT",
  "SIGNED",
  "LOST",
] as const;

export type LearningEventType = (typeof LEARNING_EVENT_TYPES)[number];

export interface RecordLearningEventInput {
  type: LearningEventType;
  idempotencyKey: string;
  prospectId?: string | null;
  emailId?: string | null;
  dealId?: string | null;
  contactId?: string | null;
  occurredAt?: Date;
  outcomeValue?: number | null;
  currency?: string | null;
  extraContext?: Record<string, unknown>;
}

async function resolveProspectId(input: RecordLearningEventInput) {
  if (input.prospectId) return input.prospectId;

  if (input.emailId) {
    const email = await prisma.email.findUnique({
      where: { id: input.emailId },
      select: { prospectId: true },
    });
    if (email?.prospectId) return email.prospectId;
  }

  if (input.dealId) {
    const deal = await prisma.deal.findUnique({
      where: { id: input.dealId },
      select: { prospectId: true },
    });
    if (deal?.prospectId) return deal.prospectId;
  }

  return null;
}

export async function recordLearningEvent(input: RecordLearningEventInput) {
  const existing = await prisma.learningEvent.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) return existing;

  const prospectId = await resolveProspectId(input);
  const prospect = prospectId
    ? await prisma.prospect.findUnique({
        where: { id: prospectId },
        include: {
          player: true,
          company: true,
          selectedContact: true,
          scan: { select: { matchmakerVersion: true } },
        },
      })
    : null;
  const email = input.emailId
    ? await prisma.email.findUnique({ where: { id: input.emailId } })
    : null;
  const deal = input.dealId
    ? await prisma.deal.findUnique({ where: { id: input.dealId } })
    : null;
  const contact = input.contactId
    ? await prisma.contact.findUnique({ where: { id: input.contactId } })
    : prospect?.selectedContact || null;

  const audienceSize = prospect
    ? Math.max(
        prospect.player.followersIG || 0,
        prospect.player.followersTK || 0,
        prospect.player.followersX || 0
      ) || null
    : null;
  const context = JSON.parse(JSON.stringify({
    athlete: prospect
      ? {
          id: prospect.player.id,
          profileType: prospect.player.profileType,
          sport: prospect.player.sport || "football",
          club: prospect.player.club,
          league: prospect.player.league,
          audienceSize,
        }
      : null,
    brand: prospect
      ? {
          companyId: prospect.company.id,
          name: prospect.company.name,
          sector: prospect.company.sector,
          country: prospect.company.country,
          employeeCount: prospect.company.employeeCount,
          companySizeBucket: prospect.company.companySizeBucket,
        }
      : null,
    contact: contact
      ? {
          id: contact.id,
          roleRaw: contact.roleRaw,
          roleNormalized: contact.roleNormalized,
          contactability: contact.contactability,
          score: contact.contactScore,
          scoreVersion: contact.contactScoreVersion,
        }
      : null,
    decision: prospect
      ? {
          brandScore: prospect.score,
          scoreVersion: prospect.scoreVersion,
          matchmakerVersion: prospect.scan?.matchmakerVersion,
          priority: prospect.priority,
        }
      : null,
    email: email
      ? {
          id: email.id,
          type: email.type,
          templateVersion: email.templateVersion,
          provider: email.provider,
        }
      : null,
    deal: deal
      ? {
          id: deal.id,
          stage: deal.stage,
          value: deal.value,
          currency: deal.currency,
          origin: deal.origin,
        }
      : null,
    ...(input.extraContext || {}),
  })) as Prisma.InputJsonValue;

  return prisma.learningEvent.create({
    data: {
      idempotencyKey: input.idempotencyKey,
      type: input.type,
      prospectId,
      playerId: prospect?.playerId || null,
      companyId: prospect?.companyId || null,
      contactId: contact?.id || null,
      emailId: input.emailId || null,
      dealId: input.dealId || null,
      roleRaw: contact?.roleRaw || null,
      roleNormalized: contact?.roleNormalized || null,
      sector: prospect?.company.sector || null,
      country: prospect?.company.country || null,
      companySizeBucket: prospect?.company.companySizeBucket || "unknown",
      sport: prospect?.player.sport || "football",
      audienceSize,
      brandScore: prospect?.score || null,
      contactScore: contact?.contactScore || null,
      scoreVersion: contact?.contactScoreVersion || prospect?.scoreVersion || null,
      templateVersion: email?.templateVersion || null,
      matchmakerVersion: prospect?.scan?.matchmakerVersion || null,
      outcomeValue: input.outcomeValue ?? deal?.value ?? null,
      currency: input.currency || deal?.currency || null,
      context,
      occurredAt: input.occurredAt || new Date(),
    },
  });
}
