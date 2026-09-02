import Link from "@/components/layout/NavigationLink";
import { Search, ScanLine } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getProspects, getScansForPlayer } from "@/lib/actions/prospection";
import { ProspectList } from "@/components/prospection/ProspectList";
import { PlayerSelector } from "@/components/prospection/PlayerSelector";

export const dynamic = "force-dynamic";

export default async function ProspectionPage({
  searchParams,
}: {
  searchParams: { player?: string };
}) {
  const selectedPlayerId = searchParams.player || "";
  const [players, prospects, scans] = await Promise.all([
    prisma.player.findMany({
      where: { active: true },
      select: { id: true, firstName: true, lastName: true, club: true },
      orderBy: { lastName: "asc" },
    }),
    getProspects(selectedPlayerId || undefined),
    selectedPlayerId ? getScansForPlayer(selectedPlayerId) : Promise.resolve([]),
  ]);

  return (
    <div className="min-w-0">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Search className="h-6 w-6 text-[#FF6B3D]" />
          <h1 className="truncate text-2xl font-semibold tracking-[-0.03em] text-[#F6F4EF] sm:text-3xl">
            Prospection
          </h1>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 font-mono text-xs text-[#969BA8]">
            {prospects.length} prospect{prospects.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Link
          href="/agents"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6B3D] px-4 py-2.5 text-sm font-semibold text-[#0B0D12] transition-colors hover:bg-[#FF865F] sm:w-auto sm:py-2"
        >
          <ScanLine className="h-4 w-4" />
          Nouveau scan
        </Link>
      </div>

      {/* Player selector */}
      <div className="mb-6">
        <PlayerSelector players={players} selectedId={selectedPlayerId} />
      </div>

      {/* Scan history for selected player */}
      {scans.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#969BA8] mb-2">
            Scans pour ce profil
          </h2>
          <div className="flex flex-wrap gap-2">
            {scans.map((scan) => (
              <div key={scan.id} className="app-soft-panel px-3 py-2 text-xs">
                <span
                  className={`font-mono ${scan.status === "completed" ? "text-[#FF6B3D]" : scan.status === "failed" ? "text-red-400" : "text-[#C8CEFF]"}`}
                >
                  {scan.status}
                </span>
                <span className="text-[#969BA8] ml-2">
                  {scan.brandsScored ?? 0} marques · {scan.duration ?? 0}s ·{" "}
                  {scan.createdAt.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {prospects.length === 0 ? (
        <div className="app-panel p-6 text-center sm:p-12">
          <Search className="mx-auto mb-3 h-10 w-10 text-white/10" />
          <p className="text-[#969BA8] mb-2">
            {selectedPlayerId
              ? "Aucun prospect pour ce profil"
              : "Sélectionnez un profil ou consultez tous les prospects"}
          </p>
          <p className="text-sm text-[#969BA8]/55">
            Lancez un scan depuis la fiche du profil ou la page Agents pour
            générer des prospects
          </p>
        </div>
      ) : (
        <ProspectList prospects={prospects} />
      )}
    </div>
  );
}
