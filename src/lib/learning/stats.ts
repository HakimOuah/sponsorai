import { prisma } from "@/lib/prisma";
import { calculateStaticContactScore } from "@/lib/agents/contact-quality";

export interface AggregationEvent {
  type: string;
  roleNormalized: string | null;
  sector: string | null;
  companySizeBucket: string | null;
  sport: string | null;
  country: string | null;
  outcomeValue: number | null;
}

export interface RolePerformanceAggregate {
  roleNormalized: string;
  sector: string;
  companySizeBucket: string;
  sport: string;
  country: string;
  attempts: number;
  deliveries: number;
  replies: number;
  positiveReplies: number;
  meetings: number;
  signedDeals: number;
  signedValue: number;
  smoothedReplyRate: number;
  smoothedPositiveRate: number;
  smoothedMeetingRate: number;
  smoothedDealRate: number;
  contextualUtility: number;
  priorStrength: number;
  scoringVersion: string;
}

const PRIOR_STRENGTH = 20;
const SCORING_VERSION = "role-performance-v1";

export function bayesianRate(
  successes: number,
  attempts: number,
  priorMean: number,
  priorStrength = PRIOR_STRENGTH
): number {
  return (successes + priorMean * priorStrength) / (attempts + priorStrength);
}

export function aggregateRolePerformance(
  events: AggregationEvent[]
): RolePerformanceAggregate[] {
  const groups = new Map<string, RolePerformanceAggregate>();

  for (const event of events) {
    if (!event.roleNormalized) continue;
    const dimensions = {
      roleNormalized: event.roleNormalized,
      sector: event.sector || "unknown",
      companySizeBucket: event.companySizeBucket || "unknown",
      sport: event.sport || "unknown",
      country: event.country || "unknown",
    };
    const key = Object.values(dimensions).join("|");
    const group = groups.get(key) || {
      ...dimensions,
      attempts: 0,
      deliveries: 0,
      replies: 0,
      positiveReplies: 0,
      meetings: 0,
      signedDeals: 0,
      signedValue: 0,
      smoothedReplyRate: 0,
      smoothedPositiveRate: 0,
      smoothedMeetingRate: 0,
      smoothedDealRate: 0,
      contextualUtility: 0,
      priorStrength: PRIOR_STRENGTH,
      scoringVersion: SCORING_VERSION,
    };

    if (event.type === "EMAIL_SENT") group.attempts += 1;
    if (event.type === "DELIVERED") group.deliveries += 1;
    if (event.type === "REPLIED") group.replies += 1;
    if (event.type === "POSITIVE_REPLY") group.positiveReplies += 1;
    if (event.type === "MEETING_BOOKED") group.meetings += 1;
    if (event.type === "SIGNED") {
      group.signedDeals += 1;
      group.signedValue += event.outcomeValue || 0;
    }

    groups.set(key, group);
  }

  return Array.from(groups.values()).map((group) => {
    const smoothedReplyRate = bayesianRate(group.replies, group.attempts, 0.12);
    const smoothedPositiveRate = bayesianRate(
      group.positiveReplies,
      group.attempts,
      0.05
    );
    const smoothedMeetingRate = bayesianRate(group.meetings, group.attempts, 0.03);
    const smoothedDealRate = bayesianRate(group.signedDeals, group.attempts, 0.01);
    const valueSignal = Math.min(
      1,
      Math.log10(1 + group.signedValue / Math.max(1, group.attempts)) / 5
    );
    const contextualUtility =
      smoothedReplyRate * 0.15 +
      smoothedPositiveRate * 0.25 +
      smoothedMeetingRate * 0.25 +
      smoothedDealRate * 0.25 +
      valueSignal * 0.1;

    return {
      ...group,
      smoothedReplyRate,
      smoothedPositiveRate,
      smoothedMeetingRate,
      smoothedDealRate,
      contextualUtility,
    };
  });
}

export async function rebuildRolePerformanceStats() {
  const events = await prisma.learningEvent.findMany({
    where: { roleNormalized: { not: null } },
    select: {
      type: true,
      roleNormalized: true,
      sector: true,
      companySizeBucket: true,
      sport: true,
      country: true,
      outcomeValue: true,
    },
  });
  const aggregates = aggregateRolePerformance(events);

  for (const aggregate of aggregates) {
    await prisma.rolePerformanceStat.upsert({
      where: {
        roleNormalized_sector_companySizeBucket_sport_country_scoringVersion: {
          roleNormalized: aggregate.roleNormalized,
          sector: aggregate.sector,
          companySizeBucket: aggregate.companySizeBucket,
          sport: aggregate.sport,
          country: aggregate.country,
          scoringVersion: aggregate.scoringVersion,
        },
      },
      update: { ...aggregate, computedAt: new Date() },
      create: aggregate,
    });
  }

  const contacts = await prisma.contact.findMany({
    where: { active: true },
    include: {
      company: {
        select: { sector: true, country: true, companySizeBucket: true },
      },
    },
  });
  for (const contact of contacts) {
    const stat = aggregates
      .filter(
        (aggregate) =>
          aggregate.roleNormalized === contact.roleNormalized &&
          aggregate.sector === (contact.company.sector || "unknown") &&
          aggregate.companySizeBucket === contact.company.companySizeBucket &&
          aggregate.sport === "football" &&
          aggregate.country === (contact.company.country || "unknown")
      )
      .sort((a, b) => b.attempts - a.attempts)[0];
    const staticScore = calculateStaticContactScore({
      role: contact.roleRaw,
      contactability: contact.contactability,
      employmentConfidence: contact.employmentConfidence,
    });
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        contactScore: calculateContextualContactScore(
          staticScore,
          stat?.contextualUtility || 0
        ),
        contactScoreVersion: "contact-score-v2-contextual",
      },
    });
  }

  return aggregates;
}

export function calculateContextualContactScore(
  staticScore: number,
  contextualUtility: number
): number {
  return Math.round(
    Math.min(100, Math.max(0, staticScore * 0.75 + contextualUtility * 100 * 0.25))
  );
}
