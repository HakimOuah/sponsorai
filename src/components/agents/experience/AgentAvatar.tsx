"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { agentExperienceConfig } from "./config";
import type { AgentId } from "./types";

export function AgentAvatar({
  agentId,
  size = "md",
  status,
  className,
}: {
  agentId: AgentId;
  size?: "sm" | "md" | "lg";
  status?: "active" | "done" | "error";
  className?: string;
}) {
  const agent = agentExperienceConfig[agentId];
  const sizeClass = {
    sm: "h-9 w-9 rounded-xl",
    md: "h-12 w-12 rounded-2xl",
    lg: "h-16 w-16 rounded-2xl",
  }[size];

  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        className={cn(
          "relative overflow-hidden border border-white/[0.10] bg-[#11141B]",
          sizeClass,
        )}
        style={{ boxShadow: `0 0 28px ${agent.color}24` }}
      >
        <Image
          src={agent.avatar}
          alt={`Avatar de l’agent ${agent.name}`}
          fill
          sizes={size === "lg" ? "64px" : size === "md" ? "48px" : "36px"}
          className="object-cover"
        />
      </div>
      {status ? (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-[#0B0D12]",
            status === "active" && "animate-pulse bg-[#FF6B3D]",
            status === "done" && "bg-emerald-400",
            status === "error" && "bg-red-400",
          )}
        />
      ) : null}
    </div>
  );
}

