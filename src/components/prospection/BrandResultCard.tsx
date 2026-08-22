"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import Link from "next/link";
import { EmailGenerator } from "@/components/emails/EmailGenerator";
import { EnrichButton } from "@/components/companies/EnrichButton";
import { OutreachApproval } from "./OutreachApproval";
import { ProspectFeedback } from "./ProspectFeedback";
import { hasActionableContact } from "@/lib/agents/contact-quality";
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
    outreachApprovedAt: Date | null;
    selectedContactId: string | null;
    scoreDetails: ScoreDetails | null;
    player: {
      firstName: string;
      lastName: string;
      club: string;
    };
    company: {
      id: string;
      name: string;
      sector: string | null;
      country: string | null;
      outreachReady: boolean;
      contacts: {
        id: string;
        roleRaw: string;
        roleNormalized: string;
        employmentStatus: string;
        contactability: string;
        relevanceScore: number;
        contactScore: number | null;
      }[];
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

export function BrandResultCard({
  prospect,
  selected,
  onToggle,
}: BrandResultCardProps) {
  const [expanded, setExpanded] = useState(false);

  const priorityColors: Record<string, string> = {
    A: "bg-[#FF6B3D]/10 text-[#FF6B3D] border-[#FF6B3D]/20",
    B: "bg-[#C8CEFF]/10 text-[#C8CEFF] border-[#C8CEFF]/20",
    C: "bg-white/[0.06] text-[#969BA8] border-[#FF6B3D]/10",
  };

  const p = prospect.priority || "C";
  const scoreDetails = prospect.scoreDetails as ScoreDetails | null;
  const canWriteEmail = hasActionableContact(prospect.company.contacts);

  // Check if relance is suggested: contacted > 7 days ago, no reply
  const lastEmail = prospect.emails?.[0];
  const daysSinceContact = lastEmail?.sentAt
    ? Math.floor(
        (Date.now() - new Date(lastEmail.sentAt).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;
  const needsRelance =
    lastEmail &&
    prospect.status !== "replied" &&
    prospect.status !== "meeting" &&
    prospect.status !== "signed" &&
    daysSinceContact >= 7;

  return (
    <div
      className={`rounded-2xl border transition-all ${selected ? "border-[#FF6B3D]/30 bg-[#FF6B3D]/[0.02]" : "border-[#FF6B3D]/10 bg-[#141720]"}`}
    >
      {/* Main row */}
      <div className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] gap-3 p-3 sm:flex sm:items-center sm:p-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(prospect.id)}
          className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#FF6B3D] focus:ring-[#FF6B3D]/50 shrink-0"
        />

        {/* Priority badge */}
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-mono text-sm font-bold ${priorityColors[p]}`}
        >
          {p}
        </span>

        {/* Brand info */}
        <div className="min-w-0 sm:flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white truncate">
              {prospect.company.name}
            </h3>
            {prospect.deal && (
              <span className="rounded-full bg-[#FF6B3D]/10 px-2 py-0.5 font-mono text-[10px] text-[#FF6B3D]">
                deal
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#969BA8]">
            {prospect.company.sector && <span>{prospect.company.sector}</span>}
            {prospect.company.country && (
              <>
                <span>·</span>
                <span>{prospect.company.country}</span>
              </>
            )}
            {(prospect.company.outreachReady ||
              prospect.company.contacts.length > 0) && (
              <>
                <span>·</span>
                <span className="text-[#C8CEFF]">contact</span>
              </>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="text-right shrink-0">
          <span className="font-mono text-lg font-bold text-white">
            {prospect.score ?? "—"}
          </span>
          <span className="text-xs text-[#969BA8]">/10</span>
        </div>

        {/* Status */}
        <span
          className={`col-span-2 w-fit rounded-full px-2 py-0.5 font-mono text-[11px] capitalize shrink-0 sm:col-span-1 ${statusColor(prospect.status)}`}
        >
          {prospect.status}
        </span>

        {/* Relance badge */}
        {needsRelance && (
          <Link
            href={`/agents?prospect=${prospect.id}#relanceur`}
            className="col-span-2 flex w-fit items-center gap-1 rounded-full bg-[#f59e0b]/10 px-2 py-0.5 text-[10px] font-medium text-[#f59e0b] transition-colors hover:bg-[#f59e0b]/20 sm:col-span-1"
          >
            <RefreshCw className="h-3 w-3" />
            Relance {daysSinceContact}j
          </Link>
        )}

        {/* Expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="justify-self-end p-1 text-[#969BA8] transition-colors hover:text-white/60 sm:shrink-0"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-[#FF6B3D]/10 px-4 pb-4 pt-3">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Left: rationale + approach */}
            <div className="space-y-3">
              {prospect.rationale && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[#969BA8] mb-1">
                    Rationnel
                  </p>
                  <p className="text-sm text-white/70">{prospect.rationale}</p>
                </div>
              )}
              {prospect.recommendedApproach && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[#969BA8] mb-1">
                    Approche recommandée
                  </p>
                  <p className="text-sm text-white/70">
                    {prospect.recommendedApproach}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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

              {canWriteEmail ? (
                <OutreachApproval
                  prospectId={prospect.id}
                  approved={Boolean(prospect.outreachApprovedAt)}
                  selectedContactId={prospect.selectedContactId}
                  contacts={prospect.company.contacts}
                  legacyContactReady={prospect.company.outreachReady}
                />
              ) : null}
              <ProspectFeedback prospectId={prospect.id} />
              {canWriteEmail ? (
                <EmailGenerator
                  prospectId={prospect.id}
                  companyName={prospect.company.name}
                  companyCountry={prospect.company.country}
                />
              ) : (
                <EnrichButton
                  companyId={prospect.company.id}
                  companyName={prospect.company.name}
                  companyCountry={prospect.company.country}
                  prospects={[{
                    id: prospect.id,
                    athleteName: `${prospect.player.firstName} ${prospect.player.lastName}`,
                    club: prospect.player.club,
                  }]}
                />
              )}
            </div>

            {/* Right: score breakdown */}
            {scoreDetails && (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#969BA8] mb-2">
                  Score détaillé
                </p>
                <div className="space-y-1.5">
                  {Object.entries(scoreDetails).map(([key, value]) => (
                    <div
                      key={key}
                      className="grid grid-cols-[5rem_minmax(0,1fr)_1.5rem] items-center gap-2 sm:grid-cols-[6rem_minmax(0,1fr)_1.5rem]"
                    >
                      <span className="truncate text-xs text-[#969BA8]">
                        {criteriaLabels[key] || key}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-[#FF6B3D]"
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
    contacted: "bg-[#C8CEFF]/10 text-[#C8CEFF]",
    replied: "bg-[#FF6B3D]/10 text-[#FF6B3D]",
    meeting: "bg-[#C8CEFF]/10 text-[#C8CEFF]",
    offer: "bg-[#f59e0b]/10 text-[#f59e0b]",
    signed: "bg-[#FF6B3D]/15 text-[#FF6B3D]",
    lost: "bg-red-500/10 text-red-400",
  };
  return colors[status] || colors.new;
}
