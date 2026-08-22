import { prisma } from "@/lib/prisma";
import { runVeilleur, type ReplyAnalysis } from "@/lib/agents/veilleur";
import { isDealStage, prospectStatusForDealStage } from "@/lib/pipeline";
import { recordLearningEvent } from "@/lib/learning/events";

export interface ProcessInboundReplyInput {
  outboundEmailId: string;
  replyContent: string;
  provider?: string;
  messageId?: string | null;
  subject?: string | null;
  receivedAt?: Date;
  inboundEmailId?: string | null;
  source?: "mailbox" | "manual";
}

export interface ProcessInboundReplyResult {
  analysis: ReplyAnalysis;
  inboundEmailId: string;
  logs: Array<{ message: string; type: string }>;
  prospectStatus: string | null;
  dealStage: string | null;
}

export async function processInboundReply({
  outboundEmailId,
  replyContent,
  provider = "manual",
  messageId,
  subject,
  receivedAt = new Date(),
  inboundEmailId,
  source = "manual",
}: ProcessInboundReplyInput): Promise<ProcessInboundReplyResult> {
  const content = replyContent.trim().slice(0, 20_000);
  if (!content) throw new Error("Reply content is empty");

  const outbound = await prisma.email.findUnique({
    where: { id: outboundEmailId },
    include: {
      company: true,
      prospect: {
        include: {
          player: true,
          deal: true,
        },
      },
    },
  });
  if (!outbound) throw new Error("Outbound email not found");

  const logs: Array<{ message: string; type: string }> = [];
  const analysis = await runVeilleur(
    {
      companyName: outbound.company.name,
      playerName: outbound.prospect
        ? `${outbound.prospect.player.firstName} ${outbound.prospect.player.lastName}`
        : "Non spécifié",
      emailType: outbound.type,
      emailSubject: outbound.subject,
      replyContent: content,
    },
    (message, type = "info") => logs.push({ message, type }),
  );

  const inbound = inboundEmailId
    ? await prisma.email.update({
        where: { id: inboundEmailId },
        data: {
          body: content,
          status: "replied",
          repliedAt: receivedAt,
        },
      })
    : await prisma.email.create({
        data: {
          prospectId: outbound.prospectId,
          companyId: outbound.companyId,
          contactId: outbound.contactId,
          sendingIdentityId: outbound.sendingIdentityId,
          mailThreadId: outbound.mailThreadId,
          type: "reply",
          direction: "inbound",
          provider,
          subject: subject || `Re: ${outbound.subject}`,
          body: content,
          status: "replied",
          repliedAt: receivedAt,
          messageId: messageId || null,
        },
      });

  const suggestedStage = isDealStage(analysis.suggested_stage)
    ? analysis.suggested_stage
    : "contacted";
  const prospectStatus = outbound.prospectId
    ? suggestedStage === "contacted"
      ? "replied"
      : prospectStatusForDealStage(suggestedStage)
    : null;
  const dealStage = outbound.prospect?.deal ? suggestedStage : null;
  const dealEventKey = outbound.prospect?.deal
    ? `email:${inbound.id}:reply-received`
    : null;
  const existingActivity = await prisma.activityLog.findFirst({
    where: {
      type: "reply_received",
      metadata: { path: ["inboundEmailId"], equals: inbound.id },
    },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.email.update({
      where: { id: outbound.id },
      data: { status: "replied", repliedAt: receivedAt },
    }),
    ...(outbound.prospectId && prospectStatus
      ? [
          prisma.prospect.update({
            where: { id: outbound.prospectId },
            data: { status: prospectStatus },
          }),
        ]
      : []),
    ...(outbound.prospect?.deal
      ? [
          prisma.deal.update({
            where: { id: outbound.prospect.deal.id },
            data: {
              stage: suggestedStage,
              nextAction: analysis.next_action,
            },
          }),
          prisma.dealEvent.upsert({
            where: { immutableKey: dealEventKey! },
            update: {
              data: {
                sentiment: analysis.sentiment,
                category: analysis.category,
                urgency: analysis.urgency,
              },
            },
            create: {
              dealId: outbound.prospect.deal.id,
              type: "REPLY_RECEIVED",
              source,
              immutableKey: dealEventKey!,
              data: {
                sentiment: analysis.sentiment,
                category: analysis.category,
                urgency: analysis.urgency,
              },
            },
          }),
        ]
      : []),
    ...(outbound.mailThreadId
      ? [
          prisma.mailThread.update({
            where: { id: outbound.mailThreadId },
            data: { lastMessageAt: receivedAt },
          }),
        ]
      : []),
    ...(!existingActivity
      ? [
          prisma.activityLog.create({
            data: {
              type: "reply_received",
              message: `Réponse ${analysis.sentiment} de ${outbound.company.name} : ${analysis.summary}`,
              metadata: {
                emailId: outbound.id,
                inboundEmailId: inbound.id,
                companyId: outbound.companyId,
                sentiment: analysis.sentiment,
                category: analysis.category,
                urgency: analysis.urgency,
                source,
              },
            },
          }),
        ]
      : []),
  ]);

  await recordLearningEvent({
    type: "REPLIED",
    idempotencyKey: `email:${inbound.id}:replied`,
    prospectId: outbound.prospectId,
    emailId: inbound.id,
    dealId: outbound.prospect?.deal?.id,
    contactId: outbound.contactId,
    extraContext: {
      sentiment: analysis.sentiment,
      category: analysis.category,
      urgency: analysis.urgency,
      source,
    },
  });

  if (
    analysis.sentiment === "positive" ||
    analysis.category === "meeting_request"
  ) {
    await recordLearningEvent({
      type: "POSITIVE_REPLY",
      idempotencyKey: `email:${inbound.id}:positive-reply`,
      prospectId: outbound.prospectId,
      emailId: inbound.id,
      dealId: outbound.prospect?.deal?.id,
      contactId: outbound.contactId,
      extraContext: { source },
    });
  } else if (analysis.sentiment === "negative") {
    await recordLearningEvent({
      type: "NEGATIVE_REPLY",
      idempotencyKey: `email:${inbound.id}:negative-reply`,
      prospectId: outbound.prospectId,
      emailId: inbound.id,
      dealId: outbound.prospect?.deal?.id,
      contactId: outbound.contactId,
      extraContext: { source },
    });
  }

  return {
    analysis,
    inboundEmailId: inbound.id,
    logs,
    prospectStatus,
    dealStage,
  };
}
