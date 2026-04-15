import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { getPlayers } from "@/lib/actions/players";
import { PlayerCard } from "@/components/players/PlayerCard";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const players = await getPlayers();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-[#00d4aa]" />
          <h1 className="text-2xl font-bold text-white">Joueurs</h1>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 font-mono text-xs text-white/40">
            {players.length}
          </span>
        </div>
        <Link
          href="/players/new"
          className="flex items-center gap-2 rounded-lg bg-[#00d4aa] px-4 py-2 text-sm font-semibold text-[#07090f] hover:bg-[#00e4ba] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Ajouter un joueur
        </Link>
      </div>

      {players.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-[#0c1019] p-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-white/10" />
          <p className="text-white/40 mb-4">Aucun joueur dans le portefeuille</p>
          <Link
            href="/players/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#00d4aa] px-4 py-2 text-sm font-semibold text-[#07090f] hover:bg-[#00e4ba] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter le premier joueur
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      )}
    </div>
  );
}
