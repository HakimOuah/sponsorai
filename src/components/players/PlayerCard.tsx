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
  const profileLabel = player.profileType === "club" ? "Club" : "Sportif";

  const totalFollowers =
    (player.followersIG || 0) +
    (player.followersTK || 0) +
    (player.followersX || 0);

  return (
    <Link
      href={`/players/${player.id}`}
      className="group rounded-[28px] border border-white/[0.10] bg-[#061511]/85 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-[#3EF2A0]/35 hover:bg-[#082019]"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#3EF2A0]/20 bg-[#3EF2A0]/10 text-lg font-semibold text-[#3EF2A0] shadow-[0_0_28px_rgba(62,242,160,0.08)]">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name & Position */}
          <h3 className="truncate font-semibold text-[#F8FAF7]">
            {player.firstName} {player.lastName}
          </h3>
          <p className="truncate text-sm text-[#8FA69E]">
            {player.sport && `${player.sport} · `}
            {player.position && `${player.position} · `}
            {player.club}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 flex items-center gap-3">
        {player.league && (
          <span className="rounded-full border border-white/[0.10] bg-white/[0.045] px-2.5 py-1 font-mono text-[11px] text-[#D8DEDA]/70">
            {player.league}
          </span>
        )}
        <span className="rounded-full border border-[#3EF2A0]/15 bg-[#3EF2A0]/10 px-2.5 py-1 font-mono text-[11px] text-[#3EF2A0]">
          {profileLabel}
        </span>
        {player.nationality && (
          <span className="rounded-full border border-white/[0.10] bg-white/[0.045] px-2.5 py-1 font-mono text-[11px] text-[#D8DEDA]/70">
            {player.nationality}
          </span>
        )}
      </div>

      {/* Social + Deals */}
      <div className="mt-3 flex items-center justify-between border-t border-[#3EF2A0]/10 pt-3">
        <div className="flex items-center gap-3">
          {player.followersIG ? (
            <div className="flex items-center gap-1 text-[#8FA69E]">
              <Camera className="h-3 w-3" />
              <span className="font-mono text-xs">
                {formatNumber(player.followersIG)}
              </span>
            </div>
          ) : null}
          {player.followersX ? (
            <div className="flex items-center gap-1 text-[#8FA69E]">
              <AtSign className="h-3 w-3" />
              <span className="font-mono text-xs">
                {formatNumber(player.followersX)}
              </span>
            </div>
          ) : null}
          {!player.followersIG && !player.followersX && totalFollowers === 0 && (
            <span className="text-xs text-[#8FA69E]/55">Pas de réseaux</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {player._count.deals > 0 && (
            <span className="rounded-full bg-[#3EF2A0]/10 px-2 py-0.5 font-mono text-[11px] text-[#3EF2A0]">
              {player._count.deals} deal{player._count.deals > 1 ? "s" : ""}
            </span>
          )}
          {player._count.prospects > 0 && (
            <span className="rounded-full bg-[#DDFBEA]/10 px-2 py-0.5 font-mono text-[11px] text-[#DDFBEA]">
              {player._count.prospects} prospect{player._count.prospects > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
