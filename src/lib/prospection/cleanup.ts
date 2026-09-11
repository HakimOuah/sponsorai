import type { Prisma } from "@prisma/client";

export type CleanupInput = {
  playerId: string;
  ids: string[];
  action: "archive" | "restore" | "delete";
  deleteOrphanCompanies?: boolean;
};

export async function executeProspectCleanup(
  tx: Prisma.TransactionClient,
  input: CleanupInput,
  userId: string | null,
) {
  const ids = Array.from(new Set(input.ids));
  // A scan could otherwise recreate a deleted prospect immediately after cleanup.
  if (
    await tx.scan.count({
      where: { playerId: input.playerId, status: "running" },
    })
  ) {
    throw new Error(
      "Un scan est en cours pour cet athlète. Attendez sa fin avant le nettoyage.",
    );
  }
  const rows = await tx.prospect.findMany({
    where: { playerId: input.playerId, id: { in: ids } },
    select: {
      id: true,
      companyId: true,
      deal: { select: { id: true } },
      _count: {
        select: { emails: true, mailThreads: true, attributions: true },
      },
    },
  });
  if (rows.length !== ids.length)
    throw new Error(
      "La sélection a changé ou contient un autre athlète. Rechargez la page.",
    );
  let companiesDeleted = 0;
  if (input.action === "delete") {
    if (
      rows.some(
        (row) =>
          row.deal || Object.values(row._count).some((count) => count > 0),
      )
    ) {
      throw new Error(
        "La sélection contient un prospect avec un email, un deal ou un historique de conversation. Archivez-le pour conserver cet historique.",
      );
    }
    await tx.prospect.deleteMany({
      where: { playerId: input.playerId, id: { in: ids } },
    });
    if (input.deleteOrphanCompanies) {
      const deleted = await tx.company.deleteMany({
        where: {
          id: { in: rows.map((row) => row.companyId) },
          prospects: { none: {} },
          deals: { none: {} },
          emails: { none: {} },
          contacts: { none: {} },
          employments: { none: {} },
          evidence: { none: {} },
          sponsorships: { none: {} },
          opportunitySignals: { none: {} },
          learningEvents: { none: {} },
          mailThreads: { none: {} },
        },
      });
      companiesDeleted = deleted.count;
    }
  } else {
    await tx.prospect.updateMany({
      where: { playerId: input.playerId, id: { in: ids } },
      data: { archivedAt: input.action === "archive" ? new Date() : null },
    });
  }
  await tx.activityLog.create({
    data: {
      type: `prospects_${input.action}`,
      message: `${rows.length} prospects : ${input.action}`,
      metadata: {
        playerId: input.playerId,
        prospectIds: ids,
        userId: userId,
        companiesDeleted,
      },
    },
  });
  return { count: rows.length, companiesDeleted };
}
