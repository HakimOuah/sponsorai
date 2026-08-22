export const APP_ROLES = ["admin", "client"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export function isAppRole(value: string): value is AppRole {
  return APP_ROLES.includes(value as AppRole);
}

export function canChangeUserRole(input: {
  actorUserId: string;
  targetUserId: string;
  targetRole: AppRole;
  nextRole: AppRole;
  adminCount: number;
}): { allowed: true } | { allowed: false; reason: string } {
  if (input.actorUserId === input.targetUserId) {
    return {
      allowed: false,
      reason: "Vous ne pouvez pas modifier votre propre rôle.",
    };
  }

  if (
    input.targetRole === "admin" &&
    input.nextRole === "client" &&
    input.adminCount <= 1
  ) {
    return {
      allowed: false,
      reason: "Vectis doit conserver au moins un administrateur.",
    };
  }

  return { allowed: true };
}
