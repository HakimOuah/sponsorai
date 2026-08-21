import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { runPlayerResearch, runScout } from "@/lib/agents/scout";
import {
  buildEvaluatedBrandsQuery,
  getExcludedBrandNames,
} from "@/lib/agents/scout-deduplication";
import { runMatchmaker } from "@/lib/agents/matchmaker";
import type { ScoredBrand, PlayerIntelligence } from "@/types";
import { applyMatchmakerLearning } from "@/lib/agents/matchmaker-learning";
import { recordLearningEvent } from "@/lib/learning/events";

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

      // A brand can be relevant to several athletes. Only exclude brands that
      // have already been evaluated for the current player.
      const evaluatedBrands = await prisma.prospect.findMany(
        buildEvaluatedBrandsQuery(player.id)
      );
      const excludedBrands = getExcludedBrandNames(evaluatedBrands);

      if (excludedBrands.length > 0) {
        await sendEvent({
          message: `${excludedBrands.length} marques déjà évaluées pour ${player.firstName} ${player.lastName} (seront exclues de la recherche)`,
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

        await prisma.athleteIntelligenceSnapshot.create({
          data: {
            playerId: player.id,
            sourceScanId: scan.id,
            snapshot: playerIntelligence as unknown as import("@prisma/client").Prisma.JsonObject,
          },
        });

        for (const value of playerIntelligence.key_values || []) {
          await prisma.athleteTrait.upsert({
            where: {
              playerId_type_value: {
                playerId: player.id,
                type: "key_value",
                value,
              },
            },
            update: { confidence: 0.7, source: `scan:${scan.id}`, active: true },
            create: {
              playerId: player.id,
              type: "key_value",
              value,
              confidence: 0.7,
              source: `scan:${scan.id}`,
            },
          });
        }

        const socialAccounts = [
          { platform: "instagram", handle: player.instagram, followers: player.followersIG },
          { platform: "tiktok", handle: player.tiktok, followers: player.followersTK },
          { platform: "x", handle: player.twitter, followers: player.followersX },
        ].filter((account): account is { platform: string; handle: string; followers: number | null } => Boolean(account.handle));

        for (const account of socialAccounts) {
          await prisma.athleteSocialAccount.upsert({
            where: {
              playerId_platform_handle: {
                playerId: player.id,
                platform: account.platform,
                handle: account.handle,
              },
            },
            update: {
              followers: account.followers,
              engagementRate: player.engagementRate,
              capturedAt: new Date(),
            },
            create: {
              playerId: player.id,
              platform: account.platform,
              handle: account.handle,
              followers: account.followers,
              engagementRate: player.engagementRate,
            },
          });
        }
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

      const baseScoredBrands = await runMatchmaker(player, brands, matchLog, playerIntelligence);
      const historicalCompanies = baseScoredBrands.length > 0
        ? await prisma.company.findMany({
            where: {
              OR: baseScoredBrands.map((brand) => ({
                name: { equals: brand.name, mode: "insensitive" },
              })),
            },
            select: {
              name: true,
              prospects: {
                select: {
                  feedback: { select: { brandRating: true } },
                },
              },
              opportunitySignals: {
                where: { status: { in: ["unreviewed", "active"] } },
                select: { strength: true },
              },
            },
          })
        : [];
      const scoredBrands = applyMatchmakerLearning(
        baseScoredBrands,
        historicalCompanies.map((company) => ({
          name: company.name,
          brandRatings: company.prospects.flatMap((prospect) =>
            prospect.feedback
              .map((feedback) => feedback.brandRating)
              .filter((rating): rating is string => Boolean(rating))
          ),
          opportunityStrengths: company.opportunitySignals.map((signal) => signal.strength),
        }))
      );
      const adjustedCount = scoredBrands.filter((brand) => brand.learning_adjustment).length;
      if (adjustedCount > 0) {
        matchLog(`${adjustedCount} score(s) ajusté(s) par les retours et signaux historiques`, "success");
      }

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
      await sendEvent({
        message: "Création des opportunités prioritaires...",
        type: "info",
        phase: "save",
      });
      for (const brand of scoredBrands) {
        try {
          const prospect = await createProspectFromBrand(player.id, scan.id, brand);
          await recordLearningEvent({
            type: "BRAND_MATCHED",
            idempotencyKey: `scan:${scan.id}:prospect:${prospect.id}:matched`,
            prospectId: prospect.id,
          });
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
  return prisma.prospect.upsert({
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
      scoreVersion: brand.score_version || "matchmaker-v2-learning-v1",
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
      scoreVersion: brand.score_version || "matchmaker-v2-learning-v1",
    },
  });
}
