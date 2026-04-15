import Link from "next/link";
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
  const players = await prisma.player.findMany({
    where: { active: true },
    select: { id: true, firstName: true, lastName: true, club: true },
    orderBy: { lastName: "asc" },
  });

  const selectedPlayerId = searchParams.player || "";
  const prospects = await getProspects(selectedPlayerId || undefined);
  const scans = selectedPlayerId
    ? await getScansForPlayer(selectedPlayerId)
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Search className="h-6 w-6 text-[#00d4aa]" />
          <h1 className="text-2xl font-bold text-white">Prospection</h1>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 font-mono text-xs text-white/40">
            {prospects.length} prospect{prospects.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Link
          href="/agents"
          className="flex items-center gap-2 rounded-lg bg-[#00d4aa] px-4 py-2 text-sm font-semibold text-[#07090f] hover:bg-[#00e4ba] transition-colors"
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
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/30 mb-2">
            Scans pour ce joueur
          </h2>
          <div className="flex flex-wrap gap-2">
            {scans.map((scan) => (
              <div
                key={scan.id}
                className="rounded-lg border border-white/[0.06] bg-[#0c1019] px-3 py-2 text-xs"
              >
                <span className={`font-mono ${scan.status === "completed" ? "text-[#00d4aa]" : scan.status === "failed" ? "text-red-400" : "text-[#0088ff]"}`}>
                  {scan.status}
                </span>
                <span className="text-white/30 ml-2">
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
        <div className="rounded-xl border border-white/[0.06] bg-[#0c1019] p-12 text-center">
          <Search className="mx-auto mb-3 h-10 w-10 text-white/10" />
          <p className="text-white/40 mb-2">
            {selectedPlayerId
              ? "Aucun prospect pour ce joueur"
              : "Sélectionnez un joueur ou consultez tous les prospects"}
          </p>
          <p className="text-sm text-white/20">
            Lancez un scan depuis la page Agents pour générer des prospects
          </p>
        </div>
      ) : (
        <ProspectList prospects={prospects} />
      )}
    </div>
  );
}
