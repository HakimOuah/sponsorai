import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil, ArrowLeft, Globe, MapPin, ScanLine } from "lucide-react";
import { getPlayer } from "@/lib/actions/players";
import { PlayerStats } from "@/components/players/PlayerStats";
import { ArchiveButton } from "@/components/players/ArchiveButton";

export default async function PlayerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const player = await getPlayer(params.id);

  if (!player) return notFound();

  const initials = player.firstName.charAt(0) + player.lastName.charAt(0);

  return (
    <div>
      {/* Back link */}
      <Link
        href="/players"
        className="inline-flex items-center gap-1.5 text-sm text-[#8FA69E] hover:text-white/70 transition-colors mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Joueurs
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#3EF2A0]/10 text-[#3EF2A0] font-bold text-2xl">
            {initials}
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#F8FAF7]">
              {player.firstName} {player.lastName}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-[#8FA69E]">
              <span>{player.position && `${player.position} · `}{player.club}</span>
              {player.league && (
                <span className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-[11px]">
                  {player.league}
                </span>
              )}
              {player.nationality && (
                <>
                  <Globe className="h-3 w-3" />
                  <span>{player.nationality}</span>
                </>
              )}
              {player.city && (
                <>
                  <MapPin className="h-3 w-3" />
                  <span>{player.city}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/agents"
            className="flex items-center gap-2 rounded-full bg-[#F8FAF7] px-3 py-2 text-sm font-semibold text-[#020403] hover:bg-[#2CFF93] transition-colors"
          >
            <ScanLine className="h-3.5 w-3.5" />
            Scanner
          </Link>
          <Link
            href={`/players/${player.id}/edit`}
            className="flex items-center gap-2 rounded-full border border-white/[0.10] px-3 py-2 text-sm text-white/60 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </Link>
          <ArchiveButton playerId={player.id} />
        </div>
      </div>

      {/* Stats */}
      <PlayerStats player={player} />

      {/* Info sections */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Positionnement */}
        <div className="app-panel p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8FA69E] mb-3">
            Positionnement
          </h2>
          <div className="space-y-3">
            {player.positioning && (
              <div>
                <p className="text-xs text-[#8FA69E] mb-1">Image & valeurs</p>
                <p className="text-sm text-white/70">{player.positioning}</p>
              </div>
            )}
            {player.targetPartnerships && (
              <div>
                <p className="text-xs text-[#8FA69E] mb-1">Deals recherchés</p>
                <p className="text-sm text-white/70">{player.targetPartnerships}</p>
              </div>
            )}
            {player.languages && (
              <div>
                <p className="text-xs text-[#8FA69E] mb-1">Langues</p>
                <p className="text-sm text-white/70">{player.languages}</p>
              </div>
            )}
            {player.notes && (
              <div>
                <p className="text-xs text-[#8FA69E] mb-1">Notes</p>
                <p className="text-sm text-white/70">{player.notes}</p>
              </div>
            )}
            {!player.positioning && !player.targetPartnerships && !player.notes && (
              <p className="text-sm text-[#8FA69E]/55">Aucune info de positionnement</p>
            )}
          </div>
        </div>

        {/* Réseaux sociaux */}
        <div className="app-panel p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8FA69E] mb-3">
            Réseaux sociaux
          </h2>
          <div className="space-y-2">
            {player.instagram && (
              <SocialRow label="Instagram" handle={player.instagram} followers={player.followersIG} />
            )}
            {player.tiktok && (
              <SocialRow label="TikTok" handle={player.tiktok} followers={player.followersTK} />
            )}
            {player.twitter && (
              <SocialRow label="X / Twitter" handle={player.twitter} followers={player.followersX} />
            )}
            {!player.instagram && !player.tiktok && !player.twitter && (
              <p className="text-sm text-[#8FA69E]/55">Aucun réseau configuré</p>
            )}
          </div>
        </div>
      </div>

      {/* Prospects */}
      {player.prospects.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8FA69E] mb-3">
            Prospects récents
          </h2>
          <div className="app-panel overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#3EF2A0]/10 text-left text-xs text-[#8FA69E]">
                  <th className="px-4 py-2.5 font-medium">Entreprise</th>
                  <th className="px-4 py-2.5 font-medium">Score</th>
                  <th className="px-4 py-2.5 font-medium">Priorité</th>
                  <th className="px-4 py-2.5 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {player.prospects.map((prospect) => (
                  <tr
                    key={prospect.id}
                    className="border-b border-white/[0.04] last:border-0"
                  >
                    <td className="px-4 py-2.5 text-white/80">
                      <Link
                        href={`/companies/${prospect.companyId}`}
                        className="hover:text-[#3EF2A0] transition-colors"
                      >
                        {prospect.company.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-white/60">
                      {prospect.score ?? "—"}/10
                    </td>
                    <td className="px-4 py-2.5">
                      <PriorityBadge priority={prospect.priority} />
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={prospect.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deals */}
      {player.deals.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8FA69E] mb-3">
            Deals
          </h2>
          <div className="app-panel overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#3EF2A0]/10 text-left text-xs text-[#8FA69E]">
                  <th className="px-4 py-2.5 font-medium">Entreprise</th>
                  <th className="px-4 py-2.5 font-medium">Stage</th>
                  <th className="px-4 py-2.5 font-medium">Type</th>
                  <th className="px-4 py-2.5 font-medium">Valeur</th>
                </tr>
              </thead>
              <tbody>
                {player.deals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="border-b border-white/[0.04] last:border-0"
                  >
                    <td className="px-4 py-2.5 text-white/80">
                      <Link
                        href={`/companies/${deal.companyId}`}
                        className="hover:text-[#3EF2A0] transition-colors"
                      >
                        {deal.company.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={deal.stage} />
                    </td>
                    <td className="px-4 py-2.5 text-white/50">
                      {deal.dealType || "—"}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-white/60">
                      {deal.value ? `${deal.value.toLocaleString("fr-FR")} ${deal.currency}` : "—"}
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

function SocialRow({
  label,
  handle,
  followers,
}: {
  label: string;
  handle: string;
  followers?: number | null;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div>
        <span className="text-xs text-[#8FA69E]">{label}</span>
        <p className="text-sm text-white/70">{handle}</p>
      </div>
      {followers && (
        <span className="font-mono text-sm text-white/50">
          {followers.toLocaleString("fr-FR")}
        </span>
      )}
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
    contacted: "bg-[#DDFBEA]/10 text-[#DDFBEA]",
    replied: "bg-[#3EF2A0]/10 text-[#3EF2A0]",
    meeting: "bg-[#DDFBEA]/10 text-[#DDFBEA]",
    negotiation: "bg-[#f59e0b]/10 text-[#f59e0b]",
    offer: "bg-[#f59e0b]/10 text-[#f59e0b]",
    signed: "bg-[#3EF2A0]/15 text-[#3EF2A0]",
    lost: "bg-red-500/10 text-red-400",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-mono text-[11px] capitalize ${colors[status] || colors.new}`}
    >
      {status}
    </span>
  );
}
