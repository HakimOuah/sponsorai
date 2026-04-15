import { Users } from "lucide-react";
import { createPlayer } from "@/lib/actions/players";
import { PlayerForm } from "@/components/players/PlayerForm";

export default function NewPlayerPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-6 w-6 text-[#00d4aa]" />
        <h1 className="text-2xl font-bold text-white">Nouveau joueur</h1>
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-[#0c1019] p-6">
        <PlayerForm action={createPlayer} />
      </div>
    </div>
  );
}
