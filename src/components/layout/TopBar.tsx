"use client";

import { signOut, useSession } from "next-auth/react";
import { Eye, LogOut, Menu, ShieldCheck, User } from "lucide-react";
import { BreadcrumbNav } from "./BreadcrumbNav";

export function TopBar({
  onMenuClick,
  isReadOnly,
}: {
  onMenuClick: () => void;
  isReadOnly: boolean;
}) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 border-b border-[#FF6B3D]/10 bg-[#0B0D12]/70 px-3 py-3 backdrop-blur-2xl sm:px-4 lg:px-8">
      <div className="flex min-h-12 items-center justify-between gap-3 rounded-3xl border border-white/[0.10] bg-white/[0.035] px-3 py-2 shadow-[0_18px_70px_rgba(0,0,0,0.22)] sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.045] text-[#C8CEFF] transition-colors hover:bg-white/[0.08] lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <BreadcrumbNav />
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div
            className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold sm:flex ${
              isReadOnly
                ? "border-[#C8CEFF]/20 bg-[#C8CEFF]/10 text-[#D9DDFF]"
                : "border-[#FF6B3D]/15 bg-[#FF6B3D]/10 text-[#FFE4D8]"
            }`}
          >
            {isReadOnly ? (
              <Eye className="h-3.5 w-3.5 text-[#C8CEFF]" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5 text-[#FF6B3D]" />
            )}
            {isReadOnly ? "Mode découverte" : "Système actif"}
          </div>
          {session?.user && (
            <div className="flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-[#0B0D12]/55 px-1.5 py-1.5 sm:gap-2 sm:px-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C8CEFF]/10">
                <User className="h-3.5 w-3.5 text-[#C8CEFF]" />
              </div>
              <span className="hidden text-sm text-[#D5D7DF]/78 sm:inline">
                {session.user.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="ml-1 rounded-full p-1.5 text-[#969BA8] transition-colors hover:bg-white/[0.06] hover:text-[#F6F4EF]"
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
