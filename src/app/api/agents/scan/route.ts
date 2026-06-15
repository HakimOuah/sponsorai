import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { runPlayerResearch, runScout } from "@/lib/agents/scout";
import { runMatchmaker } from "@/lib/agents/matchmaker";
import type { ScoredBrand, PlayerIntelligence } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { playerId } = await request.json();

  if (!playerId) {
    return new Response(JSON.stringify({ error: "playerId required" }), {
      status: 400,
    });
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });

  if (!player) {
    return new Response(JSON.stringify({ error: "Player not found" }), {
      status: 404,
    });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendEvent = async (
    data: { message: string; type: string; phase?: string; done?: boolean; scanId?: string }
  ) => {
    await writer.write(
      encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
    );
  };

  // Run the pipeline in background
  (async () => {
    const startTime = Date.now();
    const logs: { time: number; message: string; type: string }[] = [];

    const scan = await prisma.scan.create({
      data: {
        playerId: player.id,
        status: "running",
      },
    });

    try {
      await sendEvent({ message: "Démarrage du scan v2...", type: "info", phase: "init" });

      // --- Load existing data for deduplication ---
      const existingCompanies = await prisma.company.findMany({
        select: { name: true },
      });
      const excludedBrands = existingCompanies.map((c) => c.name);

      if (excludedBrands.length > 0) {
        await sendEvent({
          message: `${excludedBrands.length} marques déjà en base (seront exclues de la recherche)`,
          type: "info",
          phase: "init",
        });
      }

      // --- Phase 0: Profile Intelligence ---
      const researchLog = (message: string, type: string = "info") => {
        const entry = { time: Date.now() - startTime, message, type };
        logs.push(entry);
        sendEvent({ message, type, phase: "research" }).catch(() => {});
      };

      let playerIntelligence: PlayerIntelligence | undefined;
      try {
        playerIntelligence = await runPlayerResearch(player, researchLog);

        // Persist intelligence in scan
        await prisma.scan.update({
          where: { id: scan.id },
          data: {
            playerIntelligence: playerIntelligence as unknown as import("@prisma/client").Prisma.JsonObject,
          },
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "unknown";
        researchLog(`Erreur recherche profil: ${errMsg} — on continue sans intelligence`, "error");
      }

      // --- Phase 1: Scout ---
      const scoutLog = (message: string, type: string = "info") => {
        const entry = { time: Date.now() - startTime, message, type };
        logs.push(entry);
        sendEvent({ message, type, phase: "scout" }).catch(() => {});
      };

      const brands = await runScout(player, scoutLog, {
        playerIntelligence,
        excludedBrands,
      });

      await prisma.scan.update({
        where: { id: scan.id },
        data: {
          brandsFound: brands.length,
          rawData: brands as unknown as import("@prisma/client").Prisma.JsonArray,
        },
      });

      // --- Phase 2: Matchmaker ---
      const matchLog = (message: string, type: string = "info") => {
        const entry = { time: Date.now() - startTime, message, type };
        logs.push(entry);
        sendEvent({ message, type, phase: "matchmaker" }).catch(() => {});
      };

      const scoredBrands = await runMatchmaker(player, brands, matchLog, playerIntelligence);

      // Save scored data
      await prisma.scan.update({
        where: { id: scan.id },
        data: {
          brandsScored: scoredBrands.length,
          scoredData: scoredBrands as unknown as import("@prisma/client").Prisma.JsonArray,
          logs: logs as unknown as import("@prisma/client").Prisma.JsonArray,
          status: "completed",
          duration: Math.round((Date.now() - startTime) / 1000),
        },
      });

      // Create companies and prospects
      let created = 0;
      for (const brand of scoredBrands) {
        try {
          await createProspectFromBrand(player.id, scan.id, brand);
          created++;
        } catch (err) {
          await sendEvent({
            message: `Erreur création prospect ${brand.name}: ${err instanceof Error ? err.message : "unknown"}`,
            type: "error",
            phase: "save",
          });
        }
      }

      await sendEvent({
        message: `Scan v2 terminé — ${scoredBrands.length} marques scorées (8 critères), ${created} prospects créés en ${Math.round((Date.now() - startTime) / 1000)}s`,
        type: "success",
        phase: "done",
        done: true,
        scanId: scan.id,
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          type: "scan_completed",
          message: `Scan v2 terminé pour ${player.firstName} ${player.lastName} — ${scoredBrands.length} marques, ${created} prospects (intelligence: ${playerIntelligence ? "oui" : "non"})`,
          metadata: { scanId: scan.id, playerId: player.id },
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";

      await prisma.scan.update({
        where: { id: scan.id },
        data: {
          status: "failed",
          logs: logs as unknown as import("@prisma/client").Prisma.JsonArray,
          duration: Math.round((Date.now() - startTime) / 1000),
        },
      });

      await sendEvent({
        message: `Erreur : ${errorMessage}`,
        type: "error",
        phase: "error",
        done: true,
      });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function createProspectFromBrand(
  playerId: string,
  scanId: string,
  brand: ScoredBrand
) {
  // Upsert company
  let company = await prisma.company.findFirst({
    where: { name: brand.name },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: brand.name,
        sector: brand.sector,
        country: brand.country,
        website: brand.website || null,
        description: brand.rationale,
        existingSportsSponsoring: brand.existing_sports_sponsoring || null,
        estimatedBudget: brand.estimated_budget || null,
        source: "scout",
      },
    });
  }

  // Upsert prospect
  await prisma.prospect.upsert({
    where: {
      playerId_companyId: {
        playerId,
        companyId: company.id,
      },
    },
    update: {
      score: brand.score,
      scoreDetails: brand.score_details as unknown as import("@prisma/client").Prisma.JsonObject,
      rationale: brand.rationale,
      recommendedApproach: brand.recommended_approach,
      partnershipType: brand.partnership_type,
      estimatedValue: brand.estimated_budget,
      priority: brand.priority,
      scanId,
    },
    create: {
      playerId,
      companyId: company.id,
      score: brand.score,
      scoreDetails: brand.score_details as unknown as import("@prisma/client").Prisma.JsonObject,
      rationale: brand.rationale,
      recommendedApproach: brand.recommended_approach,
      partnershipType: brand.partnership_type,
      estimatedValue: brand.estimated_budget,
      priority: brand.priority,
      status: "new",
      scanId,
    },
  });
}
