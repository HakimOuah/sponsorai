"use client";

import { useState, useCallback } from "react";
import {
  Radar,
  Loader2,
  AlertTriangle,
  TrendingUp,
  ArrowRightLeft,
  LogIn,
  LogOut,
  Clock,
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

interface VeilleResult {
  alerts: VeilleAlert[];
  market_summary: string;
}

interface LogEntry {
  message: string;
  type: string;
  timestamp: number;
}

export function VeillePanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<VeilleResult | null>(null);
  const [error, setError] = useState("");

  const launch = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);
    setLogs([]);
    setResult(null);
    setError("");

    const startTime = Date.now();

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
                setLogs((prev) => [
                  ...prev,
                  {
                    message: data.message,
                    type: data.logType || "info",
                    timestamp: Date.now() - startTime,
                  },
                ]);
              } else if (data.type === "done") {
                setResult(data.result);
              } else if (data.type === "error") {
                setError(data.message);
              }
            } catch {
              // Skip malformed
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsRunning(false);
    }
  }, [isRunning]);

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

  return (
    <div className="space-y-4">
      {/* Launch */}
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
              Lancer la veille concurrentielle
            </>
          )}
        </button>
        {!isRunning && !result && (
          <span className="text-xs text-white/30">
            Scanne l&apos;actualité sponsoring football et identifie les opportunités
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
              <span>En cours…</span>
            </div>
          )}
        </div>
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
          <div className="rounded-lg border border-[#a855f7]/20 bg-[#a855f7]/5 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/30 mb-1">
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
              {result.alerts.filter((a) => a.priority === "medium").length} moyenne
            </span>
            <span className="rounded-full bg-white/[0.06] px-3 py-1 font-mono text-xs text-white/40">
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
                  <div
                    key={i}
                    className="rounded-xl border border-white/[0.08] bg-[#0c1019] p-4 space-y-2"
                  >
                    {/* Header */}
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

                    {/* Description */}
                    <p className="text-sm text-white/60 leading-relaxed">
                      {alert.description}
                    </p>

                    {/* Source */}
                    <p className="text-xs text-white/25">Source : {alert.source}</p>

                    {/* Opportunity / Threat */}
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

                    {/* Related */}
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

          {/* Note */}
          <p className="text-xs text-white/20">
            Les alertes de priorité haute sont automatiquement enregistrées dans le journal d&apos;activité.
          </p>
        </div>
      )}
    </div>
  );
}
