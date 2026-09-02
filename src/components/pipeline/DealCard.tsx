"use client";

import { Calendar, ArrowRight } from "lucide-react";
import Link from "@/components/layout/NavigationLink";

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
    A: "bg-[#FF6B3D]/10 text-[#FF6B3D]",
    B: "bg-[#C8CEFF]/10 text-[#C8CEFF]",
    C: "bg-white/[0.06] text-[#969BA8]",
  };

  const nextDate = deal.nextActionDate ? new Date(deal.nextActionDate) : null;
  const isOverdue = nextDate && nextDate < new Date();

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("dealId", deal.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="cursor-grab rounded-2xl border border-[#FF6B3D]/10 bg-[#141720]/90 p-3 transition-colors hover:border-white/[0.12] active:cursor-grabbing"
    >
      {/* Company */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-sm text-white truncate">
          {deal.company.name}
        </h4>
        {deal.prospect.priority && (
          <span
            className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold shrink-0 ml-2 ${priorityColors[deal.prospect.priority] || priorityColors.C}`}
          >
            {deal.prospect.priority}
          </span>
        )}
      </div>

      {/* Player */}
      <p className="text-xs text-[#969BA8] mb-2">
        {deal.player.firstName} {deal.player.lastName}
        <span className="text-[#969BA8]/55"> · {deal.player.club}</span>
      </p>

      {/* Value + Type */}
      <div className="flex items-center gap-2 mb-2">
        {deal.value && (
          <span className="font-mono text-xs text-[#FF6B3D]">
            {deal.value.toLocaleString("fr-FR")} {deal.currency}
          </span>
        )}
        {deal.dealType && (
          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-[#969BA8]">
            {deal.dealType}
          </span>
        )}
      </div>

      {/* Next action */}
      {deal.nextAction && (
        <div
          className={`flex items-center gap-1.5 text-xs ${isOverdue ? "text-red-400" : "text-[#969BA8]"}`}
        >
          <ArrowRight className="h-3 w-3" />
          <span className="truncate">{deal.nextAction}</span>
          {nextDate && (
            <>
              <Calendar className="h-3 w-3 ml-auto shrink-0" />
              <span className="shrink-0">
                {nextDate.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </>
          )}
        </div>
      )}
      <Link
        href={`/pipeline/${deal.id}`}
        className="mt-3 inline-flex items-center gap-1 text-[11px] text-[#FF6B3D] hover:underline"
      >
        Ouvrir le workspace <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
