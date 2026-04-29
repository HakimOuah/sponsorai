import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { getPlayers } from "@/lib/actions/players";
import { PlayerCard } from "@/components/players/PlayerCard";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const players = await getPlayers();

  return (
    <div className="min-w-0">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="app-title-icon">
            <Users className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-[-0.03em] text-[#F8FAF7] sm:text-3xl">
                Joueurs
              </h1>
              <span className="rounded-full border border-[#3EF2A0]/15 bg-[#3EF2A0]/10 px-2.5 py-0.5 font-mono text-xs text-[#3EF2A0]">
                {players.length}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#8FA69E]">
              Portefeuille talents, données sociales et potentiel sponsoring.
            </p>
          </div>
        </div>
        <Link
          href="/players/new"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#F8FAF7] px-4 py-2.5 text-sm font-semibold text-[#020403] shadow-[0_14px_38px_rgba(62,242,160,0.12)] transition-all hover:-translate-y-0.5 hover:bg-white sm:w-auto sm:py-2"
        >
          <Plus className="h-4 w-4" />
          Ajouter un joueur
        </Link>
      </div>

      {players.length === 0 ? (
        <div className="app-panel p-6 text-center sm:p-12">
          <Users className="mx-auto mb-3 h-10 w-10 text-white/10" />
          <p className="text-[#8FA69E] mb-4">Aucun joueur dans le portefeuille</p>
          <Link
            href="/players/new"
            className="inline-flex items-center gap-2 rounded-full bg-[#F8FAF7] px-4 py-2 text-sm font-semibold text-[#020403] transition-all hover:-translate-y-0.5 hover:bg-white"
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
