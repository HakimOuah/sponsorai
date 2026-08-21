import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  FileSignature,
  FileText,
  History,
} from "lucide-react";
import { getDealWorkspace } from "@/lib/actions/deal-workflow";
import { DealWorkspaceForms } from "@/components/pipeline/DealWorkspaceForms";

export const dynamic = "force-dynamic";

export default async function DealWorkspacePage({
  params,
}: {
  params: { id: string };
}) {
  const deal = await getDealWorkspace(params.id);
  if (!deal) notFound();

  return (
    <div className="min-w-0">
      <Link
        href="/pipeline"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#969BA8] hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Pipeline
      </Link>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#FF6B3D]">
            Deal workspace
          </p>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            {deal.company.name}
          </h1>
          <p className="text-sm text-[#969BA8]">
            {deal.player.firstName} {deal.player.lastName} · {deal.stage}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.08] px-3 py-2 text-right">
          <p className="text-[11px] text-[#969BA8]">Attribution</p>
          <p className="text-xs text-[#FF6B3D]">
            {deal.attribution?.initiatedBySponsorAI
              ? "SponsorAI vérifiée"
              : "À établir"}
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Metric
          icon={CalendarCheck}
          label="Meetings"
          value={deal.meetings.length}
        />
        <Metric
          icon={FileText}
          label="Propositions"
          value={deal.proposals.length}
        />
        <Metric
          icon={FileSignature}
          label="Contrats"
          value={deal.contracts.length}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
        <DealWorkspaceForms
          dealId={deal.id}
          contracts={deal.contracts.map((contract) => ({
            id: contract.id,
            title: contract.title,
            status: contract.status,
          }))}
          meetings={deal.meetings.map((meeting) => ({
            id: meeting.id,
            status: meeting.status,
            scheduledAt: meeting.scheduledAt.toISOString(),
          }))}
        />
        <div className="app-panel p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <History className="h-4 w-4 text-[#FF6B3D]" /> Chronologie immuable
          </h2>
          <div className="space-y-3">
            {deal.events.map((event) => (
              <div key={event.id} className="border-l border-[#FF6B3D]/20 pl-3">
                <p className="text-xs font-medium text-white/80">
                  {event.type}
                </p>
                <p className="text-[11px] text-[#969BA8]">
                  {event.occurredAt.toLocaleString("fr-FR")} · {event.source}
                </p>
              </div>
            ))}
            {deal.events.length === 0 && (
              <p className="text-xs text-[#969BA8]">Aucun événement.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarCheck;
  label: string;
  value: number;
}) {
  return (
    <div className="app-soft-panel flex items-center gap-3 p-3">
      <Icon className="h-4 w-4 text-[#FF6B3D]" />
      <div>
        <p className="text-[11px] text-[#969BA8]">{label}</p>
        <p className="font-mono text-lg text-white">{value}</p>
      </div>
    </div>
  );
}
