"use server";

import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAccess } from "@/lib/auth/access";
import {
  canChangeUserRole,
  isAppRole,
  normalizeAppRole,
  type AppRole,
} from "@/lib/auth/roles";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  createdAt: string;
  updatedAt: string;
};

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
      role: normalizeAppRole(user.role),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    })),
  };
}

export async function createUserAccount(input: {
  firstName: string;
  lastName: string;
  email: string;
  temporaryPassword: string;
  role: string;
}): Promise<
  | { ok: true; user: ManagedUser }
  | { ok: false; error: string }
> {
  const access = await getCurrentUserAccess();
  if (!access.isAdmin || !access.userId) {
    return { ok: false, error: "Accès administrateur requis." };
  }

  const firstName = input.firstName.trim().replace(/\s+/g, " ");
  const lastName = input.lastName.trim().replace(/\s+/g, " ");
  const email = input.email.trim().toLowerCase();
  const temporaryPassword = input.temporaryPassword;

  if (firstName.length < 2 || lastName.length < 2) {
    return { ok: false, error: "Renseignez un prénom et un nom valides." };
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { ok: false, error: "L’adresse email n’est pas valide." };
  }
  if (temporaryPassword.length < 10) {
    return {
      ok: false,
      error: "Le mot de passe temporaire doit contenir au moins 10 caractères.",
    };
  }
  if (!isAppRole(input.role)) {
    return { ok: false, error: "Rôle invalide." };
  }

  try {
    const password = await bcrypt.hash(temporaryPassword, 12);
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: `${firstName} ${lastName}`,
          email,
          password,
          role: input.role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.activityLog.create({
        data: {
          type: "user_created",
          message: `Compte créé pour ${createdUser.name}`,
          metadata: {
            actorUserId: access.userId,
            targetUserId: createdUser.id,
            role: input.role,
          },
        },
      });

      return createdUser;
    });

    revalidatePath("/admin/users");
    return {
      ok: true,
      user: {
        ...user,
        role: normalizeAppRole(user.role),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "Un compte utilise déjà cette adresse email." };
    }
    return { ok: false, error: "Le compte n’a pas pu être créé. Réessayez." };
  }
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

        const targetRole = normalizeAppRole(target.role);
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
