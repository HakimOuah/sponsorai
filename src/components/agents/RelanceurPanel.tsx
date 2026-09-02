"use client";

import { useState, useCallback } from "react";
import Link from "@/components/layout/NavigationLink";
import { RefreshCw, Loader2, Newspaper, Mail, Clock, Zap } from "lucide-react";
import { AgentAvatar } from "@/components/agents/experience/AgentAvatar";
import { AgentExecutionCard } from "@/components/agents/experience/AgentExecutionCard";
import { useAgentExperience } from "@/components/agents/experience/AgentExperienceProvider";

interface NewsItem {
  headline: string;
  source: string;
  date: string;
  relevance: string;
  hook_potential: string;
}

interface RelanceurResult {
  news_found: NewsItem[];
  best_hook: string;
  email: { subject: string; body: string };
  timing_score: number;
  timing_rationale: string;
  emailId: string;
}

interface RelanceurPanelProps {
  prospects: {
    id: string;
    companyName: string;
    status: string;
  }[];
  defaultProspectId?: string;
}

export function RelanceurPanel({
  prospects,
  defaultProspectId,
}: RelanceurPanelProps) {
  const [selectedProspect, setSelectedProspect] = useState(
    defaultProspectId || "",
  );
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [missionDetail, setMissionDetail] = useState("");
  const [result, setResult] = useState<RelanceurResult | null>(null);
  const [error, setError] = useState("");
  const { startMission, updateMission, finishMission, failMission } =
    useAgentExperience();

  const launch = useCallback(async () => {
    if (!selectedProspect || isRunning) return;

    setIsRunning(true);
    setProgress(8);
    setMissionDetail("Relanceur relit le contexte du premier contact.");
    setResult(null);
    setError("");
    const prospect = prospects.find((item) => item.id === selectedProspect);
    const missionId = startMission({
      agentId: "relanceur",
      title: `Préparer une relance${prospect ? ` pour ${prospect.companyName}` : ""}`,
      detail: "Relanceur relit le contexte du premier contact.",
      progress: 8,
    });
    let semanticProgress = 8;
    let receivedTerminalEvent = false;

    try {
      const response = await fetch("/api/agents/relanceur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: selectedProspect }),
      });

      if (!response.ok || !response.body) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || "Erreur de connexion");
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
                semanticProgress = Math.min(88, semanticProgress + 14);
                const detail = relanceurDetail(String(data.message || ""));
                setProgress(semanticProgress);
                setMissionDetail(detail);
                updateMission(missionId, {
                  progress: semanticProgress,
                  detail,
                });
              } else if (data.type === "done") {
                receivedTerminalEvent = true;
                setResult(data.result);
                setProgress(100);
                setMissionDetail(
                  "La relance est prête en brouillon et attend votre validation.",
                );
                finishMission(
                  missionId,
                  "La relance est prête en brouillon et attend votre validation.",
                  {
                    status: "waiting",
                    nextAgentId: "dispatcher",
                    actionLabel: "Relire la relance",
                    actionHref: `/emails/${data.result.emailId}`,
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
        throw new Error(
          "La génération s’est interrompue avant la création du brouillon.",
        );
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
    prospects,
    selectedProspect,
    startMission,
    updateMission,
  ]);

  const timingColor =
    result && result.timing_score >= 7
      ? "text-[#FF6B3D]"
      : result && result.timing_score >= 4
        ? "text-[#f59e0b]"
        : "text-red-400";

  return (
    <div className="space-y-4">
      {/* Selector + Launch */}
      <div className="flex items-center gap-3">
        <select
          value={selectedProspect}
          onChange={(e) => setSelectedProspect(e.target.value)}
          disabled={isRunning}
          className="flex-1 rounded-2xl border border-white/[0.10] bg-white/[0.045] px-3 py-2.5 text-sm text-white focus:border-[#f59e0b]/50 focus:outline-none transition-colors disabled:opacity-50"
        >
          <option value="">Sélectionner un prospect contacté...</option>
          {prospects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.companyName} — {p.status}
            </option>
          ))}
        </select>

        <button
          onClick={launch}
          disabled={!selectedProspect || isRunning}
          className="flex items-center gap-2 rounded-lg bg-[#f59e0b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#f59e0b]/80 transition-colors disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Relance en cours...
            </>
          ) : (
            <>
              <AgentAvatar agentId="relanceur" size="sm" />
              Relancer
            </>
          )}
        </button>
      </div>

      {(isRunning || error) && (
        <AgentExecutionCard
          agentId="relanceur"
          title="Relance contextuelle en préparation"
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
          {/* Timing score */}
          <div className="flex items-center gap-3 app-soft-panel p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#f59e0b]" />
              <span className="text-sm text-white/50">Timing score</span>
            </div>
            <span className={`text-2xl font-bold font-mono ${timingColor}`}>
              {result.timing_score}/10
            </span>
            <span className="text-xs text-[#969BA8] flex-1">
              {result.timing_rationale}
            </span>
          </div>

          {/* News found */}
          <div className="app-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Newspaper className="h-4 w-4 text-[#C8CEFF]" />
              <h4 className="text-sm font-semibold text-white">
                Actualités trouvées ({result.news_found.length})
              </h4>
            </div>
            <div className="space-y-2">
              {result.news_found.map((news, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-white/[0.02] p-3 space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm text-white/80">
                      {news.headline}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] ${
                        news.relevance === "high"
                          ? "bg-[#FF6B3D]/10 text-[#FF6B3D]"
                          : "bg-[#C8CEFF]/10 text-[#C8CEFF]"
                      }`}
                    >
                      {news.relevance}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#969BA8]">
                    <span>{news.source}</span>
                    <span>·</span>
                    <span>{news.date}</span>
                  </div>
                  <p className="text-xs text-[#969BA8]">
                    {news.hook_potential}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Best hook */}
          <div className="flex items-start gap-2 rounded-lg border border-[#f59e0b]/20 bg-[#f59e0b]/5 p-3">
            <Zap className="h-4 w-4 text-[#f59e0b] mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#969BA8] mb-0.5">
                Accroche choisie
              </p>
              <p className="text-sm text-white/80">{result.best_hook}</p>
            </div>
          </div>

          {/* Generated email */}
          <div className="app-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="h-4 w-4 text-[#C8CEFF]" />
              <h4 className="text-sm font-semibold text-white">
                Email de relance généré
              </h4>
              <span className="rounded-full bg-[#C8CEFF]/10 px-2 py-0.5 font-mono text-[10px] text-[#C8CEFF]">
                brouillon
              </span>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#969BA8] mb-0.5">
                  Objet
                </p>
                <p className="text-sm text-white/80">{result.email.subject}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#969BA8] mb-0.5">
                  Corps
                </p>
                <p className="text-sm text-white/60 whitespace-pre-line leading-relaxed">
                  {result.email.body}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-[#969BA8]">
              <Mail className="h-3 w-3" />
              <span>
                Sauvegardé en brouillon — retrouvez-le dans la section Emails
              </span>
            </div>
            <Link
              href={`/emails/${result.emailId}`}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#FF6B3D] px-4 py-2 text-xs font-semibold text-[#0B0D12] transition hover:bg-[#FF865F]"
            >
              Relire avec Dispatcher
              <RefreshCw className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function relanceurDetail(message: string) {
  if (message.includes("actualité")) {
    return "Relanceur cherche un angle récent et crédible pour reprendre contact.";
  }
  if (message.includes("Accroche")) {
    return "Relanceur a sélectionné l’accroche la plus pertinente.";
  }
  if (message.includes("Timing")) {
    return "Relanceur vérifie que le moment est favorable avant de proposer le brouillon.";
  }
  if (message.includes("sauvegardé")) {
    return "Le brouillon est enregistré et prêt à être relu.";
  }
  return "Relanceur croise le contexte, le timing et l’actualité disponible.";
}
