"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recordLearningEvent } from "@/lib/learning/events";
import { ensureSponsorAIAttribution } from "@/lib/deals/attribution";
import { requireOperationalAccess } from "@/lib/auth/access";

export async function getProspects(playerId?: string) {
  return prisma.prospect.findMany({
    where: playerId ? { playerId } : undefined,
    include: {
      player: { select: { firstName: true, lastName: true, club: true } },
      company: {
        select: {
          id: true,
          name: true,
          sector: true,
          country: true,
          outreachReady: true,
          contacts: {
            where: { active: true },
            orderBy: [{ contactScore: "desc" }, { relevanceScore: "desc" }],
            select: {
              id: true,
              roleRaw: true,
              roleNormalized: true,
              employmentStatus: true,
              contactability: true,
              relevanceScore: true,
              contactScore: true,
            },
          },
        },
      },
      selectedContact: {
        select: {
          id: true,
          roleRaw: true,
          roleNormalized: true,
          employmentStatus: true,
          contactability: true,
          relevanceScore: true,
          contactScore: true,
        },
      },
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

export async function approveProspectOutreach(
  prospectId: string,
  contactId?: string
) {
  await requireOperationalAccess();
  const prospect = await prisma.prospect.findUnique({
    where: { id: prospectId },
    include: { company: true },
  });

  if (!prospect) throw new Error("Prospect not found");

  if (contactId) {
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        companyId: prospect.companyId,
        active: true,
        employmentStatus: "verified_current",
        contactability: { in: ["verified", "public_source"] },
        contactEmails: {
          some: { status: { in: ["verified", "public_source"] } },
        },
      },
    });

    if (!contact) throw new Error("Selected contact is not outreach-ready");
  } else if (!prospect.company.outreachReady) {
    throw new Error("No qualified contact is available for approval");
  }

  const session = await getServerSession(authOptions);
  await prisma.prospect.update({
    where: { id: prospectId },
    data: {
      selectedContactId: contactId || null,
      outreachApprovedAt: new Date(),
      outreachApprovedBy: session?.user?.email || "manual-review",
    },
  });

  if (contactId) {
    await recordLearningEvent({
      type: "CONTACT_SELECTED",
      idempotencyKey: `prospect:${prospectId}:contact:${contactId}:selected`,
      prospectId,
      contactId,
    });
  }
  await recordLearningEvent({
    type: "OUTREACH_APPROVED",
    idempotencyKey: `prospect:${prospectId}:outreach-approved:${Date.now()}`,
    prospectId,
    contactId: contactId || null,
  });

  revalidatePath("/prospection");
  revalidatePath("/emails");
}

export async function submitProspectFeedback(
  prospectId: string,
  input: {
    brandRating?: "excellent" | "possible" | "mauvais";
    contactRating?: "excellent" | "acceptable" | "mauvais";
    notes?: string;
  }
) {
  await requireOperationalAccess();
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const feedback = await prisma.prospectFeedback.create({
    data: {
      prospectId,
      userId: userId || null,
      brandRating: input.brandRating || null,
      contactRating: input.contactRating || null,
      notes: input.notes || null,
    },
  });

  if (input.brandRating) {
    await recordLearningEvent({
      type: "BRAND_FEEDBACK",
      idempotencyKey: `feedback:${feedback.id}:brand`,
      prospectId,
      extraContext: { rating: input.brandRating },
    });
  }
  if (input.contactRating) {
    await recordLearningEvent({
      type: "CONTACT_FEEDBACK",
      idempotencyKey: `feedback:${feedback.id}:contact`,
      prospectId,
      extraContext: { rating: input.contactRating },
    });
  }

  revalidatePath("/prospection");
}

export async function revokeProspectOutreachApproval(prospectId: string) {
  await requireOperationalAccess();
  await prisma.prospect.update({
    where: { id: prospectId },
    data: {
      outreachApprovedAt: null,
      outreachApprovedBy: null,
    },
  });

  revalidatePath("/prospection");
  revalidatePath("/emails");
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
  await requireOperationalAccess();
  let created = 0;

  for (const id of prospectIds) {
    const prospect = await prisma.prospect.findUnique({
      where: { id },
      include: { deal: true },
    });

    if (!prospect || prospect.deal) continue;

    const deal = await prisma.deal.create({
      data: {
        playerId: prospect.playerId,
        companyId: prospect.companyId,
        prospectId: prospect.id,
        stage: "lead",
        dealType: prospect.partnershipType,
      },
    });

    await ensureSponsorAIAttribution(deal.id);
    await prisma.dealEvent.create({
      data: {
        dealId: deal.id,
        type: "DEAL_CREATED",
        source: "sponsorai",
        immutableKey: `deal:${deal.id}:created`,
        data: { prospectId: prospect.id },
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
  await requireOperationalAccess();
  await prisma.prospect.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/prospection");
}
