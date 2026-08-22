"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  X,
  Zap,
  UserCog,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

interface NavigationSection {
  label: string;
  items: NavigationItem[];
}

const navSections: NavigationSection[] = [
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
      { label: "Talents", href: "/players", icon: Users },
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
      {
        label: "Utilisateurs",
        href: "/admin/users",
        icon: UserCog,
        adminOnly: true,
      },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  isAdmin: boolean;
  onCollapseToggle: () => void;
  onMobileClose: () => void;
}

export function Sidebar({
  collapsed,
  mobileOpen,
  isAdmin,
  onCollapseToggle,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const showExpanded = !collapsed || mobileOpen;

  return (
    <>
      <button
        type="button"
        aria-label="Fermer le menu"
        onClick={onMobileClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/55 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-dvh w-[min(84vw,18rem)] flex-col border-r border-[#FF6B3D]/10 bg-[#0B0D12]/95 shadow-[24px_0_80px_rgba(0,0,0,0.32)] backdrop-blur-2xl transition-all duration-300 lg:z-40 lg:h-screen",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-16" : "lg:w-60",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-[#FF6B3D]/10 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[#FF6B3D]/25 bg-[#FF6B3D]/10 shadow-[0_0_24px_rgba(255,107,61,0.12)]">
            <Zap className="h-4 w-4 text-[#FF6B3D]" />
          </div>
          <span
            className={cn(
              "min-w-0 text-base font-semibold tracking-[-0.03em] text-[#F6F4EF]",
              !showExpanded && "lg:hidden",
            )}
          >
            Vectis<span className="text-[#FF6B3D]">Agency</span>
          </span>
          <button
            type="button"
            onClick={onMobileClose}
            className="ml-auto rounded-full border border-white/[0.10] p-2 text-[#969BA8] transition-colors hover:bg-white/[0.06] hover:text-[#F6F4EF] lg:hidden"
            aria-label="Fermer le menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {navSections.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.adminOnly || isAdmin,
            );

            return (
              <div key={section.label} className="mb-5">
                {showExpanded ? (
                  <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#969BA8]/70">
                    {section.label}
                  </p>
                ) : null}
                <ul className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" &&
                        pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onMobileClose}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            isActive
                              ? "border-[#FF6B3D]/25 bg-[#FF6B3D]/10 text-[#F6F4EF] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_28px_rgba(255,107,61,0.06)]"
                              : "border-transparent text-[#969BA8] hover:border-white/[0.10] hover:bg-white/[0.045] hover:text-[#F6F4EF]",
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isActive
                                ? "text-[#FF6B3D]"
                                : "text-[#969BA8]/70",
                            )}
                          />
                          {showExpanded ? <span>{item.label}</span> : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        {showExpanded && (
          <div className="mx-3 mb-3 rounded-3xl border border-[#FF6B3D]/15 bg-[linear-gradient(135deg,rgba(255,107,61,0.09),rgba(200,206,255,0.04))] p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B3D] shadow-[0_0_12px_rgba(255,107,61,0.8)]" />
              <p className="text-xs font-semibold text-[#F6F4EF]">
                Pipeline IA
              </p>
            </div>
            <p className="mt-1 text-[11px] leading-5 text-[#969BA8]">
              Prospection, scoring et relances sous contrôle.
            </p>
          </div>
        )}

        <div className="border-t border-[#FF6B3D]/10 p-3">
          <button
            onClick={onCollapseToggle}
            className="hidden w-full items-center justify-center rounded-2xl border border-[#FF6B3D]/10 p-2 text-[#969BA8] transition-colors hover:bg-white/[0.05] hover:text-[#F6F4EF] lg:flex"
            aria-label={collapsed ? "Déplier le menu" : "Réduire le menu"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
