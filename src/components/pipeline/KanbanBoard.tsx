"use client";

import { useState, useTransition } from "react";
import { KanbanColumn } from "./KanbanColumn";
import type { DealData } from "./DealCard";

const STAGES: { key: string; label: string; color: string }[] = [
  { key: "lead", label: "Lead", color: "#6b7280" },
  { key: "contacted", label: "Contacté", color: "#DDFBEA" },
  { key: "meeting", label: "Meeting", color: "#DDFBEA" },
  { key: "negotiation", label: "Négo", color: "#f59e0b" },
  { key: "offer", label: "Offre", color: "#f97316" },
  { key: "signed", label: "Signé", color: "#3EF2A0" },
  { key: "lost", label: "Perdu", color: "#ef4444" },
];

interface KanbanBoardProps {
  initialDeals: DealData[];
}

export function KanbanBoard({ initialDeals }: KanbanBoardProps) {
  const [deals, setDeals] = useState(initialDeals);
  const [isPending, startTransition] = useTransition();

  const handleDrop = (dealId: string, newStage: string) => {
    // Optimistic update
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
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
                ? { ...d, stage: initialDeals.find((o) => o.id === dealId)?.stage || d.stage }
                : d
            )
          );
        }
      } catch {
        // Revert on network error
        setDeals((prev) =>
          prev.map((d) =>
            d.id === dealId
              ? { ...d, stage: initialDeals.find((o) => o.id === dealId)?.stage || d.stage }
              : d
          )
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
    <div>
      {/* Stats bar */}
      <div className="mb-4 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8FA69E]">Deals actifs</span>
          <span className="font-mono text-sm font-bold text-white">{totalDeals}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8FA69E]">Pipeline</span>
          <span className="font-mono text-sm font-bold text-[#DDFBEA]">
            {totalValue.toLocaleString("fr-FR")}€
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8FA69E]">Signé</span>
          <span className="font-mono text-sm font-bold text-[#3EF2A0]">
            {signedValue.toLocaleString("fr-FR")}€
          </span>
        </div>
        {isPending && (
          <span className="ml-auto text-xs text-[#8FA69E] animate-pulse">
            Mise à jour…
          </span>
        )}
      </div>

      {/* Kanban columns */}
      <div className="flex gap-3 overflow-x-auto pb-4">
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
