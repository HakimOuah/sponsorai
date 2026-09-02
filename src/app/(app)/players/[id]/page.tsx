import { notFound } from "next/navigation";
import Link from "@/components/layout/NavigationLink";
import { Pencil, ArrowLeft, Globe, MapPin } from "lucide-react";
import { getPlayer } from "@/lib/actions/players";
import { PlayerStats } from "@/components/players/PlayerStats";
import { ArchiveButton } from "@/components/players/ArchiveButton";
import { PlayerScanButton } from "@/components/players/PlayerScanButton";
import { getScanRecovery } from "@/lib/agents/scan-recovery";

export default async function PlayerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const player = await getPlayer(params.id);

  if (!player) return notFound();

  const initials = player.firstName.charAt(0) + player.lastName.charAt(0);
  const recovery = getScanRecovery(player.scans[0], player.id);

  return (
    <div className="min-w-0">
      {/* Back link */}
      <Link
        href="/players"
        className="inline-flex items-center gap-1.5 text-sm text-[#969BA8] hover:text-white/70 transition-colors mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Talents
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#FF6B3D]/10 text-xl font-bold text-[#FF6B3D] sm:h-16 sm:w-16 sm:text-2xl">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-[-0.03em] text-[#F6F4EF] sm:text-3xl">
              {player.firstName} {player.lastName}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#969BA8]">
              <span>
                {player.position && `${player.position} · `}
                {player.club}
              </span>
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
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <PlayerScanButton
            playerId={player.id}
            playerName={`${player.firstName} ${player.lastName}`}
            resumeScanId={recovery?.scanId}
          />
          <Link
            href={`/players/${player.id}/edit`}
            className="flex items-center justify-center gap-2 rounded-full border border-white/[0.10] px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
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
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#969BA8] mb-3">
            Positionnement
          </h2>
          <div className="space-y-3">
            {player.positioning && (
              <div>
                <p className="text-xs text-[#969BA8] mb-1">Image & valeurs</p>
                <p className="text-sm text-white/70">{player.positioning}</p>
              </div>
            )}
            {player.targetPartnerships && (
              <div>
                <p className="text-xs text-[#969BA8] mb-1">Deals recherchés</p>
                <p className="text-sm text-white/70">
                  {player.targetPartnerships}
                </p>
              </div>
            )}
            {player.languages && (
              <div>
                <p className="text-xs text-[#969BA8] mb-1">Langues</p>
                <p className="text-sm text-white/70">{player.languages}</p>
              </div>
            )}
            {player.notes && (
              <div>
                <p className="text-xs text-[#969BA8] mb-1">Notes</p>
                <p className="text-sm text-white/70">{player.notes}</p>
              </div>
            )}
            {!player.positioning &&
              !player.targetPartnerships &&
              !player.notes && (
                <p className="text-sm text-[#969BA8]/55">
                  Aucune info de positionnement
                </p>
              )}
          </div>
        </div>

        {/* Réseaux sociaux */}
        <div className="app-panel p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#969BA8] mb-3">
            Réseaux sociaux
          </h2>
          <div className="space-y-2">
            {player.instagram && (
              <SocialRow
                label="Instagram"
                handle={player.instagram}
                followers={player.followersIG}
              />
            )}
            {player.tiktok && (
              <SocialRow
                label="TikTok"
                handle={player.tiktok}
                followers={player.followersTK}
              />
            )}
            {player.twitter && (
              <SocialRow
                label="X / Twitter"
                handle={player.twitter}
                followers={player.followersX}
              />
            )}
            {!player.instagram && !player.tiktok && !player.twitter && (
              <p className="text-sm text-[#969BA8]/55">
                Aucun réseau configuré
              </p>
            )}
          </div>
        </div>
      </div>

      {(player.traits.length > 0 ||
        player.intelligenceSnapshots.length > 0) && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="app-panel p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#969BA8]">
              Athlete traits
            </h2>
            <div className="flex flex-wrap gap-2">
              {player.traits.map((trait) => (
                <span
                  key={trait.id}
                  className="rounded-full border border-[#FF6B3D]/15 bg-[#FF6B3D]/5 px-3 py-1 text-xs text-[#C8CEFF]"
                >
                  {trait.value} · {Math.round(trait.confidence * 100)}%
                </span>
              ))}
              {player.traits.length === 0 && (
                <span className="text-xs text-[#969BA8]">
                  Aucun trait structuré.
                </span>
              )}
            </div>
          </div>
          <div className="app-panel p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#969BA8]">
              Intelligence snapshots
            </h2>
            <div className="space-y-2">
              {player.intelligenceSnapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] px-3 py-2 text-xs"
                >
                  <span className="text-white/70">{snapshot.version}</span>
                  <span className="font-mono text-[#969BA8]">
                    {snapshot.capturedAt.toLocaleDateString("fr-FR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Prospects */}
      {player.prospects.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#969BA8] mb-3">
            Prospects récents
          </h2>
          <div className="app-panel overflow-x-auto">
            <table className="min-w-[560px] w-full text-sm">
              <thead>
                <tr className="border-b border-[#FF6B3D]/10 text-left text-xs text-[#969BA8]">
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
                        className="hover:text-[#FF6B3D] transition-colors"
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
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#969BA8] mb-3">
            Deals
          </h2>
          <div className="app-panel overflow-x-auto">
            <table className="min-w-[560px] w-full text-sm">
              <thead>
                <tr className="border-b border-[#FF6B3D]/10 text-left text-xs text-[#969BA8]">
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
                        className="hover:text-[#FF6B3D] transition-colors"
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
                      {deal.value
                        ? `${deal.value.toLocaleString("fr-FR")} ${deal.currency}`
                        : "—"}
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
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <span className="text-xs text-[#969BA8]">{label}</span>
        <p className="truncate text-sm text-white/70">{handle}</p>
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
    contacted: "bg-[#C8CEFF]/10 text-[#C8CEFF]",
    replied: "bg-[#FF6B3D]/10 text-[#FF6B3D]",
    meeting: "bg-[#C8CEFF]/10 text-[#C8CEFF]",
    negotiation: "bg-[#f59e0b]/10 text-[#f59e0b]",
    offer: "bg-[#f59e0b]/10 text-[#f59e0b]",
    signed: "bg-[#FF6B3D]/15 text-[#FF6B3D]",
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
