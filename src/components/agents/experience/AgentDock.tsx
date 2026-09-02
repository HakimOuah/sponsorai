"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "@/components/layout/NavigationLink";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  CircleAlert,
  LoaderCircle,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentAvatar } from "./AgentAvatar";
import { agentExperienceConfig } from "./config";
import { useAgentExperience } from "./AgentExperienceProvider";
import type { AgentId, AgentMission } from "./types";

type CopilotResponse = {
  reply: string;
  actions: Array<{ label: string; href: string; agentId: AgentId }>;
};

const QUICK_PROMPTS = [
  "Trouver des sponsors pour un talent",
  "Identifier le bon décideur",
  "Préparer un email personnalisé",
];

export function AgentDock() {
  const pathname = usePathname();
  const {
    missions,
    isDockOpen,
    setDockOpen,
    clearCompleted,
  } = useAgentExperience();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copilotResponse, setCopilotResponse] =
    useState<CopilotResponse | null>(null);
  const [error, setError] = useState("");

  const sortedMissions = useMemo(
    () => [...missions].sort((a, b) => b.updatedAt - a.updatedAt),
    [missions],
  );
  const activeMissions = sortedMissions.filter(
    (mission) => mission.status === "running",
  );
  const waitingMissions = sortedMissions.filter(
    (mission) => mission.status === "waiting",
  );
  const visibleMissions = sortedMissions.slice(0, 6);
  const leadingMission = activeMissions[0] || waitingMissions[0];

  const askCopilot = async (event?: FormEvent, prompt?: string) => {
    event?.preventDefault();
    const requestMessage = (prompt || message).trim();
    if (!requestMessage || loading) return;

    setLoading(true);
    setError("");
    setCopilotResponse(null);
    setMessage(requestMessage);

    try {
      const response = await fetch("/api/agents/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: requestMessage, pathname }),
      });
      if (!response.ok) throw new Error("Copilote indisponible");
      const data = (await response.json()) as CopilotResponse;
      setCopilotResponse(data);
    } catch {
      setError("Le copilote n’a pas pu préparer le parcours. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setDockOpen(true)}
        className={cn(
          "fixed bottom-4 right-4 z-[70] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full border border-white/[0.10] bg-[#0A0C11]/95 p-2 pr-4 text-left shadow-[0_20px_70px_rgba(0,0,0,0.48)] backdrop-blur-xl transition-all hover:border-[#FF6B3D]/25 hover:bg-[#10131A] sm:bottom-6 sm:right-6",
          isDockOpen && "pointer-events-none translate-y-2 opacity-0",
        )}
        aria-label="Ouvrir le copilote Vectis"
      >
        {leadingMission ? (
          <AgentAvatar
            agentId={leadingMission.agentId}
            size="sm"
            status={leadingMission.status === "running" ? "active" : "done"}
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF6B3D]/10 text-[#FF8A66]">
            <Sparkles className="h-4 w-4" />
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold text-white/85">
            {leadingMission ? leadingMission.title : "Copilote Vectis"}
          </span>
          <span className="block truncate text-[11px] text-[#969BA8]">
            {activeMissions.length > 0
              ? `${activeMissions.length} mission${activeMissions.length > 1 ? "s" : ""} en cours`
              : waitingMissions.length > 0
                ? "Une prochaine étape vous attend"
                : "Que voulez-vous accomplir ?"}
          </span>
        </span>
        <Bot className="h-4 w-4 shrink-0 text-[#FF8A66]" />
      </button>

      {isDockOpen ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-end bg-black/45 backdrop-blur-sm sm:p-4">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={() => setDockOpen(false)}
            aria-label="Fermer le copilote"
          />
          <aside
            className="relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-white/[0.10] bg-[#080A0F] shadow-[0_30px_100px_rgba(0,0,0,0.62)] sm:h-[min(760px,calc(100dvh-2rem))] sm:max-w-[430px] sm:rounded-[28px]"
            aria-label="Copilote et activité des agents"
          >
            <header className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-4 sm:px-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#FF6B3D]/20 bg-[#FF6B3D]/10 text-[#FF8A66]">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Copilote Vectis
                  </h2>
                  <p className="text-[11px] text-[#969BA8]">
                    Votre équipe d’agents, au même endroit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDockOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-white/45 hover:bg-white/[0.05] hover:text-white"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-5">
              {visibleMissions.length > 0 ? (
                <section>
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#969BA8]">
                      Activité des agents
                    </h3>
                    {visibleMissions.some(
                      (mission) =>
                        mission.status === "completed" ||
                        mission.status === "error",
                    ) ? (
                      <button
                        type="button"
                        onClick={clearCompleted}
                        className="inline-flex items-center gap-1 text-[10px] text-white/35 hover:text-white/60"
                      >
                        <Trash2 className="h-3 w-3" /> Effacer terminées
                      </button>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    {visibleMissions.map((mission) => (
                      <MissionCard key={mission.id} mission={mission} />
                    ))}
                  </div>
                </section>
              ) : (
                <section className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <div className="flex -space-x-2">
                    {(
                      ["scout", "enrichisseur", "redacteur"] as AgentId[]
                    ).map((agentId) => (
                      <AgentAvatar
                        key={agentId}
                        agentId={agentId}
                        size="sm"
                        className="rounded-xl ring-2 ring-[#0A0C11]"
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-sm font-medium text-white/80">
                    Parlez à votre équipe
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#969BA8]">
                    Décrivez votre objectif. Le copilote vous dirigera vers le
                    bon agent et conservera les validations sensibles sous
                    votre contrôle.
                  </p>
                </section>
              )}

              <section>
                <h3 className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#969BA8]">
                  Demander à l’équipe
                </h3>
                {!copilotResponse && !loading ? (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => askCopilot(undefined, prompt)}
                        className="rounded-full border border-white/[0.08] bg-white/[0.025] px-2.5 py-1.5 text-[11px] text-white/50 transition-colors hover:border-[#FF6B3D]/20 hover:text-white/75"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                ) : null}

                {loading ? (
                  <div className="mb-3 flex items-center gap-3 rounded-2xl border border-[#FF6B3D]/15 bg-[#FF6B3D]/[0.05] p-3 text-xs text-white/60">
                    <LoaderCircle className="h-4 w-4 animate-spin text-[#FF8A66]" />
                    Le copilote organise le parcours avec les agents…
                  </div>
                ) : null}

                {copilotResponse ? (
                  <div className="mb-3 rounded-2xl border border-[#C8CEFF]/15 bg-[#C8CEFF]/[0.04] p-3">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#C8CEFF]" />
                      <p className="text-xs leading-relaxed text-white/70">
                        {copilotResponse.reply}
                      </p>
                    </div>
                    {copilotResponse.actions.length > 0 ? (
                      <div className="mt-3 space-y-1.5">
                        {copilotResponse.actions.map((action) => {
                          const agent = agentExperienceConfig[action.agentId];
                          return (
                            <Link
                              key={`${action.agentId}-${action.href}`}
                              href={action.href}
                              onClick={() => setDockOpen(false)}
                              className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-[#0B0D12]/70 px-2.5 py-2 text-xs text-white/70 hover:border-white/[0.12] hover:text-white"
                            >
                              <AgentAvatar
                                agentId={action.agentId}
                                size="sm"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">
                                  {action.label}
                                </span>
                                <span className="block text-[10px] text-[#969BA8]">
                                  avec {agent.name}
                                </span>
                              </span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {error ? (
                  <p className="mb-2 text-xs text-red-300">{error}</p>
                ) : null}

                <form onSubmit={askCopilot} className="relative">
                  <label htmlFor="copilot-message" className="sr-only">
                    Votre demande au copilote
                  </label>
                  <textarea
                    id="copilot-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void askCopilot();
                      }
                    }}
                    rows={3}
                    maxLength={800}
                    placeholder="Ex. Prépare une campagne pour les meilleures marques de Souheil…"
                    className="w-full resize-none rounded-2xl border border-white/[0.09] bg-white/[0.035] px-3.5 py-3 pr-12 text-sm leading-relaxed text-white/80 placeholder:text-white/20 focus:border-[#FF6B3D]/30 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading || !message.trim()}
                    className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6B3D] text-[#0B0D12] disabled:opacity-35"
                    aria-label="Envoyer au copilote"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </section>
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-white/[0.07] px-4 py-3 text-[10px] text-white/30 sm:px-5">
              <span>Les envois restent soumis à votre validation.</span>
              <ChevronDown className="h-3 w-3" />
            </footer>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function MissionCard({ mission }: { mission: AgentMission }) {
  const agent = agentExperienceConfig[mission.agentId];
  const statusIcon = {
    running: <LoaderCircle className="h-3.5 w-3.5 animate-spin" />,
    waiting: <Sparkles className="h-3.5 w-3.5" />,
    completed: <Check className="h-3.5 w-3.5" />,
    error: <CircleAlert className="h-3.5 w-3.5" />,
  }[mission.status];

  return (
    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
      <div className="flex items-start gap-3">
        <AgentAvatar
          agentId={mission.agentId}
          size="sm"
          status={
            mission.status === "running"
              ? "active"
              : mission.status === "error"
                ? "error"
                : "done"
          }
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs font-semibold text-white/80">
              {mission.title}
            </p>
            <span
              className={cn(
                "flex items-center gap-1 text-[10px]",
                mission.status === "error"
                  ? "text-red-300"
                  : mission.status === "completed"
                    ? "text-emerald-300"
                    : "text-[#FF9A7A]",
              )}
            >
              {statusIcon}
              {mission.status === "running"
                ? "En cours"
                : mission.status === "waiting"
                  ? "À vous"
                  : mission.status === "completed"
                    ? "Terminé"
                    : "Erreur"}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-[#969BA8]">
            {mission.detail}
          </p>
          {mission.progress !== undefined && mission.status === "running" ? (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${Math.max(4, Math.min(100, mission.progress))}%`,
                  backgroundColor: agent.color,
                }}
              />
            </div>
          ) : null}
          {mission.actionLabel && mission.actionHref ? (
            <Link
              href={mission.actionHref}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#FF9A7A] hover:text-[#FFB29B]"
            >
              {mission.actionLabel} <ArrowRight className="h-3 w-3" />
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
