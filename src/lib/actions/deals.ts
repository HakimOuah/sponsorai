"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
  const data: Record<string, unknown> = { stage };

  if (stage === "signed" || stage === "lost") {
    data.closedAt = new Date();
  }

  await prisma.deal.update({
    where: { id: dealId },
    data,
  });

  // Sync prospect status
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { prospectId: true },
  });

  if (deal) {
    const statusMap: Record<string, string> = {
      lead: "new",
      contacted: "contacted",
      meeting: "meeting",
      negotiation: "meeting",
      offer: "offer",
      signed: "signed",
      lost: "lost",
    };
    await prisma.prospect.update({
      where: { id: deal.prospectId },
      data: { status: statusMap[stage] || "new" },
    });
  }

  await prisma.activityLog.create({
    data: {
      type: "deal_updated",
      message: `Deal déplacé vers ${stage}`,
      metadata: { dealId, stage },
    },
  });

  revalidatePath("/pipeline");
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
