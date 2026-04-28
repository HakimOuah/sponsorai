"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, ShieldCheck, User } from "lucide-react";
import { BreadcrumbNav } from "./BreadcrumbNav";

export function TopBar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 border-b border-[#3EF2A0]/10 bg-[#020403]/70 px-6 py-3 backdrop-blur-2xl lg:px-8">
      <div className="flex h-12 items-center justify-between rounded-3xl border border-white/[0.10] bg-white/[0.035] px-4 shadow-[0_18px_70px_rgba(0,0,0,0.22)]">
      <BreadcrumbNav />

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-[#3EF2A0]/15 bg-[#3EF2A0]/10 px-3 py-1.5 text-xs font-semibold text-[#DDFBEA] sm:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-[#3EF2A0]" />
          Système actif
        </div>
        {session?.user && (
          <div className="flex items-center gap-2 rounded-full border border-white/[0.10] bg-[#020403]/55 px-2 py-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06]">
              <User className="h-3.5 w-3.5 text-[#DDFBEA]" />
            </div>
            <span className="hidden text-sm text-[#D8DEDA]/78 sm:inline">
              {session.user.name}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="ml-1 rounded-full p-1.5 text-[#8FA69E] transition-colors hover:bg-white/[0.06] hover:text-[#F8FAF7]"
              title="Déconnexion"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      </div>
    </header>
  );
}
