"use client";

import { useRouter } from "next/navigation";

interface PlayerSelectorProps {
  players: { id: string; firstName: string; lastName: string; club: string }[];
  selectedId: string;
}

export function PlayerSelector({ players, selectedId }: PlayerSelectorProps) {
  const router = useRouter();

  return (
    <select
      value={selectedId}
      onChange={(e) => {
        const val = e.target.value;
        router.push(val ? `/prospection?player=${val}` : "/prospection");
      }}
      className="w-full max-w-md rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white focus:border-[#00d4aa]/50 focus:outline-none transition-colors"
    >
      <option value="">Tous les joueurs</option>
      {players.map((p) => (
        <option key={p.id} value={p.id}>
          {p.firstName} {p.lastName} — {p.club}
        </option>
      ))}
    </select>
  );
}
