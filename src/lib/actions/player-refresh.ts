"use server";
import { prisma } from "@/lib/prisma";
import { requireOperationalAccess } from "@/lib/auth/access";
import { sanitizeRefresh } from "@/lib/players/refresh";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

export async function savePlayerRefresh(
  playerId: string,
  version: string,
  values: unknown,
) {
  const access = await requireOperationalAccess();
  const data = sanitizeRefresh(values);
  if (
    !playerId ||
    !Number.isFinite(Date.parse(version)) ||
    !Object.keys(data).length
  )
    return { error: "Aucune modification valide à enregistrer." };
  const changed = await prisma.$transaction(async (tx) => {
    const updated = await tx.player.updateMany({
      where: { id: playerId, updatedAt: new Date(version) },
      data: data as Prisma.PlayerUpdateManyMutationInput,
    });
    if (!updated.count) return false;
    await tx.activityLog.create({
      data: {
        type: "player_refreshed",
        message: "Profil talent actualisé après validation",
        metadata: {
          playerId,
          userId: access.userId,
          fields: Object.keys(data),
        },
      },
    });
    return true;
  });
  if (!changed)
    return {
      error:
        "Le profil a changé depuis la recherche. Rechargez la fiche avant de recommencer.",
    };
  revalidatePath(`/players/${playerId}`);
  revalidatePath("/players");
  revalidatePath("/prospection");
  return { success: true };
}
