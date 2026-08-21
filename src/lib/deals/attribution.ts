import { prisma } from "@/lib/prisma";

export async function ensureSponsorAIAttribution(dealId: string) {
  const existing = await prisma.attributionRecord.findUnique({ where: { dealId } });
  if (existing) return existing;

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { prospect: true },
  });
  if (!deal) throw new Error("Deal not found");

  return prisma.attributionRecord.create({
    data: {
      dealId,
      prospectId: deal.prospectId,
      source: deal.origin,
      initiatedBySponsorAI: deal.origin === "sponsorai",
      immutableKey: `deal:${dealId}:origin:${deal.origin}`,
      firstTouchAt: deal.prospect.createdAt,
      metadata: {
        playerId: deal.playerId,
        companyId: deal.companyId,
        prospectId: deal.prospectId,
      },
    },
  });
}

export async function ensureSuccessFeeRecord(dealId: string) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { attribution: true },
  });
  if (!deal || !deal.successFeeEligible) return null;

  return prisma.successFeeRecord.upsert({
    where: { dealId },
    update: {
      status: "pending_review",
      basisAmount: deal.value,
      currency: deal.currency,
    },
    create: {
      dealId,
      attributionRecordId: deal.attribution?.id || null,
      status: "pending_review",
      basisAmount: deal.value,
      currency: deal.currency,
    },
  });
}
