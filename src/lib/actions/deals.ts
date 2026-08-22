"use server";

import { prisma } from "@/lib/prisma";
import { isDealStage, prospectStatusForDealStage } from "@/lib/pipeline";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { recordLearningEvent } from "@/lib/learning/events";
import {
  ensureSponsorAIAttribution,
  ensureSuccessFeeRecord,
} from "@/lib/deals/attribution";
import { requireOperationalAccess } from "@/lib/auth/access";

export async function getDeals() {
  return prisma.deal.findMany({
    include: {
      player: { select: { firstName: true, lastName: true, club: true } },
      company: { select: { name: true, sector: true } },
      prospect: { select: { priority: true, score: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function updateDealStage(dealId: string, stage: string) {
  await requireOperationalAccess();
  if (!isDealStage(stage)) {
    throw new Error(`Invalid deal stage: ${stage}`);
  }

  const data: Record<string, unknown> = { stage };

  if (stage === "signed" || stage === "lost") {
    data.closedAt = new Date();
  }

  const previous = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!previous) throw new Error("Deal not found");

  const occurredAt = new Date();
  await prisma.$transaction([
    prisma.deal.update({ where: { id: dealId }, data }),
    prisma.prospect.update({
      where: { id: previous.prospectId },
      data: { status: prospectStatusForDealStage(stage) },
    }),
    prisma.dealEvent.create({
      data: {
        dealId,
        type: "STAGE_CHANGED",
        source: "manual",
        data: { from: previous.stage, to: stage } as Prisma.InputJsonValue,
        occurredAt,
      },
    }),
  ]);

  await ensureSponsorAIAttribution(dealId);

  const learningType = stage === "negotiation"
    ? "NEGOTIATION_STARTED"
    : stage === "signed"
      ? "SIGNED"
      : stage === "lost"
        ? "LOST"
        : null;
  if (learningType) {
    await recordLearningEvent({
      type: learningType,
      idempotencyKey: `deal:${dealId}:stage:${stage}:${occurredAt.toISOString()}`,
      dealId,
      prospectId: previous.prospectId,
      outcomeValue: previous.value,
      currency: previous.currency,
    });
  }
  if (stage === "signed") await ensureSuccessFeeRecord(dealId);

  await prisma.activityLog.create({
    data: {
      type: "deal_updated",
      message: `Deal déplacé vers ${stage}`,
      metadata: { dealId, stage },
    },
  });

  revalidatePath("/pipeline");
  revalidatePath(`/pipeline/${dealId}`);
}

export async function updateDeal(
  dealId: string,
  data: {
    value?: number | null;
    dealType?: string | null;
    notes?: string | null;
    nextAction?: string | null;
    nextActionDate?: string | null;
  }
) {
  await requireOperationalAccess();
  await prisma.deal.update({
    where: { id: dealId },
    data: {
      ...data,
      nextActionDate: data.nextActionDate
        ? new Date(data.nextActionDate)
        : null,
    },
  });

  revalidatePath("/pipeline");
}
