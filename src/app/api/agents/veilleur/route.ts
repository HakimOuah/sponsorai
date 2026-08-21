import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runVeilleur } from "@/lib/agents/veilleur";
import { isDealStage, prospectStatusForDealStage } from "@/lib/pipeline";
import { recordLearningEvent } from "@/lib/learning/events";

export async function POST(request: NextRequest) {
  const { emailId, replyContent } = await request.json();

  if (!emailId || !replyContent) {
    return NextResponse.json(
      { error: "emailId and replyContent required" },
      { status: 400 }
    );
  }

  const email = await prisma.email.findUnique({
    where: { id: emailId },
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

  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  const playerName = email.prospect
    ? `${email.prospect.player.firstName} ${email.prospect.player.lastName}`
    : "Non spécifié";

  try {
    const logs: { message: string; type: string }[] = [];
    const log = (message: string, type: string = "info") => {
      logs.push({ message, type });
    };

    const analysis = await runVeilleur(
      {
        companyName: email.company.name,
        playerName,
        emailType: email.type,
        emailSubject: email.subject,
        replyContent,
      },
      log
    );

    const inboundEmail = await prisma.email.create({
      data: {
        prospectId: email.prospectId,
        companyId: email.companyId,
        contactId: email.contactId,
        sendingIdentityId: email.sendingIdentityId,
        mailThreadId: email.mailThreadId,
        type: "reply",
        direction: "inbound",
        provider: email.provider,
        subject: `Re: ${email.subject}`,
        body: replyContent,
        status: "replied",
        repliedAt: new Date(),
      },
    });

    // Update email status to replied
    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: "replied",
        repliedAt: new Date(),
      },
    });

    // Update prospect status based on analysis
    if (email.prospectId) {
      const suggestedStage = isDealStage(analysis.suggested_stage)
        ? analysis.suggested_stage
        : "contacted";
      const newStatus =
        suggestedStage === "contacted"
          ? "replied"
          : prospectStatusForDealStage(suggestedStage);

      await prisma.prospect.update({
        where: { id: email.prospectId },
        data: { status: newStatus },
      });

      // Update deal stage if exists
      if (email.prospect?.deal) {
        await prisma.deal.update({
          where: { id: email.prospect.deal.id },
          data: {
            stage: suggestedStage,
            nextAction: analysis.next_action,
          },
        });
        await prisma.dealEvent.create({
          data: {
            dealId: email.prospect.deal.id,
            type: "REPLY_RECEIVED",
            source: "mailbox",
            immutableKey: `email:${inboundEmail.id}:reply-received`,
            data: {
              sentiment: analysis.sentiment,
              category: analysis.category,
            },
          },
        });
      }
    }

    if (email.mailThreadId) {
      await prisma.mailThread.update({
        where: { id: email.mailThreadId },
        data: { lastMessageAt: new Date() },
      });
    }

    await recordLearningEvent({
      type: "REPLIED",
      idempotencyKey: `email:${inboundEmail.id}:replied`,
      prospectId: email.prospectId,
      emailId: inboundEmail.id,
      dealId: email.prospect?.deal?.id,
      contactId: email.contactId,
      extraContext: {
        sentiment: analysis.sentiment,
        category: analysis.category,
        urgency: analysis.urgency,
      },
    });
    if (analysis.sentiment === "positive" || analysis.category === "meeting_request") {
      await recordLearningEvent({
        type: "POSITIVE_REPLY",
        idempotencyKey: `email:${inboundEmail.id}:positive-reply`,
        prospectId: email.prospectId,
        emailId: inboundEmail.id,
        dealId: email.prospect?.deal?.id,
        contactId: email.contactId,
      });
    } else if (analysis.sentiment === "negative") {
      await recordLearningEvent({
        type: "NEGATIVE_REPLY",
        idempotencyKey: `email:${inboundEmail.id}:negative-reply`,
        prospectId: email.prospectId,
        emailId: inboundEmail.id,
        dealId: email.prospect?.deal?.id,
        contactId: email.contactId,
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        type: "reply_received",
        message: `Réponse ${analysis.sentiment} de ${email.company.name} : ${analysis.summary}`,
        metadata: {
          emailId,
          companyId: email.companyId,
          sentiment: analysis.sentiment,
          category: analysis.category,
          urgency: analysis.urgency,
        },
      },
    });

    return NextResponse.json({
      success: true,
      analysis,
      logs,
    });
  } catch (error) {
    console.error("Veilleur error:", error);
    return NextResponse.json(
      { error: "Failed to analyze reply" },
      { status: 500 }
    );
  }
}
