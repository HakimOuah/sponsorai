import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type UserAccess = {
  authenticated: boolean;
  isAdmin: boolean;
  userId: string | null;
  userName: string | null;
};

export async function getCurrentUserAccess(): Promise<UserAccess> {
  const session = await getServerSession(authOptions);

  return {
    authenticated: Boolean(session?.user),
    isAdmin: session?.user?.role === "admin",
    userId: session?.user?.id || null,
    userName: session?.user?.name || null,
  };
}
