"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAccess } from "@/lib/auth/access";
import {
  canChangeUserRole,
  isAppRole,
  type AppRole,
} from "@/lib/auth/roles";

export async function getAdminUsers() {
  const access = await getCurrentUserAccess();
  if (!access.isAdmin || !access.userId) return null;

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    currentUserId: access.userId,
    users: users.map((user) => ({
      ...user,
      role: user.role === "admin" ? ("admin" as const) : ("client" as const),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    })),
  };
}

export async function updateUserRole(
  targetUserId: string,
  nextRole: string,
): Promise<
  | { ok: true; role: AppRole }
  | { ok: false; error: string }
> {
  const access = await getCurrentUserAccess();
  if (!access.isAdmin || !access.userId) {
    return { ok: false, error: "Accès administrateur requis." };
  }
  if (!isAppRole(nextRole)) {
    return { ok: false, error: "Rôle invalide." };
  }
  const actorUserId = access.userId;

  try {
    const updatedRole = await prisma.$transaction(
      async (tx) => {
        const target = await tx.user.findUnique({
          where: { id: targetUserId },
          select: { id: true, name: true, role: true },
        });
        if (!target) throw new Error("USER_NOT_FOUND");

        const targetRole: AppRole =
          target.role === "admin" ? "admin" : "client";
        if (targetRole === nextRole) return nextRole;

        const adminCount = await tx.user.count({ where: { role: "admin" } });
        const permission = canChangeUserRole({
          actorUserId,
          targetUserId: target.id,
          targetRole,
          nextRole,
          adminCount,
        });
        if (!permission.allowed) throw new Error(permission.reason);

        await tx.user.update({
          where: { id: target.id },
          data: { role: nextRole },
        });
        await tx.activityLog.create({
          data: {
            type: "user_role_updated",
            message: `Rôle de ${target.name} modifié : ${targetRole} → ${nextRole}`,
            metadata: {
              actorUserId: access.userId,
              targetUserId: target.id,
              previousRole: targetRole,
              nextRole,
            },
          },
        });

        return nextRole;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    revalidatePath("/admin/users");
    return { ok: true, role: updatedRole };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    if (message === "USER_NOT_FOUND") {
      return { ok: false, error: "Utilisateur introuvable." };
    }
    if (message.includes("administrateur") || message.includes("propre rôle")) {
      return { ok: false, error: message };
    }
    return {
      ok: false,
      error: "Le rôle n’a pas pu être modifié. Réessayez.",
    };
  }
}
