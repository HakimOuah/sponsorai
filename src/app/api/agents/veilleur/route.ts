import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runVeilleur } from "@/lib/agents/veilleur";

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
      const statusMap: Record<string, string> = {
        meeting: "meeting",
        negotiation: "meeting",
        offer: "offer",
        lost: "lost",
        contacted: "replied",
      };
      const newStatus = statusMap[analysis.suggested_stage] || "replied";

      await prisma.prospect.update({
        where: { id: email.prospectId },
        data: { status: newStatus },
      });

      // Update deal stage if exists
      if (email.prospect?.deal) {
        await prisma.deal.update({
          where: { id: email.prospect.deal.id },
          data: {
            stage: analysis.suggested_stage,
            nextAction: analysis.next_action,
          },
        });
      }
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
