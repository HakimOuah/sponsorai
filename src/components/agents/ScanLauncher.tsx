"use client";

import { useState } from "react";
import { LoaderCircle, Play } from "lucide-react";
import { ScanProgress } from "./ScanProgress";
import { useScanRunner } from "./useScanRunner";

interface ScanLauncherProps {
  players: { id: string; firstName: string; lastName: string; club: string }[];
}

export function ScanLauncher({ players }: ScanLauncherProps) {
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const scan = useScanRunner();
  const selectedProfile = players.find((player) => player.id === selectedPlayer);

  return (
    <div className="space-y-4">
      {/* Player selector + Launch */}
      <div className="flex items-center gap-3">
        <select
          value={selectedPlayer}
          onChange={(e) => setSelectedPlayer(e.target.value)}
          disabled={scan.isRunning}
          className="flex-1 rounded-2xl border border-white/[0.10] bg-white/[0.045] px-3 py-2.5 text-sm text-white focus:border-[#FF6B3D]/50 focus:outline-none transition-colors disabled:opacity-50"
        >
          <option value="">Sélectionner un profil sportif...</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.firstName} {p.lastName} — {p.club}
            </option>
          ))}
        </select>

        <button
          onClick={() =>
            scan.startScan(
              selectedPlayer,
              selectedProfile
                ? `${selectedProfile.firstName} ${selectedProfile.lastName}`
                : undefined,
            )
          }
          disabled={!selectedPlayer || scan.isRunning}
          className="flex items-center gap-2 rounded-full bg-[#FF6B3D] px-5 py-2.5 text-sm font-semibold text-[#0B0D12] hover:bg-[#FF865F] transition-colors disabled:opacity-50"
        >
          {scan.isRunning ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Scan en cours...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Lancer le scan
            </>
          )}
        </button>
      </div>

      {(scan.isRunning || scan.result) && selectedProfile && (
        <ScanProgress
          playerName={`${selectedProfile.firstName} ${selectedProfile.lastName}`}
          phase={scan.phase}
          progress={scan.progress}
          isRunning={scan.isRunning}
          result={scan.result}
          elapsedSeconds={scan.elapsedSeconds}
        />
      )}
    </div>
  );
}
