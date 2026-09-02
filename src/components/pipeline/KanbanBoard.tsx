"use client";

import { useEffect, useState, useTransition } from "react";
import { KanbanColumn } from "./KanbanColumn";
import type { DealData } from "./DealCard";

const STAGES: { key: string; label: string; color: string }[] = [
  { key: "lead", label: "Lead", color: "#6b7280" },
  { key: "contacted", label: "Contacté", color: "#C8CEFF" },
  { key: "meeting", label: "Meeting", color: "#C8CEFF" },
  { key: "negotiation", label: "Négo", color: "#f59e0b" },
  { key: "offer", label: "Offre", color: "#f97316" },
  { key: "signed", label: "Signé", color: "#FF6B3D" },
  { key: "lost", label: "Perdu", color: "#ef4444" },
];

interface KanbanBoardProps {
  initialDeals: DealData[];
}

export function KanbanBoard({ initialDeals }: KanbanBoardProps) {
  const [deals, setDeals] = useState(initialDeals);
  const [isPending, startTransition] = useTransition();

  // Refreshes after sends/revalidation must replace the optimistic local snapshot.
  useEffect(() => {
    setDeals(initialDeals);
  }, [initialDeals]);

  const handleDrop = (dealId: string, newStage: string) => {
    // Optimistic update
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)),
    );

    // Persist to server
    startTransition(async () => {
      try {
        const res = await fetch("/api/deals", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealId, stage: newStage }),
        });
        if (!res.ok) {
          // Revert on error
          setDeals((prev) =>
            prev.map((d) =>
              d.id === dealId
                ? {
                    ...d,
                    stage:
                      initialDeals.find((o) => o.id === dealId)?.stage ||
                      d.stage,
                  }
                : d,
            ),
          );
        }
      } catch {
        // Revert on network error
        setDeals((prev) =>
          prev.map((d) =>
            d.id === dealId
              ? {
                  ...d,
                  stage:
                    initialDeals.find((o) => o.id === dealId)?.stage || d.stage,
                }
              : d,
          ),
        );
      }
    });
  };

  // Stats
  const totalDeals = deals.filter((d) => d.stage !== "lost").length;
  const totalValue = deals
    .filter((d) => d.stage !== "lost" && d.stage !== "signed")
    .reduce((sum, d) => sum + (d.value || 0), 0);
  const signedValue = deals
    .filter((d) => d.stage === "signed")
    .reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div className="min-w-0">
      {/* Stats bar */}
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:items-center lg:gap-6">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 lg:border-0 lg:bg-transparent lg:p-0">
          <span className="text-xs text-[#969BA8]">Deals actifs</span>
          <span className="font-mono text-sm font-bold text-white">
            {totalDeals}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 lg:border-0 lg:bg-transparent lg:p-0">
          <span className="text-xs text-[#969BA8]">Pipeline</span>
          <span className="font-mono text-sm font-bold text-[#C8CEFF]">
            {totalValue.toLocaleString("fr-FR")}€
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 lg:border-0 lg:bg-transparent lg:p-0">
          <span className="text-xs text-[#969BA8]">Signé</span>
          <span className="font-mono text-sm font-bold text-[#FF6B3D]">
            {signedValue.toLocaleString("fr-FR")}€
          </span>
        </div>
        {isPending && (
          <span className="text-xs text-[#969BA8] animate-pulse lg:ml-auto">
            Mise à jour…
          </span>
        )}
      </div>

      {/* Kanban columns */}
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        {STAGES.map((s) => (
          <KanbanColumn
            key={s.key}
            stage={s.key}
            label={s.label}
            color={s.color}
            deals={deals.filter((d) => d.stage === s.key)}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
}
