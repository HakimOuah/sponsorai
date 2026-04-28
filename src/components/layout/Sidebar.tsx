"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Kanban,
  Search,
  Mail,
  Bot,
  Radar,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navSections = [
  {
    label: "Ventes",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Pipeline", href: "/pipeline", icon: Kanban },
    ],
  },
  {
    label: "Croissance",
    items: [
      { label: "Joueurs", href: "/players", icon: Users },
      { label: "Prospection", href: "/prospection", icon: Search },
      { label: "Entreprises", href: "/companies", icon: Building2 },
    ],
  },
  {
    label: "Opérations",
    items: [
      { label: "Emails", href: "/emails", icon: Mail },
      { label: "Agents IA", href: "/agents", icon: Bot },
      { label: "Veille", href: "/veille", icon: Radar },
    ],
  },
  {
    label: "Système",
    items: [
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
      { label: "Paramètres", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[#3EF2A0]/10 bg-[#020403]/95 shadow-[24px_0_80px_rgba(0,0,0,0.32)] backdrop-blur-2xl transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-[#3EF2A0]/10 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-[0_0_24px_rgba(62,242,160,0.12)]">
          <Zap className="h-4 w-4 text-[#3EF2A0]" />
        </div>
        {!collapsed && (
          <span className="text-base font-semibold tracking-[-0.03em] text-[#F8FAF7]">
            Vectis<span className="text-[#3EF2A0]">Agency</span>
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {navSections.map((section) => (
          <div key={section.label} className="mb-5">
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8FA69E]/70">
                {section.label}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "border-[#3EF2A0]/25 bg-[#3EF2A0]/10 text-[#DDFBEA] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_28px_rgba(62,242,160,0.06)]"
                          : "border-transparent text-[#8FA69E] hover:border-white/[0.10] hover:bg-white/[0.045] hover:text-[#F8FAF7]"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-[#3EF2A0]" : "text-[#8FA69E]/70"
                        )}
                      />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      {!collapsed && (
        <div className="mx-3 mb-3 rounded-3xl border border-[#3EF2A0]/15 bg-[#003F32]/20 p-4">
          <p className="text-xs font-semibold text-[#DDFBEA]">Pipeline IA</p>
          <p className="mt-1 text-[11px] leading-5 text-[#8FA69E]">
            Prospection, scoring et relances sous contrôle.
          </p>
        </div>
      )}

      <div className="border-t border-[#3EF2A0]/10 p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-2xl border border-[#3EF2A0]/10 p-2 text-[#8FA69E] transition-colors hover:bg-white/[0.05] hover:text-[#F8FAF7]"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
