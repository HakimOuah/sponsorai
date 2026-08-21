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
      className="w-full rounded-full border border-white/[0.10] bg-white/[0.045] px-3 py-2.5 text-sm text-white transition-colors focus:border-[#FF6B3D]/50 focus:outline-none sm:max-w-md"
    >
      <option value="">Tous les profils sportifs</option>
      {players.map((p) => (
        <option key={p.id} value={p.id}>
          {p.firstName} {p.lastName} — {p.club}
        </option>
      ))}
    </select>
  );
}
