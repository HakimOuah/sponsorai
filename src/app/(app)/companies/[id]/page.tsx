import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Pencil,
  ArrowLeft,
  Globe,
  MapPin,
  Mail,
  Phone,
  Link2,
  User,
} from "lucide-react";
import { getCompany } from "@/lib/actions/companies";
import { DeleteCompanyButton } from "@/components/companies/DeleteCompanyButton";
import { EnrichButton } from "@/components/companies/EnrichButton";

export const dynamic = "force-dynamic";

export default async function CompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const company = await getCompany(params.id);
  if (!company) return notFound();

  const initial = company.name.charAt(0).toUpperCase();

  return (
    <div className="min-w-0">
      <Link
        href="/companies"
        className="inline-flex items-center gap-1.5 text-sm text-[#8FA69E] hover:text-white/70 transition-colors mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Entreprises
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#DDFBEA]/10 text-[#DDFBEA] font-bold text-xl">
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-[-0.03em] text-[#F8FAF7] sm:text-3xl">{company.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#8FA69E]">
              {company.sector && <span>{company.sector}</span>}
              {company.country && (
                <>
                  <MapPin className="h-3 w-3" />
                  <span>{company.country}</span>
                </>
              )}
              {company.source && (
                <span className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-[11px]">
                  {company.source}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <Link
            href={`/companies/${company.id}/edit`}
            className="flex items-center justify-center gap-2 rounded-full border border-white/[0.10] px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </Link>
          <DeleteCompanyButton companyId={company.id} />
        </div>
      </div>

      {/* KPI row */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Prospects" value={company._count.prospects} color="#DDFBEA" />
        <Stat label="Deals" value={company._count.deals} color="#3EF2A0" />
        <Stat label="Emails" value={company._count.emails} color="#DDFBEA" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Info */}
        <div className="app-panel p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8FA69E] mb-3">
            Informations
          </h2>
          <div className="space-y-3">
            {company.website && (
              <InfoRow icon={Globe} label="Site web" value={company.website} isLink />
            )}
            {company.description && (
              <div>
                <p className="text-xs text-[#8FA69E] mb-1">Description</p>
                <p className="text-sm text-white/70">{company.description}</p>
              </div>
            )}
            {company.existingSportsSponsoring && (
              <div>
                <p className="text-xs text-[#8FA69E] mb-1">Sponsoring sportif</p>
                <p className="text-sm text-white/70">{company.existingSportsSponsoring}</p>
              </div>
            )}
            {company.estimatedBudget && (
              <div>
                <p className="text-xs text-[#8FA69E] mb-1">Budget estimé</p>
                <p className="text-sm text-white/70">{company.estimatedBudget}</p>
              </div>
            )}
            {company.notes && (
              <div>
                <p className="text-xs text-[#8FA69E] mb-1">Notes</p>
                <p className="text-sm text-white/70">{company.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="app-panel p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8FA69E] mb-3">
            Contact
          </h2>
          {company.contactName || company.contactEmail ? (
            <div className="space-y-3">
              {company.contactName && (
                <InfoRow icon={User} label="Nom" value={`${company.contactName}${company.contactRole ? ` — ${company.contactRole}` : ""}`} />
              )}
              {company.contactEmail && (
                <InfoRow icon={Mail} label="Email" value={company.contactEmail} />
              )}
              {company.contactEmail && (
                <div className="rounded-xl border border-[#3EF2A0]/10 bg-white/[0.025] px-3 py-2 text-xs">
                  <p className={company.outreachReady ? "text-[#3EF2A0]" : "text-[#f59e0b]"}>
                    {company.outreachReady
                      ? `Prêt à contacter · ${company.contactEmailStatus}`
                      : `Email non qualifié · ${company.contactEmailStatus || "unknown"}`}
                  </p>
                  {company.contactEvidence && (
                    <p className="mt-1 leading-relaxed text-[#8FA69E]">
                      {company.contactEvidence}
                    </p>
                  )}
                </div>
              )}
              {company.contactPhone && (
                <InfoRow icon={Phone} label="Téléphone" value={company.contactPhone} />
              )}
              {company.contactLinkedin && (
                <InfoRow icon={Link2} label="LinkedIn" value={company.contactLinkedin} isLink />
              )}
            </div>
          ) : (
            <p className="text-sm text-[#8FA69E]/55 mb-3">Aucun contact renseigné</p>
          )}
          <div className="mt-4 pt-4 border-t border-[#3EF2A0]/10">
            <EnrichButton companyId={company.id} companyName={company.name} />
          </div>
        </div>
      </div>

      {/* Prospects */}
      {company.prospects.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8FA69E] mb-3">
            Prospects ({company.prospects.length})
          </h2>
          <div className="app-panel overflow-x-auto">
            <table className="min-w-[660px] w-full text-sm">
              <thead>
                <tr className="border-b border-[#3EF2A0]/10 text-left text-xs text-[#8FA69E]">
                  <th className="px-4 py-2.5 font-medium">Profil</th>
                  <th className="px-4 py-2.5 font-medium">Score</th>
                  <th className="px-4 py-2.5 font-medium">Priorité</th>
                  <th className="px-4 py-2.5 font-medium">Statut</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {company.prospects.map((p) => (
                  <tr key={p.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-4 py-2.5 text-white/80">
                      <Link href={`/players/${p.playerId}`} className="hover:text-[#3EF2A0] transition-colors">
                        {p.player.firstName} {p.player.lastName}
                      </Link>
                      <span className="ml-2 text-xs text-[#8FA69E]">{p.player.club}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-white/60">{p.score ?? "—"}/10</td>
                    <td className="px-4 py-2.5">
                      <PriorityBadge priority={p.priority} />
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-2.5 text-[#8FA69E]">{p.partnershipType || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deals */}
      {company.deals.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8FA69E] mb-3">
            Deals ({company.deals.length})
          </h2>
          <div className="app-panel overflow-x-auto">
            <table className="min-w-[600px] w-full text-sm">
              <thead>
                <tr className="border-b border-[#3EF2A0]/10 text-left text-xs text-[#8FA69E]">
                  <th className="px-4 py-2.5 font-medium">Profil</th>
                  <th className="px-4 py-2.5 font-medium">Stage</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">Valeur</th>
                </tr>
              </thead>
              <tbody>
                {company.deals.map((d) => (
                  <tr key={d.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-4 py-2.5 text-white/80">
                      <Link href={`/players/${d.playerId}`} className="hover:text-[#3EF2A0] transition-colors">
                        {d.player.firstName} {d.player.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5"><StatusBadge status={d.stage} /></td>
                    <td className="px-4 py-2.5 text-[#8FA69E]">{d.dealType || "—"}</td>
                    <td className="px-4 py-2.5 font-mono text-white/60">
                      {d.value ? `${d.value.toLocaleString("fr-FR")} ${d.currency}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent emails */}
      {company.emails.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8FA69E] mb-3">
            Emails récents ({company.emails.length})
          </h2>
          <div className="app-panel overflow-x-auto">
            <table className="min-w-[620px] w-full text-sm">
              <thead>
                <tr className="border-b border-[#3EF2A0]/10 text-left text-xs text-[#8FA69E]">
                  <th className="px-4 py-2.5 font-medium">Sujet</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">Statut</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {company.emails.map((e) => (
                  <tr key={e.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-4 py-2.5 text-white/80 truncate max-w-xs">{e.subject}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[11px] text-[#8FA69E]">
                        {e.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5"><StatusBadge status={e.status} /></td>
                    <td className="px-4 py-2.5 text-[#8FA69E]">
                      {e.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="app-soft-panel p-3">
      <p className="text-[11px] text-[#8FA69E] mb-1">{label}</p>
      <p className="font-mono text-xl font-semibold" style={{ color }}>{value}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, isLink }: { icon: typeof Globe; label: string; value: string; isLink?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-[#8FA69E] mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-[#8FA69E]">{label}</p>
        {isLink ? (
          <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="break-all text-sm text-[#DDFBEA] hover:underline">
            {value}
          </a>
        ) : (
          <p className="break-words text-sm text-white/70">{value}</p>
        )}
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string | null }) {
  if (!priority) return <span className="text-[#8FA69E]/55">—</span>;
  const colors: Record<string, string> = {
    A: "bg-[#3EF2A0]/10 text-[#3EF2A0]",
    B: "bg-[#DDFBEA]/10 text-[#DDFBEA]",
    C: "bg-white/[0.06] text-[#8FA69E]",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${colors[priority] || colors.C}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: "bg-white/[0.06] text-white/50",
    lead: "bg-white/[0.06] text-white/50",
    draft: "bg-white/[0.06] text-white/50",
    contacted: "bg-[#DDFBEA]/10 text-[#DDFBEA]",
    sent: "bg-[#DDFBEA]/10 text-[#DDFBEA]",
    replied: "bg-[#3EF2A0]/10 text-[#3EF2A0]",
    opened: "bg-[#f59e0b]/10 text-[#f59e0b]",
    meeting: "bg-[#DDFBEA]/10 text-[#DDFBEA]",
    negotiation: "bg-[#f59e0b]/10 text-[#f59e0b]",
    offer: "bg-[#f59e0b]/10 text-[#f59e0b]",
    signed: "bg-[#3EF2A0]/15 text-[#3EF2A0]",
    lost: "bg-red-500/10 text-red-400",
    bounced: "bg-red-500/10 text-red-400",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] capitalize ${colors[status] || colors.new}`}>
      {status}
    </span>
  );
}
