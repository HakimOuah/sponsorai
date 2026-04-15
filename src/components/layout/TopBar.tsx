"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { BreadcrumbNav } from "./BreadcrumbNav";

export function TopBar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.08] bg-[#07090f]/80 px-6 backdrop-blur-md">
      <BreadcrumbNav />

      <div className="flex items-center gap-3">
        {session?.user && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
              <User className="h-3.5 w-3.5 text-white/60" />
            </div>
            <span className="text-sm text-white/60">
              {session.user.name}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="ml-1 rounded-md p-1.5 text-white/30 hover:bg-white/[0.06] hover:text-white/60 transition-colors"
              title="Déconnexion"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
