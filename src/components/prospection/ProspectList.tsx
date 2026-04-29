"use client";

import { useState, useTransition } from "react";
import { Handshake, CheckSquare, Square } from "lucide-react";
import { BrandResultCard } from "./BrandResultCard";
import { BulkEmailGenerator } from "@/components/emails/BulkEmailGenerator";
import { bulkCreateDeals } from "@/lib/actions/prospection";
import type { ScoreDetails } from "@/types";

type Prospect = {
  id: string;
  score: number | null;
  priority: string | null;
  rationale: string | null;
  recommendedApproach: string | null;
  partnershipType: string | null;
  estimatedValue: string | null;
  status: string;
  scoreDetails: unknown;
  company: {
    id: string;
    name: string;
    sector: string | null;
    country: string | null;
    contactEmail: string | null;
  };
  deal: { id: string; stage: string } | null;
  emails?: { sentAt: Date | null; status: string }[];
};

interface ProspectListProps {
  prospects: Prospect[];
}

export function ProspectList({ prospects }: ProspectListProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllA = () => {
    const aIds = prospects.filter((p) => p.priority === "A" && !p.deal).map((p) => p.id);
    setSelected(new Set(aIds));
  };

  const selectAllBPlus = () => {
    const ids = prospects
      .filter((p) => (p.priority === "A" || p.priority === "B") && !p.deal)
      .map((p) => p.id);
    setSelected(new Set(ids));
  };

  const clearSelection = () => setSelected(new Set());

  const handleBulkDeals = () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    startTransition(async () => {
      const created = await bulkCreateDeals(ids);
      setMessage(`${created} deal${created > 1 ? "s" : ""} créé${created > 1 ? "s" : ""}`);
      setSelected(new Set());
      setTimeout(() => setMessage(""), 4000);
    });
  };

  const countA = prospects.filter((p) => p.priority === "A").length;
  const countB = prospects.filter((p) => p.priority === "B").length;
  const countC = prospects.filter((p) => p.priority === "C").length;
  const withDeal = prospects.filter((p) => p.deal).length;

  return (
    <div className="min-w-0">
      {/* Stats bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="rounded-full bg-[#3EF2A0]/10 px-3 py-1 font-mono text-xs text-[#3EF2A0]">
          {countA} A
        </span>
        <span className="rounded-full bg-[#DDFBEA]/10 px-3 py-1 font-mono text-xs text-[#DDFBEA]">
          {countB} B
        </span>
        <span className="rounded-full bg-white/[0.06] px-3 py-1 font-mono text-xs text-[#8FA69E]">
          {countC} C
        </span>
        {withDeal > 0 && (
          <span className="rounded-full bg-[#f59e0b]/10 px-3 py-1 font-mono text-xs text-[#f59e0b]">
            {withDeal} avec deal
          </span>
        )}
      </div>

      {/* Actions bar */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <button
          onClick={selectAllA}
          className="flex items-center justify-center gap-1.5 rounded-full border border-white/[0.10] px-3 py-2 text-xs text-white/50 transition-colors hover:bg-white/[0.06] sm:py-1.5"
        >
          <CheckSquare className="h-3 w-3" />
          Tous les A
        </button>
        <button
          onClick={selectAllBPlus}
          className="flex items-center justify-center gap-1.5 rounded-full border border-white/[0.10] px-3 py-2 text-xs text-white/50 transition-colors hover:bg-white/[0.06] sm:py-1.5"
        >
          <CheckSquare className="h-3 w-3" />
          A + B
        </button>
        {selected.size > 0 && (
          <>
            <button
              onClick={clearSelection}
              className="flex items-center justify-center gap-1.5 rounded-full border border-white/[0.10] px-3 py-2 text-xs text-[#8FA69E] transition-colors hover:bg-white/[0.06] sm:py-1.5"
            >
              <Square className="h-3 w-3" />
              Désélectionner
            </button>
            <span className="text-xs text-[#8FA69E]">
              {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
            </span>
            <BulkEmailGenerator
              prospectIds={Array.from(selected)}
              onDone={() => setSelected(new Set())}
            />
            <button
              onClick={handleBulkDeals}
              disabled={isPending}
              className="col-span-2 flex items-center justify-center gap-1.5 rounded-full bg-[#F8FAF7] px-3 py-2 text-xs font-semibold text-[#020403] transition-colors hover:bg-[#2CFF93] disabled:opacity-50 sm:ml-auto sm:py-1.5"
            >
              <Handshake className="h-3 w-3" />
              {isPending ? "Création..." : `Créer ${selected.size} deal${selected.size > 1 ? "s" : ""}`}
            </button>
          </>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className="mb-4 rounded-lg border border-[#3EF2A0]/20 bg-[#3EF2A0]/5 px-4 py-2.5 text-sm text-[#3EF2A0]">
          {message}
        </div>
      )}

      {/* Prospect list */}
      <div className="space-y-2">
        {prospects.map((prospect) => (
          <BrandResultCard
            key={prospect.id}
            prospect={{ ...prospect, scoreDetails: prospect.scoreDetails as ScoreDetails | null, emails: prospect.emails }}
            selected={selected.has(prospect.id)}
            onToggle={toggle}
          />
        ))}
      </div>
    </div>
  );
}
