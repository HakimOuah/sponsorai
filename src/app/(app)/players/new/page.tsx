import { Users } from "lucide-react";
import { createPlayer } from "@/lib/actions/players";
import { PlayerForm } from "@/components/players/PlayerForm";

export default function NewPlayerPage() {
  return (
    <div className="min-w-0">
      <div className="mb-6 flex items-center gap-3">
        <Users className="h-6 w-6 text-[#FF6B3D]" />
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#F6F4EF] sm:text-3xl">
          Nouveau profil sportif
        </h1>
      </div>
      <div className="app-panel p-4 sm:p-6">
        <PlayerForm action={createPlayer} />
      </div>
    </div>
  );
}
