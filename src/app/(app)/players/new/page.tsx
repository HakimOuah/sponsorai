import { Users } from "lucide-react";
import { createPlayer } from "@/lib/actions/players";
import { PlayerForm } from "@/components/players/PlayerForm";

export default function NewPlayerPage() {
  return (
    <div className="min-w-0">
      <div className="mb-6 flex items-center gap-3">
        <Users className="h-6 w-6 text-[#3EF2A0]" />
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#F8FAF7] sm:text-3xl">Nouveau profil sportif</h1>
      </div>
      <div className="app-panel p-4 sm:p-6">
        <PlayerForm action={createPlayer} />
      </div>
    </div>
  );
}
