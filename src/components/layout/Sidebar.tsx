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
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/[0.08] bg-[#0a0d14] transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-white/[0.08] px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00d4aa]/10">
          <Zap className="h-4 w-4 text-[#00d4aa]" />
        </div>
        {!collapsed && (
          <span className="text-lg font-semibold text-white">
            Sponsor<span className="text-[#00d4aa]">AI</span>
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {navSections.map((section) => (
          <div key={section.label} className="mb-4">
            {!collapsed && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
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
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-[#00d4aa]/10 text-[#00d4aa]"
                          : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-[#00d4aa]" : "text-white/40"
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
      <div className="border-t border-white/[0.08] p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-white/40 hover:bg-white/[0.04] hover:text-white transition-colors"
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
