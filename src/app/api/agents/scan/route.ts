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
import {
  isPlayerIntelligence,
  PLAYER_INTELLIGENCE_FRESHNESS_MS,
} from "@/lib/agents/player-intelligence";
import { getCurrentUserAccess } from "@/lib/auth/access";
import { getScanRecovery } from "@/lib/agents/scan-recovery";
import { queueScanQualification } from "@/lib/contacts/scan-qualification-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const access = await getCurrentUserAccess();
  if (!access.authenticated) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  if (!access.canOperate) {
    return new Response(
      JSON.stringify({ error: "Votre compte est en mode découverte." }),
      { status: 403 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  if (
    !body ||
    typeof body !== "object" ||
    !("playerId" in body) ||
    typeof body.playerId !== "string" ||
    !body.playerId.trim()
  ) {
    return new Response(JSON.stringify({ error: "playerId required" }), {
      status: 400,
    });
  }
  const playerId = body.playerId;
  const resumeScanId = "resumeScanId" in body ? body.resumeScanId : undefined;
  if (
    resumeScanId !== undefined &&
    (typeof resumeScanId !== "string" || !resumeScanId)
  ) {
    return Response.json({ error: "resumeScanId invalide" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });

  if (!player) {
    return new Response(JSON.stringify({ error: "Player not found" }), {
      status: 404,
    });
  }

  // A serverless invocation can be terminated before its catch block runs.
  // Close abandoned attempts before starting a fresh mission for this athlete.
  await prisma.scan.updateMany({
    where: {
      playerId: player.id,
      status: "running",
      updatedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) },
    },
    data: { status: "failed" },
  });

  const savedScan = resumeScanId
    ? await prisma.scan.findUnique({ where: { id: resumeScanId } })
    : null;
  const recovery = getScanRecovery(savedScan, player.id);
  if (resumeScanId && !recovery) {
    return Response.json(
      {
        error:
          "Ce scan n'est plus reprenable. Rechargez la fiche pour lancer un nouveau scan.",
      },
      { status: 409 },
    );
  }
  const runningScan = await prisma.scan.findFirst({
    where: { playerId, status: "running" },
    select: { id: true },
  });
  if (runningScan) {
    return Response.json(
      { error: "Un scan est déjà en cours pour ce talent." },
      { status: 409 },
    );
  }
  // Claim the existing attempt atomically; concurrent retries cannot charge twice.
  if (recovery) {
    const claimed = await prisma.scan.updateMany({
      where: { id: recovery.scanId, playerId, status: "failed" },
      data: { status: "running", duration: 0 },
    });
    if (claimed.count !== 1) {
      return Response.json(
        { error: "La reprise de ce scan a déjà été lancée." },
        { status: 409 },
      );
    }
  }
  const scan = recovery
    ? { id: recovery.scanId }
    : await prisma.scan.create({ data: { playerId, status: "running" } });

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendEvent = async (data: {
    message: string;
    type: string;
    phase?: string;
    done?: boolean;
    scanId?: string;
    resumable?: boolean;
    qualificationId?: string;
  }) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  // Run the pipeline in background
  (async () => {
    const startTime = Date.now();
    const logs: { time: number; message: string; type: string }[] = [];

    let activePhase: "init" | "research" | "scout" | "matchmaker" | "save" =
      "init";
    let canResume = Boolean(recovery);

    console.info("[scan] started", {
      scanId: scan.id,
      playerId: player.id,
      resumed: Boolean(recovery),
      savedBrands: recovery?.brands.length,
    });

    const runWithHeartbeat = async <T>(
      phase: "research" | "scout" | "matchmaker",
      messages: string[],
      task: () => Promise<T>,
    ): Promise<T> => {
      const stageStartedAt = Date.now();
      activePhase = phase;
      console.info("[scan] stage started", { scanId: scan.id, phase });
      let messageIndex = 0;
      const heartbeat = setInterval(() => {
        const message = messages[messageIndex % messages.length];
        messageIndex += 1;
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        sendEvent({ message, type: "progress", phase }).catch(() => {});
        prisma.scan
          .update({ where: { id: scan.id }, data: { duration: elapsed } })
          .catch(() => {});
      }, 10_000);

      try {
        const result = await task();
        console.info("[scan] stage completed", {
          scanId: scan.id,
          phase,
          durationMs: Date.now() - stageStartedAt,
        });
        return result;
      } catch (error) {
        console.error("[scan] stage failed", {
          scanId: scan.id,
          phase,
          durationMs: Date.now() - stageStartedAt,
          errorName: error instanceof Error ? error.name : "UnknownError",
          errorMessage: error instanceof Error ? error.message : String(error),
        });
        throw error;
      } finally {
        clearInterval(heartbeat);
      }
    };

    try {
      await sendEvent({
        message: recovery
          ? `Reprise de ${recovery.brands.length} marques déjà trouvées, sans relancer Scout.`
          : "Démarrage du scan v2...",
        type: "info",
        phase: "init",
        scanId: scan.id,
      });

      // A brand can be relevant to several athletes. Only exclude brands that
      // have already been evaluated for the current player.
      const evaluatedBrands = await prisma.prospect.findMany(
        buildEvaluatedBrandsQuery(player.id),
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

      let playerIntelligence: PlayerIntelligence | undefined =
        recovery?.playerIntelligence;
      if (!recovery) {
        try {
          const recentSnapshot =
            await prisma.athleteIntelligenceSnapshot.findFirst({
              where: {
                playerId: player.id,
                capturedAt: {
                  gte: new Date(Date.now() - PLAYER_INTELLIGENCE_FRESHNESS_MS),
                },
              },
              orderBy: { capturedAt: "desc" },
              select: { snapshot: true, capturedAt: true },
            });

          if (recentSnapshot && isPlayerIntelligence(recentSnapshot.snapshot)) {
            playerIntelligence = recentSnapshot.snapshot;
            researchLog(
              `Dossier d'intelligence récent réutilisé (mis à jour le ${recentSnapshot.capturedAt.toLocaleDateString("fr-FR")})`,
              "success",
            );
          } else {
            playerIntelligence = await runWithHeartbeat(
              "research",
              [
                "Scout rassemble les signaux publics du profil...",
                "Scout vérifie l'image, l'audience et l'actualité du profil...",
              ],
              () => runPlayerResearch(player, researchLog),
            );

            await prisma.athleteIntelligenceSnapshot.create({
              data: {
                playerId: player.id,
                sourceScanId: scan.id,
                snapshot:
                  playerIntelligence as unknown as import("@prisma/client").Prisma.JsonObject,
              },
            });
          }

          // Persist intelligence in scan
          await prisma.scan.update({
            where: { id: scan.id },
            data: {
              playerIntelligence:
                playerIntelligence as unknown as import("@prisma/client").Prisma.JsonObject,
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
              update: {
                confidence: 0.7,
                source: `scan:${scan.id}`,
                active: true,
              },
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
            {
              platform: "instagram",
              handle: player.instagram,
              followers: player.followersIG,
            },
            {
              platform: "tiktok",
              handle: player.tiktok,
              followers: player.followersTK,
            },
            {
              platform: "x",
              handle: player.twitter,
              followers: player.followersX,
            },
          ].filter(
            (
              account,
            ): account is {
              platform: string;
              handle: string;
              followers: number | null;
            } => Boolean(account.handle),
          );

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
          researchLog(
            `Erreur recherche profil: ${errMsg} — on continue sans intelligence`,
            "error",
          );
        }
      }

      // --- Phase 1: Scout ---
      const scoutLog = (message: string, type: string = "info") => {
        const entry = { time: Date.now() - startTime, message, type };
        logs.push(entry);
        sendEvent({ message, type, phase: "scout" }).catch(() => {});
      };

      const brands =
        recovery?.brands ??
        (await runWithHeartbeat(
          "scout",
          [
            "Scout explore de nouveaux territoires de marque...",
            "Scout vérifie la cohérence des partenaires détectés...",
          ],
          () =>
            runScout(player, scoutLog, {
              playerIntelligence,
              excludedBrands,
            }),
        ));

      await prisma.scan.update({
        where: { id: scan.id },
        data: {
          brandsFound: brands.length,
          rawData:
            brands as unknown as import("@prisma/client").Prisma.JsonArray,
        },
      });
      canResume = true;

      // --- Phase 2: Matchmaker ---
      const matchLog = (message: string, type: string = "info") => {
        const entry = { time: Date.now() - startTime, message, type };
        logs.push(entry);
        sendEvent({ message, type, phase: "matchmaker" }).catch(() => {});
      };

      const baseScoredBrands =
        recovery?.scoredBrands ??
        (await runWithHeartbeat(
          "matchmaker",
          [
            "Matchmaker compare les opportunités sur huit critères...",
            "Matchmaker priorise les marques les plus accessibles...",
            "Matchmaker consolide le classement final...",
          ],
          () => runMatchmaker(player, brands, matchLog, playerIntelligence),
        ));
      const historicalCompanies =
        !recovery?.scoredBrands && baseScoredBrands.length > 0
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
      const scoredBrands =
        recovery?.scoredBrands ??
        applyMatchmakerLearning(
          baseScoredBrands,
          historicalCompanies.map((company) => ({
            name: company.name,
            brandRatings: company.prospects.flatMap((prospect) =>
              prospect.feedback
                .map((feedback) => feedback.brandRating)
                .filter((rating): rating is string => Boolean(rating)),
            ),
            opportunityStrengths: company.opportunitySignals.map(
              (signal) => signal.strength,
            ),
          })),
        );
      const adjustedCount = scoredBrands.filter(
        (brand) => brand.learning_adjustment,
      ).length;
      if (adjustedCount > 0) {
        matchLog(
          `${adjustedCount} score(s) ajusté(s) par les retours et signaux historiques`,
          "success",
        );
      }

      // Save scored data
      await prisma.scan.update({
        where: { id: scan.id },
        data: {
          brandsScored: scoredBrands.length,
          scoredData:
            scoredBrands as unknown as import("@prisma/client").Prisma.JsonArray,
          logs: logs as unknown as import("@prisma/client").Prisma.JsonArray,
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
      activePhase = "save";
      for (const brand of scoredBrands) {
        try {
          const prospect = await createProspectFromBrand(
            player.id,
            scan.id,
            brand,
          );
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

      if (created !== scoredBrands.length) {
        throw new Error(
          "Certaines opportunités n'ont pas pu être enregistrées. Reprenez le scan : les marques et les scores sont conservés.",
        );
      }
      await prisma.activityLog.create({
        data: {
          type: "scan_completed",
          message: `Scan v2 terminé pour ${player.firstName} ${player.lastName} — ${scoredBrands.length} marques, ${created} prospects (intelligence: ${playerIntelligence ? "oui" : "non"})`,
          metadata: {
            scanId: scan.id,
            playerId: player.id,
            resumed: Boolean(recovery),
          },
        },
      });
      await prisma.scan.update({
        where: { id: scan.id },
        data: {
          status: "completed",
          duration: Math.round((Date.now() - startTime) / 1000),
        },
      });

      let qualificationId: string | undefined;
      try {
        if (access.userId) qualificationId = await queueScanQualification(scan.id, player.id, access.userId);
      } catch {
        // A qualification queue failure must never turn a successful scan into a failure.
        console.error("[scan] contact qualification could not be queued", { scanId: scan.id });
      }
      await sendEvent({
        message: `Scan v2 terminé — ${scoredBrands.length} marques scorées (8 critères), ${created} prospects créés en ${Math.round((Date.now() - startTime) / 1000)}s${qualificationId ? ". L’Enrichisseur prend le relais sur les meilleures pistes." : ". Vous pouvez lancer l’enrichissement depuis les opportunités."}`,
        type: "success",
        phase: "done",
        done: true,
        scanId: scan.id,
        qualificationId,
      }).catch(() => {
        // The saved scan and queued qualification remain successful on disconnect.
        console.info("[scan] terminal notification disconnected", { scanId: scan.id });
      });
    } catch (error) {
      const errorMessage = getScanErrorMessage(error, activePhase);

      console.error("[scan] failed", {
        scanId: scan.id,
        playerId: player.id,
        phase: activePhase,
        durationMs: Date.now() - startTime,
        errorName: error instanceof Error ? error.name : "UnknownError",
        errorMessage: error instanceof Error ? error.message : String(error),
      });

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
        scanId: scan.id,
        resumable: canResume,
      });
    } finally {
      await writer.close().catch(() => undefined);
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

function getScanErrorMessage(
  error: unknown,
  phase: "init" | "research" | "scout" | "matchmaker" | "save",
): string {
  if (error instanceof Error) {
    if (
      error.name === "TimeoutError" ||
      error.name === "AbortError" ||
      error.message.toLowerCase().includes("timeout")
    ) {
      const agent =
        phase === "matchmaker"
          ? "Matchmaker"
          : phase === "scout"
            ? "Scout"
            : "Un agent";
      return `${agent} n'a pas répondu dans le délai prévu. Le scan peut être relancé sans risque.`;
    }
    return error.message;
  }
  return "Erreur inconnue";
}

async function createProspectFromBrand(
  playerId: string,
  scanId: string,
  brand: ScoredBrand,
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
      scoreDetails:
        brand.score_details as unknown as import("@prisma/client").Prisma.JsonObject,
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
      scoreDetails:
        brand.score_details as unknown as import("@prisma/client").Prisma.JsonObject,
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
