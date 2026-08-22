"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { recordLearningEvent } from "@/lib/learning/events";
import { ensureSponsorAIAttribution, ensureSuccessFeeRecord } from "@/lib/deals/attribution";
import { requireOperationalAccess } from "@/lib/auth/access";

export async function getDealWorkspace(dealId: string) {
  return prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      player: { select: { id: true, firstName: true, lastName: true, club: true } },
      company: { select: { id: true, name: true, sector: true } },
      prospect: {
        select: {
          id: true,
          score: true,
          priority: true,
          rationale: true,
          outreachApprovedAt: true,
        },
      },
      meetings: { orderBy: { scheduledAt: "desc" } },
      proposals: { orderBy: { createdAt: "desc" } },
      contracts: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { occurredAt: "desc" }, take: 100 },
      attribution: true,
      successFee: true,
    },
  });
}

export async function createMeeting(input: {
  dealId: string;
  scheduledAt: string;
  externalUrl?: string;
  notes?: string;
}) {
  await requireOperationalAccess();
  const deal = await prisma.deal.findUnique({ where: { id: input.dealId } });
  if (!deal) throw new Error("Deal not found");
  const scheduledAt = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) throw new Error("Invalid meeting date");

  const meeting = await prisma.$transaction(async (tx) => {
    const created = await tx.meeting.create({
      data: {
        dealId: deal.id,
        playerId: deal.playerId,
        scheduledAt,
        externalUrl: input.externalUrl || null,
        notes: input.notes || null,
      },
    });
    await tx.deal.update({
      where: { id: deal.id },
      data: { stage: "meeting", nextAction: "Préparer le meeting", nextActionDate: scheduledAt },
    });
    await tx.prospect.update({ where: { id: deal.prospectId }, data: { status: "meeting" } });
    await tx.dealEvent.create({
      data: {
        dealId: deal.id,
        type: "MEETING_BOOKED",
        source: "manual",
        immutableKey: `meeting:${created.id}:booked`,
        data: { meetingId: created.id, external: Boolean(input.externalUrl) },
      },
    });
    return created;
  });

  await ensureSponsorAIAttribution(deal.id);
  await recordLearningEvent({
    type: "MEETING_BOOKED",
    idempotencyKey: `meeting:${meeting.id}:booked`,
    dealId: deal.id,
    prospectId: deal.prospectId,
  });
  revalidateDeal(deal.id);
}

export async function completeMeeting(input: {
  meetingId: string;
  outcome: string;
  notes?: string;
}) {
  await requireOperationalAccess();
  const meeting = await prisma.meeting.update({
    where: { id: input.meetingId },
    data: {
      status: "completed",
      completedAt: new Date(),
      outcome: input.outcome,
      notes: input.notes || undefined,
    },
    include: { deal: true },
  });
  await prisma.dealEvent.create({
    data: {
      dealId: meeting.dealId,
      type: "MEETING_COMPLETED",
      source: "manual",
      immutableKey: `meeting:${meeting.id}:completed`,
      data: { meetingId: meeting.id, outcome: input.outcome },
    },
  });
  await recordLearningEvent({
    type: "MEETING_COMPLETED",
    idempotencyKey: `meeting:${meeting.id}:completed`,
    dealId: meeting.dealId,
    prospectId: meeting.deal.prospectId,
    extraContext: { meetingOutcome: input.outcome },
  });
  revalidateDeal(meeting.dealId);
}

export async function createProposal(input: {
  dealId: string;
  amount?: number;
  currency?: string;
  summary?: string;
  externalUrl?: string;
}) {
  await requireOperationalAccess();
  const deal = await prisma.deal.findUnique({ where: { id: input.dealId } });
  if (!deal) throw new Error("Deal not found");
  const sentAt = new Date();

  const proposal = await prisma.$transaction(async (tx) => {
    const created = await tx.proposal.create({
      data: {
        dealId: deal.id,
        playerId: deal.playerId,
        status: "sent",
        amount: input.amount ?? null,
        currency: input.currency || deal.currency,
        summary: input.summary || null,
        externalUrl: input.externalUrl || null,
        sentAt,
      },
    });
    await tx.deal.update({
      where: { id: deal.id },
      data: {
        stage: "offer",
        value: input.amount ?? deal.value,
        nextAction: "Suivre la proposition",
      },
    });
    await tx.prospect.update({ where: { id: deal.prospectId }, data: { status: "offer" } });
    await tx.dealEvent.create({
      data: {
        dealId: deal.id,
        type: "PROPOSAL_SENT",
        source: "manual",
        immutableKey: `proposal:${created.id}:sent`,
        data: { proposalId: created.id, external: Boolean(input.externalUrl) },
      },
    });
    return created;
  });

  await recordLearningEvent({
    type: "PROPOSAL_SENT",
    idempotencyKey: `proposal:${proposal.id}:sent`,
    dealId: deal.id,
    prospectId: deal.prospectId,
    outcomeValue: input.amount,
    currency: input.currency || deal.currency,
  });
  revalidateDeal(deal.id);
}

export async function createContract(input: {
  dealId: string;
  title: string;
  externalUrl?: string;
  expiresAt?: string;
}) {
  await requireOperationalAccess();
  const deal = await prisma.deal.findUnique({ where: { id: input.dealId } });
  if (!deal) throw new Error("Deal not found");
  const sentAt = new Date();
  const contract = await prisma.contract.create({
    data: {
      dealId: deal.id,
      playerId: deal.playerId,
      title: input.title,
      status: "sent",
      externalUrl: input.externalUrl || null,
      sentAt,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    },
  });
  await prisma.dealEvent.create({
    data: {
      dealId: deal.id,
      type: "CONTRACT_SENT",
      source: "manual",
      immutableKey: `contract:${contract.id}:sent`,
      data: { contractId: contract.id, external: Boolean(input.externalUrl) },
    },
  });
  await recordLearningEvent({
    type: "CONTRACT_SENT",
    idempotencyKey: `contract:${contract.id}:sent`,
    dealId: deal.id,
    prospectId: deal.prospectId,
  });
  revalidateDeal(deal.id);
}

export async function markContractSigned(contractId: string) {
  await requireOperationalAccess();
  const signedAt = new Date();
  const contract = await prisma.contract.update({
    where: { id: contractId },
    data: { status: "signed", signedAt },
    include: { deal: true },
  });

  await prisma.$transaction([
    prisma.deal.update({
      where: { id: contract.dealId },
      data: { stage: "signed", closedAt: signedAt },
    }),
    prisma.prospect.update({
      where: { id: contract.deal.prospectId },
      data: { status: "signed" },
    }),
    prisma.dealEvent.create({
      data: {
        dealId: contract.dealId,
        type: "SIGNED",
        source: "manual",
        immutableKey: `contract:${contract.id}:signed`,
        data: { contractId: contract.id } as Prisma.InputJsonValue,
      },
    }),
  ]);

  await ensureSponsorAIAttribution(contract.dealId);
  await ensureSuccessFeeRecord(contract.dealId);
  await recordLearningEvent({
    type: "SIGNED",
    idempotencyKey: `contract:${contract.id}:signed`,
    dealId: contract.dealId,
    prospectId: contract.deal.prospectId,
    outcomeValue: contract.deal.value,
    currency: contract.deal.currency,
  });
  revalidateDeal(contract.dealId);
}

function revalidateDeal(dealId: string) {
  revalidatePath("/pipeline");
  revalidatePath(`/pipeline/${dealId}`);
  revalidatePath("/analytics");
}
