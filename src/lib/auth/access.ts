import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  canOperateWorkspace,
  normalizeAppRole,
  type AppRole,
} from "@/lib/auth/roles";

export type UserAccess = {
  authenticated: boolean;
  isAdmin: boolean;
  isFreeUser: boolean;
  canOperate: boolean;
  role: AppRole;
  userId: string | null;
  userName: string | null;
};

export async function getCurrentUserAccess(): Promise<UserAccess> {
  const session = await getServerSession(authOptions);
  const role = normalizeAppRole(session?.user?.role);

  return {
    authenticated: Boolean(session?.user),
    isAdmin: role === "admin",
    isFreeUser: role === "free_user",
    canOperate: Boolean(session?.user) && canOperateWorkspace(role),
    role,
    userId: session?.user?.id || null,
    userName: session?.user?.name || null,
  };
}

export async function requireOperationalAccess(): Promise<UserAccess> {
  const access = await getCurrentUserAccess();
  if (!access.authenticated) throw new Error("AUTHENTICATION_REQUIRED");
  if (!access.canOperate) throw new Error("READ_ONLY_ACCESS");
  return access;
}
