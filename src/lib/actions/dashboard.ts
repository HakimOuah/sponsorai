"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    activePlayers,
    totalCompaniesInPipeline,
    emailsSent,
    emailsReplied,
    dealsSigned,
    dealsInPipeline,
    todayLeads,
    todayReplies,
    todayDealsAdvanced,
    priorityProspects,
    overdueActions,
    draftEmails,
    recentActivity,
    pendingFollowups,
  ] = await Promise.all([
    // KPI: joueurs actifs
    prisma.player.count({ where: { active: true } }),

    // KPI: marques en pipeline (deals not signed/lost)
    prisma.deal.count({
      where: { stage: { notIn: ["signed", "lost"] } },
    }),

    // KPI: emails envoyés
    prisma.email.count({ where: { status: "sent" } }),

    // KPI: emails avec réponse
    prisma.email.count({ where: { status: "replied" } }),

    // KPI: CA signé
    prisma.deal.aggregate({
      where: { stage: "signed" },
      _sum: { value: true },
    }),

    // KPI: CA en pipeline
    prisma.deal.aggregate({
      where: { stage: { notIn: ["signed", "lost"] } },
      _sum: { value: true },
    }),

    // Score: nouveaux leads aujourd'hui
    prisma.prospect.count({
      where: { createdAt: { gte: todayStart } },
    }),

    // Score: réponses aujourd'hui
    prisma.email.count({
      where: { status: "replied", repliedAt: { gte: todayStart } },
    }),

    // Score: deals avancés aujourd'hui
    prisma.activityLog.count({
      where: {
        type: "deal_updated",
        createdAt: { gte: todayStart },
      },
    }),

    // Top 5 prospects prioritaires (A/B sans deal, les plus récents)
    prisma.prospect.findMany({
      where: {
        priority: { in: ["A", "B"] },
        status: { in: ["new", "contacted"] },
      },
      include: {
        player: { select: { firstName: true, lastName: true, club: true } },
        company: { select: { name: true, sector: true, contactEmail: true } },
      },
      orderBy: [{ priority: "asc" }, { score: "desc" }],
      take: 5,
    }),

    // Actions requises: deals with overdue nextActionDate
    prisma.deal.findMany({
      where: {
        nextActionDate: { lt: now },
        stage: { notIn: ["signed", "lost"] },
      },
      include: {
        player: { select: { firstName: true, lastName: true } },
        company: { select: { name: true } },
      },
      orderBy: { nextActionDate: "asc" },
      take: 5,
    }),

    // Brouillons à envoyer
    prisma.email.count({ where: { status: "draft" } }),

    // Activité récente
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),

    // Relances à faire : prospects avec emails envoyés/ouverts, pas de réponse, > 7 jours
    prisma.prospect.findMany({
      where: {
        emails: {
          some: {
            status: { in: ["sent", "opened"] },
            sentAt: { lt: sevenDaysAgo },
          },
          none: { status: "replied" },
        },
      },
      include: {
        player: { select: { firstName: true, lastName: true } },
        company: { select: { name: true } },
        emails: {
          where: { status: { in: ["sent", "opened"] } },
          orderBy: { sentAt: "desc" },
          take: 1,
          select: { sentAt: true },
        },
      },
      take: 5,
    }),
  ]);

  // Taux de réponse
  const responseRate =
    emailsSent > 0 ? Math.round((emailsReplied / emailsSent) * 100) : 0;

  // Score journée (0-100)
  const dayScore = Math.min(
    100,
    todayLeads * 10 + todayReplies * 25 + todayDealsAdvanced * 15
  );

  // Compute days since last email for each followup
  const followups = pendingFollowups.map((p) => {
    const lastSent = p.emails[0]?.sentAt;
    const daysSince = lastSent
      ? Math.floor((now.getTime() - new Date(lastSent).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    return {
      id: p.id,
      player: p.player,
      company: p.company,
      daysSince,
    };
  }).sort((a, b) => b.daysSince - a.daysSince);

  return {
    kpis: {
      activePlayers,
      companiesInPipeline: totalCompaniesInPipeline,
      responseRate,
      signedRevenue: dealsSigned._sum.value || 0,
      pipelineRevenue: dealsInPipeline._sum.value || 0,
    },
    dayScore,
    priorityProspects,
    overdueActions,
    draftEmails,
    recentActivity,
    pendingFollowups: followups,
  };
}
