import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Pencil,
  ArrowLeft,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  ShieldCheck,
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
        className="inline-flex items-center gap-1.5 text-sm text-[#969BA8] hover:text-white/70 transition-colors mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Entreprises
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#C8CEFF]/10 text-[#C8CEFF] font-bold text-xl">
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-[-0.03em] text-[#F6F4EF] sm:text-3xl">
              {company.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#969BA8]">
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
        <Stat
          label="Prospects"
          value={company._count.prospects}
          color="#C8CEFF"
        />
        <Stat label="Deals" value={company._count.deals} color="#FF6B3D" />
        <Stat label="Emails" value={company._count.emails} color="#C8CEFF" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Info */}
        <div className="app-panel p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#969BA8] mb-3">
            Informations
          </h2>
          <div className="space-y-3">
            {company.website && (
              <InfoRow
                icon={Globe}
                label="Site web"
                value={company.website}
                isLink
              />
            )}
            {company.description && (
              <div>
                <p className="text-xs text-[#969BA8] mb-1">Description</p>
                <p className="text-sm text-white/70">{company.description}</p>
              </div>
            )}
            {company.existingSportsSponsoring && (
              <div>
                <p className="text-xs text-[#969BA8] mb-1">
                  Sponsoring sportif
                </p>
                <p className="text-sm text-white/70">
                  {company.existingSportsSponsoring}
                </p>
              </div>
            )}
            {company.estimatedBudget && (
              <div>
                <p className="text-xs text-[#969BA8] mb-1">Budget estimé</p>
                <p className="text-sm text-white/70">
                  {company.estimatedBudget}
                </p>
              </div>
            )}
            {(company.employeeCount !== null ||
              company.companySizeBucket !== "unknown") && (
              <div>
                <p className="text-xs text-[#969BA8] mb-1">Taille entreprise</p>
                <p className="text-sm text-white/70">
                  {company.employeeCount !== null
                    ? `${company.employeeCount.toLocaleString("fr-FR")} employés`
                    : company.companySizeBucket}
                </p>
              </div>
            )}
            {company.notes && (
              <div>
                <p className="text-xs text-[#969BA8] mb-1">Notes</p>
                <p className="text-sm text-white/70">{company.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="app-panel p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#969BA8] mb-3">
            Contact
          </h2>
          {company.contacts.length > 0 ? (
            <div className="space-y-2">
              {company.contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-sm text-white/80">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#FF6B3D]" />{" "}
                      {company.canViewContactDetails && contact.fullName
                        ? contact.fullName
                        : contact.roleRaw}
                    </span>
                    <span className="font-mono text-xs text-[#FF6B3D]">
                      {contact.contactScore ?? "—"}/100
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#969BA8]">
                    {company.canViewContactDetails && contact.fullName
                      ? `${contact.roleRaw} · `
                      : ""}
                    {contact.employmentStatus === "verified_current"
                      ? "Poste actuel vérifié"
                      : "Poste à vérifier"}{" "}
                    · contactabilité {contact.contactability}
                  </p>
                  {company.canViewContactDetails ? (
                    contact.contactEmails[0] ? (
                      <div className="mt-2 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] px-3 py-2">
                        <p className="flex flex-wrap items-center gap-2 text-xs text-emerald-200/80">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="font-mono">
                            {contact.contactEmails[0].email}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-emerald-300/60">
                            {isFunctionalEmail(contact.contactEmails[0])
                              ? "boîte fonctionnelle"
                              : "email professionnel"}
                          </span>
                        </p>
                        {contact.contactEmails[0].evidence ? (
                          <p className="mt-1.5 text-[11px] leading-relaxed text-white/45">
                            {contact.contactEmails[0].evidence}
                          </p>
                        ) : null}
                        {isHttpUrl(contact.contactEmails[0].source) ? (
                          <a
                            href={contact.contactEmails[0].source}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-[#C8CEFF] hover:underline"
                          >
                            Vérifier la source
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-1 text-[11px] text-[#F59E0B]">
                        Aucun email exploitable trouvé.
                      </p>
                    )
                  ) : (
                    <p className="mt-1 text-[11px] text-[#969BA8]/60">
                      Coordonnées protégées dans Vectis
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : company.contactRole || company.outreachReady ? (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
              <p className="text-sm text-white/80">
                {company.canViewContactDetails && company.contactName
                  ? company.contactName
                  : company.contactRole || "Décideur qualifié"}
              </p>
              <p className="mt-1 text-xs text-[#969BA8]">
                {company.canViewContactDetails && company.contactName
                  ? `${company.contactRole || "Décideur qualifié"} · `
                  : ""}
                Contactabilité {company.contactEmailStatus} ·{" "}
                {company.canViewContactDetails
                  ? "détails administrateur"
                  : "coordonnées protégées"}
              </p>
              {company.canViewContactDetails && company.contactEmail ? (
                <div className="mt-2 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] px-3 py-2">
                  <p className="flex flex-wrap items-center gap-2 text-xs text-emerald-200/80">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="font-mono">{company.contactEmail}</span>
                  </p>
                  {company.contactEvidence ? (
                    <p className="mt-1.5 text-[11px] leading-relaxed text-white/45">
                      {company.contactEvidence}
                    </p>
                  ) : null}
                  {isHttpUrl(company.contactSource) ? (
                    <a
                      href={company.contactSource}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-[#C8CEFF] hover:underline"
                    >
                      Vérifier la source
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-[#969BA8]/55 mb-3">
              Aucun contact renseigné
            </p>
          )}
          <div className="mt-4 pt-4 border-t border-[#FF6B3D]/10">
            <EnrichButton
              companyId={company.id}
              companyName={company.name}
              companyCountry={company.country}
              prospects={company.prospects.map((prospect) => ({
                id: prospect.id,
                athleteName: `${prospect.player.firstName} ${prospect.player.lastName}`,
                club: prospect.player.club,
              }))}
              canViewContactDetails={company.canViewContactDetails}
            />
          </div>
        </div>
      </div>

      {(company.opportunitySignals.length > 0 ||
        company.sponsorships.length > 0) && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#969BA8]">
              Opportunity signals
            </h2>
            <div className="app-panel divide-y divide-white/[0.04]">
              {company.opportunitySignals.map((signal) => (
                <div key={signal.id} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white/80">
                      {signal.title}
                    </p>
                    <span className="font-mono text-xs text-[#FF6B3D]">
                      {Math.round(signal.strength * 100)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[#969BA8]">
                    {signal.description}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-[#969BA8]/55">
                    {signal.type} · {signal.status}
                  </p>
                </div>
              ))}
              {company.opportunitySignals.length === 0 && (
                <p className="p-4 text-xs text-[#969BA8]">
                  Aucun signal structuré.
                </p>
              )}
            </div>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#969BA8]">
              Sponsorship graph
            </h2>
            <div className="app-panel divide-y divide-white/[0.04]">
              {company.sponsorships.map((item) => (
                <div key={item.id} className="p-4">
                  <p className="text-sm font-medium text-white/80">
                    {item.rightsHolder}
                  </p>
                  <p className="mt-1 text-xs text-[#969BA8]">
                    {item.sport || "Sport non précisé"}
                    {item.category ? ` · ${item.category}` : ""} · {item.status}
                  </p>
                </div>
              ))}
              {company.sponsorships.length === 0 && (
                <p className="p-4 text-xs text-[#969BA8]">
                  Aucun sponsoring observé.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prospects */}
      {company.prospects.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#969BA8] mb-3">
            Prospects ({company.prospects.length})
          </h2>
          <div className="app-panel overflow-x-auto">
            <table className="min-w-[660px] w-full text-sm">
              <thead>
                <tr className="border-b border-[#FF6B3D]/10 text-left text-xs text-[#969BA8]">
                  <th className="px-4 py-2.5 font-medium">Profil</th>
                  <th className="px-4 py-2.5 font-medium">Score</th>
                  <th className="px-4 py-2.5 font-medium">Priorité</th>
                  <th className="px-4 py-2.5 font-medium">Statut</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {company.prospects.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-white/[0.04] last:border-0"
                  >
                    <td className="px-4 py-2.5 text-white/80">
                      <Link
                        href={`/players/${p.playerId}`}
                        className="hover:text-[#FF6B3D] transition-colors"
                      >
                        {p.player.firstName} {p.player.lastName}
                      </Link>
                      <span className="ml-2 text-xs text-[#969BA8]">
                        {p.player.club}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-white/60">
                      {p.score ?? "—"}/10
                    </td>
                    <td className="px-4 py-2.5">
                      <PriorityBadge priority={p.priority} />
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-2.5 text-[#969BA8]">
                      {p.partnershipType || "—"}
                    </td>
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
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#969BA8] mb-3">
            Deals ({company.deals.length})
          </h2>
          <div className="app-panel overflow-x-auto">
            <table className="min-w-[600px] w-full text-sm">
              <thead>
                <tr className="border-b border-[#FF6B3D]/10 text-left text-xs text-[#969BA8]">
                  <th className="px-4 py-2.5 font-medium">Profil</th>
                  <th className="px-4 py-2.5 font-medium">Stage</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">Valeur</th>
                </tr>
              </thead>
              <tbody>
                {company.deals.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-white/[0.04] last:border-0"
                  >
                    <td className="px-4 py-2.5 text-white/80">
                      <Link
                        href={`/players/${d.playerId}`}
                        className="hover:text-[#FF6B3D] transition-colors"
                      >
                        {d.player.firstName} {d.player.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={d.stage} />
                    </td>
                    <td className="px-4 py-2.5 text-[#969BA8]">
                      {d.dealType || "—"}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-white/60">
                      {d.value
                        ? `${d.value.toLocaleString("fr-FR")} ${d.currency}`
                        : "—"}
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
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#969BA8] mb-3">
            Emails récents ({company.emails.length})
          </h2>
          <div className="app-panel overflow-x-auto">
            <table className="min-w-[620px] w-full text-sm">
              <thead>
                <tr className="border-b border-[#FF6B3D]/10 text-left text-xs text-[#969BA8]">
                  <th className="px-4 py-2.5 font-medium">Sujet</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">Statut</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {company.emails.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-white/[0.04] last:border-0"
                  >
                    <td className="px-4 py-2.5 text-white/80 truncate max-w-xs">
                      {e.subject}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[11px] text-[#969BA8]">
                        {e.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="px-4 py-2.5 text-[#969BA8]">
                      {e.createdAt.toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
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

function isHttpUrl(value?: string | null): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isFunctionalEmail(contactEmail: {
  email: string;
  evidence: string | null;
}) {
  if (contactEmail.evidence?.toLowerCase().includes("boîte fonctionnelle")) {
    return true;
  }
  const localPart = contactEmail.email.split("@")[0]?.toLowerCase() || "";
  return /^(contact|info|hello|marketing|communication|communications|partnerships|partenariats|sponsoring|sponsorship|press|presse|media)([._-]|$)/.test(
    localPart,
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="app-soft-panel p-3">
      <p className="text-[11px] text-[#969BA8] mb-1">{label}</p>
      <p className="font-mono text-xl font-semibold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  isLink,
}: {
  icon: typeof Globe;
  label: string;
  value: string;
  isLink?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-[#969BA8] mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-[#969BA8]">{label}</p>
        {isLink ? (
          <a
            href={value.startsWith("http") ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-sm text-[#C8CEFF] hover:underline"
          >
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
  if (!priority) return <span className="text-[#969BA8]/55">—</span>;
  const colors: Record<string, string> = {
    A: "bg-[#FF6B3D]/10 text-[#FF6B3D]",
    B: "bg-[#C8CEFF]/10 text-[#C8CEFF]",
    C: "bg-white/[0.06] text-[#969BA8]",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${colors[priority] || colors.C}`}
    >
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: "bg-white/[0.06] text-white/50",
    lead: "bg-white/[0.06] text-white/50",
    draft: "bg-white/[0.06] text-white/50",
    contacted: "bg-[#C8CEFF]/10 text-[#C8CEFF]",
    sent: "bg-[#C8CEFF]/10 text-[#C8CEFF]",
    replied: "bg-[#FF6B3D]/10 text-[#FF6B3D]",
    opened: "bg-[#f59e0b]/10 text-[#f59e0b]",
    meeting: "bg-[#C8CEFF]/10 text-[#C8CEFF]",
    negotiation: "bg-[#f59e0b]/10 text-[#f59e0b]",
    offer: "bg-[#f59e0b]/10 text-[#f59e0b]",
    signed: "bg-[#FF6B3D]/15 text-[#FF6B3D]",
    lost: "bg-red-500/10 text-red-400",
    bounced: "bg-red-500/10 text-red-400",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-mono text-[11px] capitalize ${colors[status] || colors.new}`}
    >
      {status}
    </span>
  );
}
