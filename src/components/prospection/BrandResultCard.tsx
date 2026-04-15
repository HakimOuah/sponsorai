"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import Link from "next/link";
import { EmailGenerator } from "@/components/emails/EmailGenerator";
import type { ScoreDetails } from "@/types";

interface BrandResultCardProps {
  prospect: {
    id: string;
    score: number | null;
    priority: string | null;
    rationale: string | null;
    recommendedApproach: string | null;
    partnershipType: string | null;
    estimatedValue: string | null;
    status: string;
    scoreDetails: ScoreDetails | null;
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
  selected: boolean;
  onToggle: (id: string) => void;
}

const criteriaLabels: Record<string, string> = {
  image_coherence: "Image",
  audience_fit: "Audience",
  sponsoring_history: "Sponsoring",
  conversion_potential: "Conversion",
  accessibility: "Accessibilité",
  timing: "Timing",
};

export function BrandResultCard({ prospect, selected, onToggle }: BrandResultCardProps) {
  const [expanded, setExpanded] = useState(false);

  const priorityColors: Record<string, string> = {
    A: "bg-[#00d4aa]/10 text-[#00d4aa] border-[#00d4aa]/20",
    B: "bg-[#0088ff]/10 text-[#0088ff] border-[#0088ff]/20",
    C: "bg-white/[0.06] text-white/40 border-white/[0.06]",
  };

  const p = prospect.priority || "C";
  const scoreDetails = prospect.scoreDetails as ScoreDetails | null;

  // Check if relance is suggested: contacted > 7 days ago, no reply
  const lastEmail = prospect.emails?.[0];
  const daysSinceContact = lastEmail?.sentAt
    ? Math.floor((Date.now() - new Date(lastEmail.sentAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const needsRelance =
    lastEmail &&
    prospect.status !== "replied" &&
    prospect.status !== "meeting" &&
    prospect.status !== "signed" &&
    daysSinceContact >= 7;

  return (
    <div className={`rounded-xl border transition-all ${selected ? "border-[#00d4aa]/30 bg-[#00d4aa]/[0.02]" : "border-white/[0.06] bg-[#0c1019]"}`}>
      {/* Main row */}
      <div className="flex items-center gap-3 p-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(prospect.id)}
          className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#00d4aa] focus:ring-[#00d4aa]/50 shrink-0"
        />

        {/* Priority badge */}
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-mono text-sm font-bold ${priorityColors[p]}`}>
          {p}
        </span>

        {/* Brand info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white truncate">{prospect.company.name}</h3>
            {prospect.deal && (
              <span className="rounded-full bg-[#00d4aa]/10 px-2 py-0.5 font-mono text-[10px] text-[#00d4aa]">
                deal
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            {prospect.company.sector && <span>{prospect.company.sector}</span>}
            {prospect.company.country && (
              <>
                <span>·</span>
                <span>{prospect.company.country}</span>
              </>
            )}
            {prospect.company.contactEmail && (
              <>
                <span>·</span>
                <span className="text-[#0088ff]">contact</span>
              </>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="text-right shrink-0">
          <span className="font-mono text-lg font-bold text-white">
            {prospect.score ?? "—"}
          </span>
          <span className="text-xs text-white/30">/10</span>
        </div>

        {/* Status */}
        <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] capitalize shrink-0 ${statusColor(prospect.status)}`}>
          {prospect.status}
        </span>

        {/* Relance badge */}
        {needsRelance && (
          <Link
            href={`/agents?prospect=${prospect.id}#relanceur`}
            className="flex items-center gap-1 rounded-full bg-[#ec4899]/10 px-2 py-0.5 text-[10px] font-medium text-[#ec4899] hover:bg-[#ec4899]/20 transition-colors shrink-0"
          >
            <RefreshCw className="h-3 w-3" />
            Relance {daysSinceContact}j
          </Link>
        )}

        {/* Expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 text-white/30 hover:text-white/60 transition-colors shrink-0"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-white/[0.06] px-4 pb-4 pt-3">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Left: rationale + approach */}
            <div className="space-y-3">
              {prospect.rationale && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-white/30 mb-1">Rationnel</p>
                  <p className="text-sm text-white/70">{prospect.rationale}</p>
                </div>
              )}
              {prospect.recommendedApproach && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-white/30 mb-1">Approche recommandée</p>
                  <p className="text-sm text-white/70">{prospect.recommendedApproach}</p>
                </div>
              )}
              <div className="flex items-center gap-3">
                {prospect.partnershipType && (
                  <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs text-white/50">
                    {prospect.partnershipType}
                  </span>
                )}
                {prospect.estimatedValue && (
                  <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs text-white/50">
                    Budget: {prospect.estimatedValue}
                  </span>
                )}
              </div>

              {/* Email generator */}
              <EmailGenerator
                prospectId={prospect.id}
                companyName={prospect.company.name}
              />
            </div>

            {/* Right: score breakdown */}
            {scoreDetails && (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/30 mb-2">Score détaillé</p>
                <div className="space-y-1.5">
                  {Object.entries(scoreDetails).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs text-white/40 w-24 shrink-0">
                        {criteriaLabels[key] || key}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-[#00d4aa]"
                          style={{ width: `${(value as number) * 10}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-white/50 w-6 text-right">
                        {value as number}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function statusColor(status: string): string {
  const colors: Record<string, string> = {
    new: "bg-white/[0.06] text-white/50",
    contacted: "bg-[#0088ff]/10 text-[#0088ff]",
    replied: "bg-[#00d4aa]/10 text-[#00d4aa]",
    meeting: "bg-[#8b5cf6]/10 text-[#8b5cf6]",
    offer: "bg-[#f59e0b]/10 text-[#f59e0b]",
    signed: "bg-[#00d4aa]/15 text-[#00d4aa]",
    lost: "bg-red-500/10 text-red-400",
  };
  return colors[status] || colors.new;
}
