"use client";

import { Check, CircleAlert, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentAvatar } from "./AgentAvatar";
import { agentExperienceConfig } from "./config";
import type { AgentId } from "./types";

export function AgentExecutionCard({
  agentId,
  title,
  detail,
  status,
  progress,
  children,
  onMinimize,
}: {
  agentId: AgentId;
  title: string;
  detail: string;
  status: "running" | "completed" | "error";
  progress?: number;
  children?: React.ReactNode;
  onMinimize?: () => void;
}) {
  const agent = agentExperienceConfig[agentId];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0A0C11] p-4 sm:p-5">
      <div
        className="pointer-events-none absolute -left-12 -top-14 h-40 w-40 rounded-full blur-3xl"
        style={{ backgroundColor: `${agent.color}18` }}
      />
      <div className="relative flex items-start gap-3.5">
        <AgentAvatar
          agentId={agentId}
          size="md"
          status={
            status === "running"
              ? "active"
              : status === "completed"
                ? "done"
                : "error"
          }
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em]"
              style={{
                borderColor: `${agent.color}30`,
                backgroundColor: `${agent.color}12`,
                color: agent.color,
              }}
            >
              Agent {agent.name}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px]",
                status === "error"
                  ? "text-red-300"
                  : status === "completed"
                    ? "text-emerald-300"
                    : "text-white/40",
              )}
            >
              {status === "running" ? (
                <LoaderCircle className="h-3 w-3 animate-spin" />
              ) : status === "completed" ? (
                <Check className="h-3 w-3" />
              ) : (
                <CircleAlert className="h-3 w-3" />
              )}
              {status === "running"
                ? "En mission"
                : status === "completed"
                  ? "Terminé"
                  : "Interrompu"}
            </span>
          </div>
          <h3 className="mt-2 text-base font-semibold text-white/90">
            {title}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-[#969BA8]">
            {detail}
          </p>
        </div>
        {onMinimize ? (
          <button
            type="button"
            onClick={onMinimize}
            className="text-[10px] text-white/35 hover:text-white/65"
          >
            Réduire
          </button>
        ) : null}
      </div>

      {progress !== undefined ? (
        <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${Math.max(4, Math.min(100, progress))}%`,
              background: `linear-gradient(90deg, ${agent.color}, #C8CEFF)`,
            }}
          />
        </div>
      ) : null}

      {children ? <div className="relative mt-4">{children}</div> : null}
    </section>
  );
}

