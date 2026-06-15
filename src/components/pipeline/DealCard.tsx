"use client";

import { Calendar, ArrowRight } from "lucide-react";

export interface DealData {
  id: string;
  stage: string;
  value: number | null;
  currency: string;
  dealType: string | null;
  nextAction: string | null;
  nextActionDate: Date | string | null;
  player: { firstName: string; lastName: string; club: string };
  company: { name: string; sector: string | null };
  prospect: { priority: string | null; score: number | null };
}

interface DealCardProps {
  deal: DealData;
}

export function DealCard({ deal }: DealCardProps) {
  const priorityColors: Record<string, string> = {
    A: "bg-[#3EF2A0]/10 text-[#3EF2A0]",
    B: "bg-[#DDFBEA]/10 text-[#DDFBEA]",
    C: "bg-white/[0.06] text-[#8FA69E]",
  };

  const nextDate = deal.nextActionDate
    ? new Date(deal.nextActionDate)
    : null;
  const isOverdue = nextDate && nextDate < new Date();

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("dealId", deal.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="cursor-grab rounded-2xl border border-[#3EF2A0]/10 bg-[#061511]/90 p-3 transition-colors hover:border-white/[0.12] active:cursor-grabbing"
    >
      {/* Company */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-sm text-white truncate">
          {deal.company.name}
        </h4>
        {deal.prospect.priority && (
          <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold shrink-0 ml-2 ${priorityColors[deal.prospect.priority] || priorityColors.C}`}>
            {deal.prospect.priority}
          </span>
        )}
      </div>

      {/* Player */}
      <p className="text-xs text-[#8FA69E] mb-2">
        {deal.player.firstName} {deal.player.lastName}
        <span className="text-[#8FA69E]/55"> · {deal.player.club}</span>
      </p>

      {/* Value + Type */}
      <div className="flex items-center gap-2 mb-2">
        {deal.value && (
          <span className="font-mono text-xs text-[#3EF2A0]">
            {deal.value.toLocaleString("fr-FR")} {deal.currency}
          </span>
        )}
        {deal.dealType && (
          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-[#8FA69E]">
            {deal.dealType}
          </span>
        )}
      </div>

      {/* Next action */}
      {deal.nextAction && (
        <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? "text-red-400" : "text-[#8FA69E]"}`}>
          <ArrowRight className="h-3 w-3" />
          <span className="truncate">{deal.nextAction}</span>
          {nextDate && (
            <>
              <Calendar className="h-3 w-3 ml-auto shrink-0" />
              <span className="shrink-0">
                {nextDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
