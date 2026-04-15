"use client";

import { useState, useCallback } from "react";
import {
  Radar,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  TrendingUp,
  ArrowRightLeft,
  LogIn,
  LogOut,
  Clock,
  Filter,
} from "lucide-react";

interface VeilleAlert {
  type: "new_deal" | "contract_end" | "brand_entering" | "brand_leaving" | "trend";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  source: string;
  opportunity: string | null;
  threat: string | null;
  related_player: string | null;
  related_brand: string | null;
}

interface VeilleRunData {
  id: string;
  status: string;
  alertsCount: number | null;
  highCount: number | null;
  marketSummary: string | null;
  alerts: unknown;
  duration: number | null;
  createdAt: Date;
}

interface LogEntry {
  message: string;
  type: string;
  timestamp: number;
}

interface VeilleHistoryProps {
  initialRuns: VeilleRunData[];
}

const typeConfig: Record<string, { icon: typeof TrendingUp; label: string; color: string }> = {
  new_deal: { icon: ArrowRightLeft, label: "Nouveau deal", color: "text-[#0088ff]" },
  contract_end: { icon: Clock, label: "Fin de contrat", color: "text-[#f59e0b]" },
  brand_entering: { icon: LogIn, label: "Marque entrante", color: "text-[#00d4aa]" },
  brand_leaving: { icon: LogOut, label: "Marque sortante", color: "text-red-400" },
  trend: { icon: TrendingUp, label: "Tendance", color: "text-[#8b5cf6]" },
};

const priorityConfig: Record<string, { bg: string; text: string }> = {
  high: { bg: "bg-red-500/10", text: "text-red-400" },
  medium: { bg: "bg-[#f59e0b]/10", text: "text-[#f59e0b]" },
  low: { bg: "bg-white/[0.06]", text: "text-white/40" },
};

