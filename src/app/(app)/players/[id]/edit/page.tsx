import { notFound } from "next/navigation";
import Link from "next/link";
import { Users, ArrowLeft } from "lucide-react";
import { getPlayer, updatePlayer } from "@/lib/actions/players";
import { PlayerForm } from "@/components/players/PlayerForm";

export default async function EditPlayerPage({
  params,
}: {
  params: { id: string };
}) {
  const player = await getPlayer(params.id);

  if (!player) return notFound();

  const updateAction = updatePlayer.bind(null, player.id);

  return (
    <div>
      <Link
        href={`/players/${player.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#8FA69E] hover:text-white/70 transition-colors mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {player.firstName} {player.lastName}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <Users className="h-6 w-6 text-[#3EF2A0]" />
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#F8FAF7]">Modifier le joueur</h1>
      </div>

      <div className="app-panel p-6">
        <PlayerForm action={updateAction} player={player} />
      </div>
    </div>
  );
}
