import Link from "next/link";
import { Camera, AtSign } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { Player } from "@prisma/client";

interface PlayerCardProps {
  player: Player & {
    _count: {
      deals: number;
      prospects: number;
      scans: number;
    };
  };
}

export function PlayerCard({ player }: PlayerCardProps) {
  const initials =
    player.firstName.charAt(0) + player.lastName.charAt(0);

  const totalFollowers =
    (player.followersIG || 0) +
    (player.followersTK || 0) +
    (player.followersX || 0);

  return (
    <Link
      href={`/players/${player.id}`}
      className="group rounded-xl border border-white/[0.06] bg-[#0c1019] p-5 transition-all hover:border-white/[0.12] hover:bg-[#0e1220]"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#00d4aa]/10 text-[#00d4aa] font-semibold text-lg">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name & Position */}
          <h3 className="font-semibold text-white truncate">
            {player.firstName} {player.lastName}
          </h3>
          <p className="text-sm text-white/40 truncate">
            {player.position && `${player.position} · `}
            {player.club}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 flex items-center gap-3">
        {player.league && (
          <span className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-[11px] text-white/50">
            {player.league}
          </span>
        )}
        {player.nationality && (
          <span className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-[11px] text-white/50">
            {player.nationality}
          </span>
        )}
      </div>

      {/* Social + Deals */}
      <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
        <div className="flex items-center gap-3">
          {player.followersIG ? (
            <div className="flex items-center gap-1 text-white/40">
              <Camera className="h-3 w-3" />
              <span className="font-mono text-xs">
                {formatNumber(player.followersIG)}
              </span>
            </div>
          ) : null}
          {player.followersX ? (
            <div className="flex items-center gap-1 text-white/40">
              <AtSign className="h-3 w-3" />
              <span className="font-mono text-xs">
                {formatNumber(player.followersX)}
              </span>
            </div>
          ) : null}
          {!player.followersIG && !player.followersX && totalFollowers === 0 && (
            <span className="text-xs text-white/20">Pas de réseaux</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {player._count.deals > 0 && (
            <span className="rounded-full bg-[#00d4aa]/10 px-2 py-0.5 font-mono text-[11px] text-[#00d4aa]">
              {player._count.deals} deal{player._count.deals > 1 ? "s" : ""}
            </span>
          )}
          {player._count.prospects > 0 && (
            <span className="rounded-full bg-[#0088ff]/10 px-2 py-0.5 font-mono text-[11px] text-[#0088ff]">
              {player._count.prospects} prospect{player._count.prospects > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
