import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureSponsorAIAttribution } from "@/lib/deals/attribution";
import { isDealStage, prospectStatusForDealStage } from "@/lib/pipeline";
import type { DealStage } from "@/types";

const SENT_STATUSES = new Set(["sent", "delivered", "opened", "replied", "bounced"]);

export function hasRecordedOutboundSend(email: {
  direction: string;
  status: string;
  sentAt: Date | null;
}): boolean {
  return email.direction === "outbound" && email.sentAt !== null && SENT_STATUSES.has(email.status);
}

export function dealStageAfterOutreach(prospectStatus: string): DealStage {
  // A reply alone is not a meeting. Preserve later milestones during backfills.
  return isDealStage(prospectStatus) && prospectStatus !== "lead"
    ? prospectStatus
    : "contacted";
}

export interface EmailPipelineSyncResult {
  emailId: string;
  companyId: string;
  playerId?: string;
  dealId?: string;
  stage?: string;
  change: "not_sent" | "no_prospect" | "created" | "advanced" | "unchanged";
}

/** Repairs database state only. This module must never call a sending provider. */
export async function syncSentEmailToPipeline(
  emailId: string,
  db: Pick<PrismaClient, "$transaction"> = prisma,
): Promise<EmailPipelineSyncResult> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const email = await tx.email.findUnique({
          where: { id: emailId },
          select: {
            id: true, companyId: true, direction: true, status: true, sentAt: true,
            prospect: {
              select: {
                id: true, playerId: true, companyId: true,
                status: true, partnershipType: true,
              },
            },
          },
        });
        if (!email) throw new Error("Email not found");
        const base = { emailId, companyId: email.companyId };
        if (!hasRecordedOutboundSend(email)) return { ...base, change: "not_sent" };
        const prospect = email.prospect;
        if (!prospect) return { ...base, change: "no_prospect" };
        if (prospect.companyId !== email.companyId) {
          throw new Error("Email and prospect belong to different companies");
        }

        const previous = await tx.deal.findUnique({ where: { prospectId: prospect.id } });
        const targetStage = dealStageAfterOutreach(prospect.status);
        const deal = await tx.deal.upsert({
          where: { prospectId: prospect.id },
          update: {},
          create: {
            prospectId: prospect.id,
            companyId: prospect.companyId,
            playerId: prospect.playerId,
            dealType: prospect.partnershipType,
            stage: targetStage,
          },
        });

        // Conditional writes cannot demote a deal moved by another request.
        const advanced = await tx.deal.updateMany({
          where: { id: deal.id, stage: "lead", closedAt: null },
          data: { stage: targetStage },
        });
        const stage = advanced.count ? targetStage : deal.stage;
        await tx.prospect.updateMany({
          where: { id: prospect.id, status: "new" },
          data: {
            status: isDealStage(stage) ? prospectStatusForDealStage(stage) : "contacted",
          },
        });
        await ensureSponsorAIAttribution(deal.id, tx);

        if (!previous || advanced.count) {
          await tx.dealEvent.upsert({
            where: {
              immutableKey: previous
                ? `deal:${deal.id}:email:${emailId}:contacted`
                : `deal:${deal.id}:created`,
            },
            update: {},
            create: {
              dealId: deal.id,
              type: previous ? "STAGE_CHANGED" : "DEAL_CREATED",
              source: "email",
              immutableKey: previous
                ? `deal:${deal.id}:email:${emailId}:contacted`
                : `deal:${deal.id}:created`,
              occurredAt: email.sentAt!,
              data: { emailId, prospectId: prospect.id, from: previous?.stage ?? null, to: stage },
            },
          });
        }

        return {
          ...base, playerId: prospect.playerId, dealId: deal.id, stage,
          change: !previous ? "created" : advanced.count ? "advanced" : "unchanged",
        };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15_000 });
    } catch (error) {
      // Concurrent sends for the same prospect can contend on its unique deal.
      // Retry database work only, never the external email send.
      const retryable = error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2034" || error.code === "P2002");
      if (!retryable || attempt >= 2) throw error;
    }
  }
}
