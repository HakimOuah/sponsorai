import { prisma } from "@/lib/prisma";

function rate(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

export async function getLearningMetrics() {
  const [topProspects, contacts, eventCounts, signedDeals] = await Promise.all([
    prisma.prospect.findMany({
      orderBy: { score: "desc" },
      take: 20,
      include: {
        feedback: { orderBy: { createdAt: "desc" }, take: 1 },
        company: {
          select: {
            contacts: {
              where: { active: true },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    }),
    prisma.contact.findMany({
      where: { active: true },
      select: { contactability: true },
    }),
    prisma.learningEvent.groupBy({
      by: ["type"],
      _count: { _all: true },
    }),
    prisma.deal.aggregate({
      where: { stage: "signed" },
      _count: { _all: true },
      _sum: { value: true },
    }),
  ]);

  const eventMap = new Map(
    eventCounts.map((event) => [event.type, event._count._all])
  );
  const attempts = eventMap.get("EMAIL_SENT") || 0;
  const relevantFeedback = topProspects.filter((prospect) =>
    ["excellent", "possible"].includes(prospect.feedback[0]?.brandRating || "")
  ).length;
  const ratedProspects = topProspects.filter(
    (prospect) => prospect.feedback[0]?.brandRating
  ).length;
  const actionableContacts = contacts.filter((contact) =>
    ["verified", "public_source"].includes(contact.contactability)
  ).length;
  const coveredProspects = topProspects.filter(
    (prospect) => prospect.company.contacts.length > 0
  ).length;

  return {
    precisionAt20: rate(relevantFeedback, ratedProspects),
    precisionSample: ratedProspects,
    contactCoverage: rate(coveredProspects, topProspects.length),
    verifiedEmailRate: rate(actionableContacts, contacts.length),
    deliveryRate: rate(eventMap.get("DELIVERED") || 0, attempts),
    responseRate: rate(eventMap.get("REPLIED") || 0, attempts),
    positiveResponseRate: rate(eventMap.get("POSITIVE_REPLY") || 0, attempts),
    meetingRate: rate(eventMap.get("MEETING_BOOKED") || 0, attempts),
    signedDeals: signedDeals._count._all,
    signedValue: signedDeals._sum.value || 0,
    attempts,
  };
}
