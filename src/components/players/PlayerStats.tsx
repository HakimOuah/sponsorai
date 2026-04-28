import { Camera, AtSign, TrendingUp, Handshake, Search, ScanLine } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { Player } from "@prisma/client";

interface PlayerStatsProps {
  player: Player & {
    _count: {
      deals: number;
      prospects: number;
      scans: number;
    };
  };
}

export function PlayerStats({ player }: PlayerStatsProps) {
  const stats = [
    {
      label: "Followers IG",
      value: player.followersIG ? formatNumber(player.followersIG) : "—",
      icon: Camera,
      color: "#E4405F",
    },
    {
      label: "Followers X",
      value: player.followersX ? formatNumber(player.followersX) : "—",
      icon: AtSign,
      color: "#1DA1F2",
    },
    {
      label: "Engagement",
      value: player.engagementRate ? `${player.engagementRate}%` : "—",
      icon: TrendingUp,
      color: "#3EF2A0",
    },
    {
      label: "Deals",
      value: player._count.deals.toString(),
      icon: Handshake,
      color: "#f59e0b",
    },
    {
      label: "Prospects",
      value: player._count.prospects.toString(),
      icon: Search,
      color: "#DDFBEA",
    },
    {
      label: "Scans",
      value: player._count.scans.toString(),
      icon: ScanLine,
      color: "#DDFBEA",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="app-soft-panel p-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-3.5 w-3.5" style={{ color: stat.color }} />
              <span className="text-[11px] text-[#8FA69E]">{stat.label}</span>
            </div>
            <p className="font-mono text-lg font-semibold text-white">
              {stat.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
