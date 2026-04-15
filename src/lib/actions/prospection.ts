"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProspects(playerId?: string) {
  return prisma.prospect.findMany({
    where: playerId ? { playerId } : undefined,
    include: {
      player: { select: { firstName: true, lastName: true, club: true } },
      company: { select: { id: true, name: true, sector: true, country: true, contactEmail: true } },
      deal: { select: { id: true, stage: true } },
      emails: {
        where: { status: { in: ["sent", "opened"] } },
        orderBy: { sentAt: "desc" },
        take: 1,
        select: { sentAt: true, status: true },
      },
    },
    orderBy: { score: "desc" },
  });
}

export async function getScansForPlayer(playerId: string) {
  return prisma.scan.findMany({
    where: { playerId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { prospects: true } },
    },
  });
}

export async function bulkCreateDeals(prospectIds: string[]) {
  let created = 0;

  for (const id of prospectIds) {
    const prospect = await prisma.prospect.findUnique({
      where: { id },
      include: { deal: true },
    });

    if (!prospect || prospect.deal) continue;

    await prisma.deal.create({
      data: {
        playerId: prospect.playerId,
        companyId: prospect.companyId,
        prospectId: prospect.id,
        stage: "lead",
        dealType: prospect.partnershipType,
      },
    });

    await prisma.prospect.update({
      where: { id },
      data: { status: "new" },
    });

    created++;
  }

  await prisma.activityLog.create({
    data: {
      type: "deal_updated",
      message: `${created} deals créés en bulk depuis la prospection`,
      metadata: { prospectIds, created },
    },
  });

  revalidatePath("/prospection");
  revalidatePath("/pipeline");

  return created;
}

export async function updateProspectStatus(id: string, status: string) {
  await prisma.prospect.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/prospection");
}
