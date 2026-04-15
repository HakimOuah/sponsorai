"use client";

import { useState } from "react";
import { DealCard, type DealData } from "./DealCard";

interface KanbanColumnProps {
  stage: string;
  label: string;
  color: string;
  deals: DealData[];
  onDrop: (dealId: string, stage: string) => void;
}

export function KanbanColumn({ stage, label, color, deals, onDrop }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div
      className={`flex w-72 shrink-0 flex-col rounded-xl border transition-colors ${
        isDragOver
          ? "border-[#00d4aa]/30 bg-[#00d4aa]/[0.02]"
          : "border-white/[0.06] bg-[#0c1019]/50"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const dealId = e.dataTransfer.getData("dealId");
        if (dealId) onDrop(dealId, stage);
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs font-semibold text-white/70">{label}</span>
          <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-white/30">
            {deals.length}
          </span>
        </div>
        {totalValue > 0 && (
          <span className="font-mono text-[10px] text-white/30">
            {totalValue.toLocaleString("fr-FR")}€
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2 overflow-y-auto p-2" style={{ maxHeight: "calc(100vh - 240px)" }}>
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
        {deals.length === 0 && (
          <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-white/[0.06] text-xs text-white/15">
            Glisser ici
          </div>
        )}
      </div>
    </div>
  );
}
