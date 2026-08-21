import { prisma } from "@/lib/prisma";
import type { VeilleAlert } from "@/lib/agents/veille";

function signalStrength(priority: VeilleAlert["priority"]): number {
  if (priority === "high") return 0.9;
  if (priority === "medium") return 0.65;
  return 0.4;
}

function isUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function ingestVeilleAlerts(alerts: VeilleAlert[]) {
  let signalsCreated = 0;
  let sponsorshipsCreated = 0;

  for (const alert of alerts) {
    if (!alert.related_brand) continue;
    const company = await prisma.company.findFirst({
      where: { name: { equals: alert.related_brand, mode: "insensitive" } },
    });
    if (!company) continue;

    const duplicate = await prisma.opportunitySignal.findFirst({
      where: {
        companyId: company.id,
        title: alert.title,
        detectedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });
    if (duplicate) continue;

    const signal = await prisma.opportunitySignal.create({
      data: {
        companyId: company.id,
        type: alert.type,
        title: alert.title,
        description: alert.opportunity || alert.description,
        strength: signalStrength(alert.priority),
        status: "unreviewed",
        sourceUrl: isUrl(alert.source) ? alert.source : null,
        metadata: {
          threat: alert.threat,
          relatedPlayer: alert.related_player,
          veilleGenerated: true,
        },
      },
    });
    signalsCreated += 1;

    const sponsorship = alert.type === "new_deal"
      ? await prisma.sponsorship.create({
          data: {
            companyId: company.id,
            rightsHolder: alert.related_player || alert.title,
            athleteName: alert.related_player,
            sport: "football",
            status: "observed",
            source: alert.source,
          },
        })
      : null;
    if (sponsorship) sponsorshipsCreated += 1;

    await prisma.evidence.create({
      data: {
        companyId: company.id,
        opportunitySignalId: signal.id,
        sponsorshipId: sponsorship?.id || null,
        evidenceType: "market_watch",
        claim: alert.description,
        sourceName: isUrl(alert.source) ? null : alert.source,
        sourceUrl: isUrl(alert.source) ? alert.source : null,
        confidence: signalStrength(alert.priority),
        metadata: { alertType: alert.type, priority: alert.priority },
      },
    });
  }

  return { signalsCreated, sponsorshipsCreated };
}
