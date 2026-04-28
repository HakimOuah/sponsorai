import { Users } from "lucide-react";
import { createPlayer } from "@/lib/actions/players";
import { PlayerForm } from "@/components/players/PlayerForm";

export default function NewPlayerPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-6 w-6 text-[#3EF2A0]" />
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#F8FAF7]">Nouveau joueur</h1>
      </div>
      <div className="app-panel p-6">
        <PlayerForm action={createPlayer} />
      </div>
    </div>
  );
}
