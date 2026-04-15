"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  players: "Joueurs",
  companies: "Entreprises",
  pipeline: "Pipeline",
  prospection: "Prospection",
  emails: "Emails",
  templates: "Templates",
  agents: "Agents IA",
  analytics: "Analytics",
  settings: "Paramètres",
};

export function BreadcrumbNav() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm">
      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const isLast = index === segments.length - 1;
        const label = routeLabels[segment] || segment;

        return (
          <span key={href} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-3 w-3 text-white/20" />
            )}
            {isLast ? (
              <span className="text-white font-medium">{label}</span>
            ) : (
              <Link
                href={href}
                className="text-white/40 hover:text-white/70 transition-colors"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
