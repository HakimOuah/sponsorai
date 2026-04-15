import { prisma } from "@/lib/prisma";
import { runVeille } from "@/lib/agents/veille";
import type { Prisma } from "@prisma/client";

export async function POST() {
  // Gather context
  const [players, deals] = await Promise.all([
    prisma.player.findMany({
      where: { active: true },
      select: { firstName: true, lastName: true, club: true, league: true },
    }),
    prisma.deal.findMany({
      where: { stage: { notIn: ["signed", "lost"] } },
      include: { company: { select: { name: true, sector: true } } },
    }),
  ]);

  const playersList = players
    .map((p) => `${p.firstName} ${p.lastName} (${p.club}, ${p.league})`)
    .join("\n");

  const brandsInPipeline = deals.length > 0
    ? deals
        .map((d) => `${d.company.name} (${d.company.sector || "secteur inconnu"})`)
        .filter((v, i, a) => a.indexOf(v) === i)
        .join("\n")
    : "Aucune marque en pipeline";

  // Create VeilleRun record
  const veilleRun = await prisma.veilleRun.create({
    data: { status: "running" },
  });

  const startTime = Date.now();

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
        const result = await runVeille(playersList, brandsInPipeline, log);

        const duration = Math.round((Date.now() - startTime) / 1000);
        const highCount = result.alerts.filter((a: { priority: string }) => a.priority === "high").length;

        // Persist results in VeilleRun
        await prisma.veilleRun.update({
          where: { id: veilleRun.id },
          data: {
            status: "completed",
            alertsCount: result.alerts.length,
            highCount,
            marketSummary: result.market_summary,
            alerts: result.alerts as unknown as Prisma.InputJsonValue,
            duration,
          },
        });

        // Save alerts as activity logs
        for (const alert of result.alerts.filter((a: { priority: string }) => a.priority === "high")) {
          await prisma.activityLog.create({
            data: {
              type: "scan_completed",
              message: `[VEILLE] ${alert.title}`,
              metadata: {
                type: alert.type,
                description: alert.description,
                opportunity: alert.opportunity,
                threat: alert.threat,
              } as unknown as Prisma.InputJsonValue,
            },
          });
        }

        send({ type: "done", result, runId: veilleRun.id });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";

        // Mark run as failed
        await prisma.veilleRun.update({
          where: { id: veilleRun.id },
          data: {
            status: "failed",
            duration: Math.round((Date.now() - startTime) / 1000),
          },
        });

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

export async function GET() {
  const runs = await prisma.veilleRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json(runs);
}
