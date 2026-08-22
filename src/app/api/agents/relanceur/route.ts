import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runRelanceur } from "@/lib/agents/relanceur";
import { getCurrentUserAccess } from "@/lib/auth/access";

export async function POST(request: NextRequest) {
  const access = await getCurrentUserAccess();
  if (!access.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!access.canOperate) {
    return NextResponse.json(
      { error: "Votre compte est en mode découverte." },
      { status: 403 },
    );
  }

  const { prospectId } = await request.json();

  if (!prospectId) {
    return NextResponse.json({ error: "prospectId required" }, { status: 400 });
  }

  const prospect = await prisma.prospect.findUnique({
    where: { id: prospectId },
    include: {
      player: true,
      company: true,
      emails: {
        where: { status: { in: ["sent", "opened"] } },
        orderBy: { sentAt: "asc" },
        take: 1,
      },
    },
  });

  if (!prospect) {
    return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
  }

  const firstEmail = prospect.emails[0];
  if (!firstEmail) {
    return NextResponse.json(
      { error: "No sent email found for this prospect" },
      { status: 400 }
    );
  }

  const daysSince = Math.floor(
    (Date.now() - new Date(firstEmail.sentAt || firstEmail.createdAt).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const log = (message: string, type: string = "info") => {
        send({ type: "log", message, logType: type });
      };

      try {
        const result = await runRelanceur(
          prospect.player,
          {
            companyName: prospect.company.name,
            companySector: prospect.company.sector || "Non renseigné",
            firstEmailDate: new Date(firstEmail.sentAt || firstEmail.createdAt).toLocaleDateString("fr-FR"),
            firstEmailSubject: firstEmail.subject,
            daysSince,
          },
          log
        );

        // Save the generated follow-up as draft
        const email = await prisma.email.create({
          data: {
            prospectId: prospect.id,
            companyId: prospect.companyId,
            type: "followup_1",
            subject: result.email.subject,
            body: result.email.body,
            status: "draft",
          },
        });

        log("Email de relance sauvegardé en brouillon", "success");

        await prisma.activityLog.create({
          data: {
            type: "email_sent",
            message: `Relance intelligente générée pour ${prospect.company.name} (timing: ${result.timing_score}/10)`,
            metadata: {
              prospectId: prospect.id,
              emailId: email.id,
              timingScore: result.timing_score,
              hook: result.best_hook,
            },
          },
        });

        send({
          type: "done",
          result: {
            ...result,
            emailId: email.id,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        send({ type: "error", message });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
