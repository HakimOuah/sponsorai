"use server";

import { prisma } from "@/lib/prisma";
import { getLearningMetrics } from "@/lib/learning/metrics";
import { rebuildRolePerformanceStats } from "@/lib/learning/stats";

export async function getAnalyticsData() {
  await rebuildRolePerformanceStats();
  const [
    dealsByStage,
    dealsAll,
    emailsByPlayer,
    emailsBySector,
    scans,
    totalProspects,
    totalDeals,
  ] = await Promise.all([
    // Funnel: count deals per stage
    prisma.deal.groupBy({
      by: ["stage"],
      _count: { id: true },
      _sum: { value: true },
    }),

    // All deals for CA breakdown
    prisma.deal.findMany({
      select: {
        stage: true,
        value: true,
        createdAt: true,
        closedAt: true,
      },
    }),

    // Response rates by player
    prisma.email.findMany({
      where: { prospectId: { not: null } },
      select: {
        status: true,
        prospect: {
          select: {
            player: { select: { id: true, firstName: true, lastName: true } },
            company: { select: { sector: true, country: true } },
          },
        },
      },
    }),

    // Response rates by sector (use same data)
    prisma.email.findMany({
      where: { prospectId: { not: null } },
      select: {
        status: true,
        type: true,
        prospect: {
          select: {
            company: { select: { sector: true } },
          },
        },
      },
    }),

    // Agent performance: scans
    prisma.scan.findMany({
      select: {
        id: true,
        brandsFound: true,
        brandsScored: true,
        duration: true,
        status: true,
        createdAt: true,
        player: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    }),

    // Total prospects
    prisma.prospect.count(),

    // Total deals
    prisma.deal.count(),
  ]);

  // === FUNNEL ===
  const stageOrder = [
    "lead",
    "contacted",
    "meeting",
    "negotiation",
    "offer",
    "signed",
    "lost",
  ];
  const stageLabels: Record<string, string> = {
    lead: "Lead",
    contacted: "Contacté",
    meeting: "Meeting",
    negotiation: "Négo",
    offer: "Offre",
    signed: "Signé",
    lost: "Perdu",
  };

  const totalDealCount = dealsAll.length || 1;
  const funnel = stageOrder.map((stage) => {
    const group = dealsByStage.find((d) => d.stage === stage);
    const count = group?._count.id || 0;
    const value = group?._sum.value || 0;
    return {
      stage,
      label: stageLabels[stage] || stage,
      count,
      value,
      percentage: Math.round((count / totalDealCount) * 100),
    };
  });

  // === CA BREAKDOWN ===
  const signedValue = dealsAll
    .filter((d) => d.stage === "signed")
    .reduce((s, d) => s + (d.value || 0), 0);
  const pipelineValue = dealsAll
    .filter((d) => !["signed", "lost"].includes(d.stage))
    .reduce((s, d) => s + (d.value || 0), 0);
  const lostValue = dealsAll
    .filter((d) => d.stage === "lost")
    .reduce((s, d) => s + (d.value || 0), 0);

  // Monthly CA (last 6 months)
  const now = new Date();
  const monthlyCA: { month: string; signed: number; pipeline: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const monthLabel = d.toLocaleDateString("fr-FR", {
      month: "short",
      year: "2-digit",
    });

    const monthSigned = dealsAll
      .filter(
        (deal) =>
          deal.stage === "signed" &&
          deal.closedAt &&
          deal.closedAt >= d &&
          deal.closedAt < nextMonth
      )
      .reduce((s, deal) => s + (deal.value || 0), 0);

    const monthPipeline = dealsAll
      .filter(
        (deal) =>
          !["signed", "lost"].includes(deal.stage) &&
          deal.createdAt >= d &&
          deal.createdAt < nextMonth
      )
      .reduce((s, deal) => s + (deal.value || 0), 0);

    monthlyCA.push({ month: monthLabel, signed: monthSigned, pipeline: monthPipeline });
  }

  // === RESPONSE RATES ===
  // By player
  const playerMap = new Map<
    string,
    { name: string; sent: number; replied: number }
  >();
  for (const e of emailsByPlayer) {
    if (!e.prospect) continue;
    const pid = e.prospect.player.id;
    if (!playerMap.has(pid)) {
      playerMap.set(pid, {
        name: `${e.prospect.player.firstName} ${e.prospect.player.lastName}`,
        sent: 0,
        replied: 0,
      });
    }
    const entry = playerMap.get(pid)!;
    if (e.status === "sent" || e.status === "replied" || e.status === "opened") {
      entry.sent++;
    }
    if (e.status === "replied") {
      entry.replied++;
    }
  }
  const responseByPlayer = Array.from(playerMap.values())
    .map((p) => ({
      ...p,
      rate: p.sent > 0 ? Math.round((p.replied / p.sent) * 100) : 0,
    }))
    .sort((a, b) => b.rate - a.rate);

  // By sector
  const sectorMap = new Map<string, { sent: number; replied: number }>();
  for (const e of emailsBySector) {
    if (!e.prospect) continue;
    const sector = e.prospect.company.sector || "Autre";
    if (!sectorMap.has(sector)) {
      sectorMap.set(sector, { sent: 0, replied: 0 });
    }
    const entry = sectorMap.get(sector)!;
    if (e.status === "sent" || e.status === "replied" || e.status === "opened") {
      entry.sent++;
    }
    if (e.status === "replied") {
      entry.replied++;
    }
  }
  const responseBySector = Array.from(sectorMap.entries())
    .map(([sector, data]) => ({
      sector,
      ...data,
      rate: data.sent > 0 ? Math.round((data.replied / data.sent) * 100) : 0,
    }))
    .sort((a, b) => b.rate - a.rate);

  // === AGENT PERFORMANCE ===
  const completedScans = scans.filter((s) => s.status === "completed");
  const agentPerf = {
    totalScans: scans.length,
    completedScans: completedScans.length,
    totalBrandsFound: completedScans.reduce(
      (s, sc) => s + (sc.brandsFound || 0),
      0
    ),
    totalBrandsScored: completedScans.reduce(
      (s, sc) => s + (sc.brandsScored || 0),
      0
    ),
    avgDuration: completedScans.length
      ? Math.round(
          completedScans.reduce((s, sc) => s + (sc.duration || 0), 0) /
            completedScans.length
        )
      : 0,
    conversionRate:
      totalProspects > 0
        ? Math.round((totalDeals / totalProspects) * 100)
        : 0,
  };

  const [learning, rolePerformance] = await Promise.all([
    getLearningMetrics(),
    prisma.rolePerformanceStat.findMany({
      orderBy: [{ contextualUtility: "desc" }, { attempts: "desc" }],
      take: 10,
    }),
  ]);

  return {
    funnel,
    ca: { signed: signedValue, pipeline: pipelineValue, lost: lostValue },
    monthlyCA,
    responseByPlayer,
    responseBySector,
    agentPerf,
    learning,
    rolePerformance,
  };
}
