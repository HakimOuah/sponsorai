"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ArrowUpRight,
  MailCheck,
  Building2,
} from "lucide-react";
import Link from "@/components/layout/NavigationLink";
import { EnrichButton } from "@/components/companies/EnrichButton";
import { AgentAvatar } from "@/components/agents/experience/AgentAvatar";
import { WriterHandoffModal } from "@/components/agents/experience/WriterHandoffModal";
import { OutreachApproval } from "./OutreachApproval";
import { ProspectFeedback } from "./ProspectFeedback";
import type { ScoreDetails } from "@/types";
import type { ProspectionProspect } from "./types";

interface BrandResultCardProps {
  prospect: ProspectionProspect;
  selected: boolean;
  onToggle: (id: string) => void;
  canOperate: boolean;
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
  canOperate,
}: BrandResultCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [writerOpen, setWriterOpen] = useState(false);

  const priorityColors: Record<string, string> = {
    A: "bg-[#FF6B3D]/10 text-[#FF6B3D] border-[#FF6B3D]/20",
    B: "bg-[#C8CEFF]/10 text-[#C8CEFF] border-[#C8CEFF]/20",
    C: "bg-white/[0.06] text-[#969BA8] border-[#FF6B3D]/10",
  };

  const p = prospect.priority || "C";
  const scoreDetails = prospect.scoreDetails as ScoreDetails | null;
  const readiness = prospect.company.readiness;
  const canWriteEmail =
    readiness.status !== "incomplete" && Boolean(readiness.bestContactId);
  const readyContacts = prospect.company.contacts.filter(
    (contact) => contact.readinessStatus !== "incomplete",
  );
  const generic = readiness.status === "ready_generic";
  const primaryContact = readyContacts.find(
    (contact) => contact.id === readiness.bestContactId,
  );

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
    <>
      <div
        className={`rounded-2xl border transition-all ${selected ? "border-[#FF6B3D]/30 bg-[#FF6B3D]/[0.02]" : "border-[#FF6B3D]/10 bg-[#141720]"}`}
      >
        {/* Main row */}
        <div
          className={`grid ${canOperate ? "grid-cols-[auto_auto_minmax(0,1fr)_auto]" : "grid-cols-[auto_minmax(0,1fr)_auto]"} gap-3 p-3 sm:flex sm:items-center sm:p-4`}
        >
          {/* Checkbox */}
          {canOperate ? (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggle(prospect.id)}
              aria-label={`Sélectionner ${prospect.company.name} pour ${prospect.player.firstName} ${prospect.player.lastName}`}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#FF6B3D] focus:ring-[#FF6B3D]/50 shrink-0"
            />
          ) : null}

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
                <Link
                  href={`/companies/${prospect.company.id}`}
                  className="hover:text-[#C8CEFF]"
                >
                  {prospect.company.name}
                </Link>
              </h3>
              {prospect.deal && (
                <span className="rounded-full bg-[#FF6B3D]/10 px-2 py-0.5 font-mono text-[10px] text-[#FF6B3D]">
                  deal
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#969BA8]">
              {prospect.company.sector && (
                <span>{prospect.company.sector}</span>
              )}
              {prospect.company.country && (
                <>
                  <span>·</span>
                  <span>{prospect.company.country}</span>
                </>
              )}
            </div>
            <p className="mt-1 truncate text-xs text-white/45">
              {prospect.player.firstName} {prospect.player.lastName} ·{" "}
              {prospect.player.club}
            </p>
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
          {canOperate && needsRelance && (
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
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-controls={`prospect-details-${prospect.id}`}
            aria-label={`${expanded ? "Masquer" : "Afficher"} les détails de ${prospect.company.name}`}
            className="flex h-11 w-11 items-center justify-center justify-self-end rounded-full text-[#969BA8] transition-colors hover:bg-white/[0.05] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C8CEFF] sm:shrink-0"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p
              className={`flex items-center gap-2 text-xs font-medium ${canWriteEmail ? (generic ? "text-[#F6C978]" : "text-[#D9DDFF]") : "text-[#969BA8]"}`}
            >
              {generic ? (
                <Building2 className="h-4 w-4 shrink-0" />
              ) : (
                <MailCheck className="h-4 w-4 shrink-0" />
              )}
              {canWriteEmail
                ? generic
                  ? "Boîte générique vérifiée · solution de secours"
                  : "Contact nominatif · email vérifié"
                : "Contact à compléter ou à vérifier"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#969BA8]">
              {canWriteEmail
                ? generic
                  ? "Adresse officielle de l’entreprise, sans destinataire personnel garanti."
                  : `${primaryContact?.roleRaw || "Responsable partenariats"} · coordonnées protégées`
                : "L’opportunité est conservée. Consultez la fiche marque pour examiner les contacts disponibles."}
            </p>
          </div>
          {canOperate && canWriteEmail ? (
            <button
              type="button"
              onClick={() => setWriterOpen(true)}
              className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#C8CEFF]/25 bg-[#C8CEFF]/10 px-4 py-2 text-sm font-medium text-[#D9DDFF] transition-colors hover:bg-[#C8CEFF]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8CEFF]"
            >
              <AgentAvatar agentId="redacteur" size="sm" /> Rédiger un mail
            </button>
          ) : (
            <Link
              href={`/companies/${prospect.company.id}`}
              className="flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border border-white/[0.10] px-4 py-2 text-xs text-[#C8CEFF] hover:bg-white/[0.05]"
            >
              Voir la marque <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {/* Expanded details */}
        {expanded && (
          <div
            id={`prospect-details-${prospect.id}`}
            className="border-t border-[#FF6B3D]/10 px-4 pb-4 pt-3"
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Left: rationale + approach */}
              <div className="space-y-3">
                {prospect.rationale && (
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-[#969BA8] mb-1">
                      Rationnel
                    </p>
                    <p className="text-sm text-white/70">
                      {prospect.rationale}
                    </p>
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

                {canOperate && canWriteEmail ? (
                  <OutreachApproval
                    prospectId={prospect.id}
                    approved={Boolean(prospect.outreachApprovedAt)}
                    selectedContactId={
                      readyContacts.some(
                        (contact) => contact.id === prospect.selectedContactId,
                      )
                        ? prospect.selectedContactId
                        : readiness.bestContactId
                    }
                    contacts={readyContacts}
                    legacyContactReady={false}
                  />
                ) : null}
                {canOperate ? (
                  <ProspectFeedback prospectId={prospect.id} />
                ) : null}
                {canOperate && !canWriteEmail ? (
                  <EnrichButton
                    companyId={prospect.company.id}
                    companyName={prospect.company.name}
                    companyCountry={prospect.company.country}
                    prospects={[
                      {
                        id: prospect.id,
                        athleteName: `${prospect.player.firstName} ${prospect.player.lastName}`,
                        club: prospect.player.club,
                      },
                    ]}
                  />
                ) : null}
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
      {writerOpen && canOperate && canWriteEmail ? (
        <WriterHandoffModal
          open
          onClose={() => setWriterOpen(false)}
          companyName={prospect.company.name}
          companyCountry={prospect.company.country}
          initialContactId={readiness.bestContactId || undefined}
          origin="company"
          contacts={readyContacts.map((contact) => ({
            id: contact.id,
            role:
              contact.readinessStatus === "ready_generic"
                ? "Boîte officielle de l’entreprise"
                : contact.roleRaw,
            currentRoleVerified: true,
            contactability: "verified",
            score: contact.contactScore,
            emailKind:
              contact.readinessStatus === "ready_generic"
                ? "functional_generic"
                : "personal_professional",
          }))}
          prospects={[
            {
              id: prospect.id,
              athleteName: `${prospect.player.firstName} ${prospect.player.lastName}`,
              club: prospect.player.club,
            },
          ]}
        />
      ) : null}
    </>
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