export function VeilleHistory({ initialRuns }: VeilleHistoryProps) {
  const [runs, setRuns] = useState(initialRuns);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const launch = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);
    setLogs([]);

    const startTime = Date.now();

    try {
      const response = await fetch("/api/agents/veille", { method: "POST" });

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
                setLogs((prev) => [
                  ...prev,
                  {
                    message: data.message,
                    type: data.logType || "info",
                    timestamp: Date.now() - startTime,
                  },
                ]);
              } else if (data.type === "done") {
                // Refresh runs from server
                const runsRes = await fetch("/api/agents/veille");
                if (runsRes.ok) {
                  const newRuns = await runsRes.json();
                  setRuns(newRuns);
                  // Auto-expand the latest run
                  if (newRuns.length > 0) {
                    setExpandedRun(newRuns[0].id);
                  }
                }
              } else if (data.type === "error") {
                setLogs((prev) => [
                  ...prev,
                  { message: data.message, type: "error", timestamp: Date.now() - startTime },
                ]);
              }
            } catch {
              // Skip malformed
            }
          }
        }
      }
    } catch (err) {
      setLogs((prev) => [
        ...prev,
        {
          message: err instanceof Error ? err.message : "Erreur inconnue",
          type: "error",
          timestamp: Date.now() - startTime,
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  }, [isRunning]);

  const getFilteredAlerts = (alerts: VeilleAlert[]) => {
    return alerts.filter((a) => {
      if (filterType !== "all" && a.type !== filterType) return false;
      if (filterPriority !== "all" && a.priority !== filterPriority) return false;
      return true;
    });
  };

  return (
    <div className="space-y-6">
      {/* Launch button + Console */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={launch}
            disabled={isRunning}
            className="flex items-center gap-2 rounded-lg bg-[#a855f7] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#a855f7]/80 transition-colors disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Veille en cours...
              </>
            ) : (
              <>
                <Radar className="h-4 w-4" />
                Lancer une veille
              </>
            )}
          </button>
          {!isRunning && runs.length === 0 && (
            <span className="text-xs text-white/30">
              Scanne l&apos;actualit&eacute; sponsoring football et identifie les opportunit&eacute;s
            </span>
          )}
        </div>

        {/* Console logs */}
        {logs.length > 0 && (
          <div className="rounded-xl border border-white/[0.06] bg-[#07090f] p-3 max-h-48 overflow-y-auto font-mono text-xs space-y-1">
            {logs.map((log, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 ${
                  log.type === "success"
                    ? "text-[#00d4aa]"
                    : log.type === "data"
                      ? "text-[#0088ff]"
                      : log.type === "error"
                        ? "text-red-400"
                        : "text-white/50"
                }`}
              >
                <span className="text-white/20 shrink-0">
                  {(log.timestamp / 1000).toFixed(1)}s
                </span>
                <span>{log.message}</span>
              </div>
            ))}
            {isRunning && (
              <div className="flex items-center gap-2 text-white/30">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>En cours...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      {runs.length > 0 && (
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-white/30" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white focus:border-[#a855f7]/50 focus:outline-none transition-colors"
          >
            <option value="all">Tous les types</option>
            <option value="new_deal">Nouveau deal</option>
            <option value="contract_end">Fin de contrat</option>
            <option value="brand_entering">Marque entrante</option>
            <option value="brand_leaving">Marque sortante</option>
            <option value="trend">Tendance</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white focus:border-[#a855f7]/50 focus:outline-none transition-colors"
          >
            <option value="all">Toutes priorit&eacute;s</option>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Basse</option>
          </select>
        </div>
      )}

      {/* Run history */}
      {runs.length === 0 && !isRunning ? (
        <div className="rounded-xl border border-white/[0.06] bg-[#0c1019] p-12 text-center">
          <Radar className="mx-auto mb-3 h-10 w-10 text-white/10" />
          <p className="text-white/40 mb-2">Aucune veille lanc&eacute;e</p>
          <p className="text-sm text-white/20">
            Lancez votre premi&egrave;re veille pour scanner le march&eacute; du sponsoring
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => {
            const isExpanded = expandedRun === run.id;
            const alerts = (run.alerts as VeilleAlert[] | undefined | null) || [];
            const filtered = getFilteredAlerts(alerts);

            return (
              <div
                key={run.id}
                className="rounded-xl border border-white/[0.06] bg-[#0c1019] overflow-hidden"
              >
                {/* Run header */}
                <button
                  onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <RunStatusBadge status={run.status} />
                  <div className="flex-1 text-left">
                    <span className="text-sm text-white/80">
                      {new Date(run.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {run.alertsCount != null && (
                      <span className="font-mono text-xs text-white/40">
                        {run.alertsCount} alerte{run.alertsCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {run.highCount != null && run.highCount > 0 && (
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 font-mono text-[10px] text-red-400">
                        {run.highCount} haute{run.highCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {run.duration != null && (
                      <span className="font-mono text-xs text-white/30">
                        {run.duration}s
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-white/30" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-white/30" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && run.status === "completed" && (
                  <div className="border-t border-white/[0.06] px-4 pb-4 pt-3 space-y-4">
                    {/* Market summary */}
                    {run.marketSummary && (
                      <div className="rounded-lg border border-[#a855f7]/20 bg-[#a855f7]/5 p-4">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-white/30 mb-1">
                          R&eacute;sum&eacute; du march&eacute;
                        </p>
                        <p className="text-sm text-white/70 leading-relaxed">
                          {run.marketSummary}
                        </p>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-red-500/10 px-3 py-1 font-mono text-xs text-red-400">
                        {alerts.filter((a) => a.priority === "high").length} haute
                      </span>
                      <span className="rounded-full bg-[#f59e0b]/10 px-3 py-1 font-mono text-xs text-[#f59e0b]">
                        {alerts.filter((a) => a.priority === "medium").length} moyenne
                      </span>
                      <span className="rounded-full bg-white/[0.06] px-3 py-1 font-mono text-xs text-white/40">
                        {alerts.filter((a) => a.priority === "low").length} basse
                      </span>
                      {filtered.length !== alerts.length && (
                        <span className="text-xs text-white/20">
                          {filtered.length} sur {alerts.length} affich&eacute;es
                        </span>
                      )}
                    </div>

                    {/* Alerts */}
                    <div className="space-y-2">
                      {filtered
                        .sort((a, b) => {
                          const order = { high: 0, medium: 1, low: 2 };
                          return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
                        })
                        .map((alert, i) => {
                          const tc = typeConfig[alert.type] || typeConfig.trend;
                          const TypeIcon = tc.icon;
                          const pc = priorityConfig[alert.priority] || priorityConfig.low;

                          return (
                            <div
                              key={i}
                              className="rounded-xl border border-white/[0.08] bg-[#07090f] p-4 space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <TypeIcon className={`h-4 w-4 ${tc.color}`} />
                                  <h4 className="text-sm font-semibold text-white">
                                    {alert.title}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${tc.color} bg-white/[0.04]`}>
                                    {tc.label}
                                  </span>
                                  <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${pc.text} ${pc.bg}`}>
                                    {alert.priority}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-white/60 leading-relaxed">
                                {alert.description}
                              </p>
                              <p className="text-xs text-white/25">Source : {alert.source}</p>
                              <div className="flex flex-wrap gap-2">
                                {alert.opportunity && (
                                  <div className="flex items-start gap-1.5 rounded-lg bg-[#00d4aa]/5 border border-[#00d4aa]/10 px-2.5 py-1.5 text-xs text-[#00d4aa]">
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
                              {(alert.related_player || alert.related_brand) && (
                                <div className="flex items-center gap-2 text-[11px] text-white/25">
                                  {alert.related_player && (
                                    <span className="rounded bg-white/[0.04] px-1.5 py-0.5">
                                      Joueur : {alert.related_player}
                                    </span>
                                  )}
                                  {alert.related_brand && (
                                    <span className="rounded bg-white/[0.04] px-1.5 py-0.5">
                                      Marque : {alert.related_brand}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Failed state */}
                {isExpanded && run.status === "failed" && (
                  <div className="border-t border-white/[0.06] px-4 py-4">
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                      Cette veille a &eacute;chou&eacute;. Relancez-en une nouvelle.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RunStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    running: { bg: "bg-[#0088ff]/10", text: "text-[#0088ff]" },
    completed: { bg: "bg-[#00d4aa]/10", text: "text-[#00d4aa]" },
    failed: { bg: "bg-red-500/10", text: "text-red-400" },
  };
  const c = config[status] || config.running;
  return (
    <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] capitalize shrink-0 ${c.bg} ${c.text}`}>
      {status}
    </span>
  );
}
