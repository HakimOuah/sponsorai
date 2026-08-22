"use client";

import { useState, useCallback } from "react";
import {
  Loader2,
  AlertTriangle,
  TrendingUp,
  ArrowRightLeft,
  LogIn,
  LogOut,
  Clock,
} from "lucide-react";
import { AgentAvatar } from "./experience/AgentAvatar";
import { AgentExecutionCard } from "./experience/AgentExecutionCard";
import { useAgentExperience } from "./experience/AgentExperienceProvider";

interface VeilleAlert {
  type:
    "new_deal" | "contract_end" | "brand_entering" | "brand_leaving" | "trend";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  source: string;
  opportunity: string | null;
  threat: string | null;
  related_player: string | null;
  related_brand: string | null;
}

interface VeilleResult {
  alerts: VeilleAlert[];
  market_summary: string;
}

export function VeillePanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [missionDetail, setMissionDetail] = useState("");
  const [result, setResult] = useState<VeilleResult | null>(null);
  const [error, setError] = useState("");
  const { startMission, updateMission, finishMission, failMission } =
    useAgentExperience();

  const launch = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);
    setProgress(8);
    setMissionDetail("Veille cartographie l’actualité récente du sponsoring.");
    setResult(null);
    setError("");
    const missionId = startMission({
      agentId: "veille-concurrence",
      title: "Détecter les signaux du marché",
      detail: "Veille cartographie l’actualité récente du sponsoring.",
      progress: 8,
    });
    let semanticProgress = 8;
    let receivedTerminalEvent = false;

    try {
      const response = await fetch("/api/agents/veille", {
        method: "POST",
      });

      if (!response.ok || !response.body) {
        throw new Error("Erreur de connexion au serveur");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "log") {
                semanticProgress = Math.min(90, semanticProgress + 15);
                const detail = veilleDetail(String(data.message || ""));
                setProgress(semanticProgress);
                setMissionDetail(detail);
                updateMission(missionId, {
                  progress: semanticProgress,
                  detail,
                });
              } else if (data.type === "done") {
                receivedTerminalEvent = true;
                setResult(data.result);
                finishMission(
                  missionId,
                  `${data.result.alerts.length} signal${data.result.alerts.length > 1 ? "s" : ""} détecté${data.result.alerts.length > 1 ? "s" : ""}. Choisissez une alerte pour orienter Scout.`,
                  {
                    status: "waiting",
                    nextAgentId: "scout",
                    actionLabel: "Explorer les talents",
                    actionHref: "/players",
                  },
                );
              } else if (data.type === "error") {
                receivedTerminalEvent = true;
                throw new Error(data.message);
              }
            } catch {
              // Skip malformed
            }
          }
        }
      }
      if (!receivedTerminalEvent) {
        throw new Error("La veille s’est interrompue avant la synthèse finale.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
      failMission(missionId, message);
    } finally {
      setIsRunning(false);
    }
  }, [
    failMission,
    finishMission,
    isRunning,
    startMission,
    updateMission,
  ]);

  const typeConfig: Record<
    string,
    { icon: typeof TrendingUp; label: string; color: string }
  > = {
    new_deal: {
      icon: ArrowRightLeft,
      label: "Nouveau deal",
      color: "text-[#C8CEFF]",
    },
    contract_end: {
      icon: Clock,
      label: "Fin de contrat",
      color: "text-[#f59e0b]",
    },
    brand_entering: {
      icon: LogIn,
      label: "Marque entrante",
      color: "text-[#FF6B3D]",
    },
    brand_leaving: {
      icon: LogOut,
      label: "Marque sortante",
      color: "text-red-400",
    },
    trend: { icon: TrendingUp, label: "Tendance", color: "text-[#C8CEFF]" },
  };

  const priorityConfig: Record<string, { bg: string; text: string }> = {
    high: { bg: "bg-red-500/10", text: "text-red-400" },
    medium: { bg: "bg-[#f59e0b]/10", text: "text-[#f59e0b]" },
    low: { bg: "bg-white/[0.06]", text: "text-[#969BA8]" },
  };

  return (
    <div className="space-y-4">
      {/* Launch */}
      <div className="flex items-center gap-3">
        <button
          onClick={launch}
          disabled={isRunning}
          className="flex items-center gap-2 rounded-lg bg-[#C8CEFF] px-5 py-2.5 text-sm font-semibold text-[#0B0D12] hover:bg-[#C8CEFF]/80 transition-colors disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Veille en cours...
            </>
          ) : (
            <>
              <AgentAvatar agentId="veille-concurrence" size="sm" />
              Lancer la veille concurrentielle
            </>
          )}
        </button>
        {!isRunning && !result && (
          <span className="text-xs text-[#969BA8]">
            Scanne l&apos;actualité sponsoring sportif et identifie les
            opportunités
          </span>
        )}
      </div>

      {(isRunning || error) && (
        <AgentExecutionCard
          agentId="veille-concurrence"
          title="Lecture du marché en cours"
          detail={error || missionDetail}
          status={error ? "error" : "running"}
          progress={progress}
        />
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Market summary */}
          <div className="rounded-lg border border-[#a855f7]/20 bg-[#C8CEFF]/5 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#969BA8] mb-1">
              Résumé du marché
            </p>
            <p className="text-sm text-white/70 leading-relaxed">
              {result.market_summary}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-red-500/10 px-3 py-1 font-mono text-xs text-red-400">
              {result.alerts.filter((a) => a.priority === "high").length} haute
            </span>
            <span className="rounded-full bg-[#f59e0b]/10 px-3 py-1 font-mono text-xs text-[#f59e0b]">
              {result.alerts.filter((a) => a.priority === "medium").length}{" "}
              moyenne
            </span>
            <span className="rounded-full bg-white/[0.06] px-3 py-1 font-mono text-xs text-[#969BA8]">
              {result.alerts.filter((a) => a.priority === "low").length} basse
            </span>
          </div>

          {/* Alerts */}
          <div className="space-y-2">
            {result.alerts
              .sort((a, b) => {
                const order = { high: 0, medium: 1, low: 2 };
                return order[a.priority] - order[b.priority];
              })
              .map((alert, i) => {
                const tc = typeConfig[alert.type] || typeConfig.trend;
                const TypeIcon = tc.icon;
                const pc = priorityConfig[alert.priority] || priorityConfig.low;

                return (
                  <div key={i} className="app-panel p-4 space-y-2">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <TypeIcon className={`h-4 w-4 ${tc.color}`} />
                        <h4 className="text-sm font-semibold text-white">
                          {alert.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${tc.color} bg-white/[0.06]`}
                        >
                          {tc.label}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${pc.text} ${pc.bg}`}
                        >
                          {alert.priority}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-white/60 leading-relaxed">
                      {alert.description}
                    </p>

                    {/* Source */}
                    <p className="text-xs text-white/25">
                      Source : {alert.source}
                    </p>

                    {/* Opportunity / Threat */}
                    <div className="flex flex-wrap gap-2">
                      {alert.opportunity && (
                        <div className="flex items-start gap-1.5 rounded-full bg-[#FF6B3D]/5 border border-[#FF6B3D]/10 px-2.5 py-1.5 text-xs text-[#FF6B3D]">
                          <TrendingUp className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>{alert.opportunity}</span>
                        </div>
                      )}
                      {alert.threat && (
                        <div className="flex items-start gap-1.5 rounded-lg bg-red-500/5 border border-red-500/10 px-2.5 py-1.5 text-xs text-red-400">
                          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>{alert.threat}</span>
                        </div>
                      )}
                    </div>

                    {/* Related */}
                    {(alert.related_player || alert.related_brand) && (
                      <div className="flex items-center gap-2 text-[11px] text-white/25">
                        {alert.related_player && (
                          <span className="rounded bg-white/[0.06] px-1.5 py-0.5">
                            Profil : {alert.related_player}
                          </span>
                        )}
                        {alert.related_brand && (
                          <span className="rounded bg-white/[0.06] px-1.5 py-0.5">
                            Marque : {alert.related_brand}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Note */}
          <p className="text-xs text-[#969BA8]/55">
            Les alertes de priorité haute sont automatiquement enregistrées dans
            le journal d&apos;activité.
          </p>
        </div>
      )}
    </div>
  );
}

function veilleDetail(message: string) {
  if (message.includes("actualités")) {
    return "Veille rassemble les annonces et mouvements récents du sponsoring sportif.";
  }
  if (message.includes("signal")) {
    return "Veille rattache les signaux utiles au graphe d’intelligence.";
  }
  if (message.includes("alerte")) {
    return "Veille classe les alertes selon leur potentiel et leur urgence.";
  }
  if (message.includes("Résumé")) {
    return "Veille prépare une synthèse exploitable par Scout.";
  }
  return "Veille croise l’actualité avec vos talents et les marques du pipeline.";
}
