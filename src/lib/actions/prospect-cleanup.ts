"use server";

import { executeProspectCleanup } from "@/lib/prospection/cleanup";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOperationalAccess } from "@/lib/auth/access";

export async function getCleanupProspects(playerId: string) {
  await requireOperationalAccess();
  if (!playerId) return [];
  const rows = await prisma.prospect.findMany({
    where: { playerId },
    select: {
      id: true,
      archivedAt: true,
      createdAt: true,
      scanId: true,
      company: { select: { name: true } },
      scan: { select: { createdAt: true } },
      deal: { select: { id: true } },
      _count: {
        select: { emails: true, mailThreads: true, attributions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.company.name,
    scanId: row.scanId,
    date: (row.scan?.createdAt || row.createdAt).toISOString(),
    archived: Boolean(row.archivedAt),
    protected:
      Boolean(row.deal) || Object.values(row._count).some((count) => count > 0),
  }));
}

export async function cleanupProspects(input: {
  playerId: string;
  ids: string[];
  action: "archive" | "restore" | "delete";
  deleteOrphanCompanies?: boolean;
}) {
  const access = await requireOperationalAccess();
  if (!input || !["archive", "restore", "delete"].includes(input.action))
    throw new Error("Action invalide.");
  if (input.action === "delete" && !access.isAdmin)
    throw new Error("Suppression réservée à l’administrateur.");
  if (
    !input.playerId ||
    !Array.isArray(input.ids) ||
    !input.ids.length ||
    input.ids.length > 5000 ||
    input.ids.some((id) => typeof id !== "string")
  ) {
    throw new Error(
      "Sélectionnez entre 1 et 5 000 prospects d’un même athlète.",
    );
  }
  const result = await prisma.$transaction(
    async (tx) => {
      return executeProspectCleanup(tx, input, access.userId);
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 20000,
    },
  );
  for (const path of [
    "/prospection",
    "/companies",
    "/players",
    `/players/${input.playerId}`,
    "/dashboard",
    "/agents",
  ])
    revalidatePath(path);
  return result;
}
