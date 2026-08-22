export const APP_ROLES = ["admin", "client", "free_user"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrateur",
  client: "Client",
  free_user: "Free user",
};

export function isAppRole(value: string): value is AppRole {
  return APP_ROLES.includes(value as AppRole);
}

export function normalizeAppRole(value?: string | null): AppRole {
  return value && isAppRole(value) ? value : "client";
}

export function canOperateWorkspace(role: AppRole): boolean {
  return role !== "free_user";
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
    input.nextRole !== "admin" &&
    input.adminCount <= 1
  ) {
    return {
      allowed: false,
      reason: "Vectis doit conserver au moins un administrateur.",
    };
  }

  return { allowed: true };
}
