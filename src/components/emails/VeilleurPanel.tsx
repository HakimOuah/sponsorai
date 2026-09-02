"use client";

import { useState } from "react";
import {
  Eye,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Minus,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
} from "lucide-react";
import Link from "@/components/layout/NavigationLink";
import { AgentAvatar } from "@/components/agents/experience/AgentAvatar";
import { AgentExecutionCard } from "@/components/agents/experience/AgentExecutionCard";
import { useAgentExperience } from "@/components/agents/experience/AgentExperienceProvider";

interface ReplyAnalysis {
  sentiment: "positive" | "neutral" | "negative" | "question";
  category: string;
  summary: string;
  next_action: string;
  urgency: "high" | "medium" | "low";
  key_info: string | null;
  suggested_stage: string;
}

interface VeilleurPanelProps {
  emailId: string;
  companyName: string;
}

export function VeilleurPanel({ emailId, companyName }: VeilleurPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ReplyAnalysis | null>(null);
  const [error, setError] = useState("");
  const { startMission, updateMission, finishMission, failMission } =
    useAgentExperience();

  const analyze = async () => {
    if (!replyContent.trim()) return;

    setLoading(true);
    setError("");
    setAnalysis(null);
    const missionId = startMission({
      agentId: "veilleur",
      title: `Comprendre la réponse de ${companyName}`,
      detail: "Veilleur identifie l’intention, l’urgence et la prochaine action.",
      progress: 12,
    });

    try {
      updateMission(missionId, {
        progress: 46,
        detail: "Veilleur classe la réponse et repère les informations clés.",
      });
      const res = await fetch("/api/agents/veilleur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId, replyContent }),
      });

      if (!res.ok) throw new Error("Erreur d'analyse");

      const data = await res.json();
      setAnalysis(data.analysis);
      const nextStep = getVeilleurHandoff(data.analysis);
      finishMission(
        missionId,
        `${data.analysis.summary} Prochaine étape : ${data.analysis.next_action}`,
        {
          status: "waiting",
          nextAgentId: nextStep.nextAgentId,
          actionLabel: nextStep.label,
          actionHref: nextStep.href,
        },
      );
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Impossible d’analyser la réponse. Réessayez.";
      setError(message);
      failMission(missionId, message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[#C8CEFF]/20 bg-[#C8CEFF]/5 px-3 py-2.5 text-sm text-[#C8CEFF] transition-colors hover:bg-[#C8CEFF]/10 sm:w-auto sm:py-2"
      >
        <AgentAvatar agentId="veilleur" size="sm" />
        Analyser une réponse
      </button>
    );
  }

  const sentimentConfig = {
    positive: {
      icon: ThumbsUp,
      color: "text-[#FF6B3D]",
      bg: "bg-[#FF6B3D]/10 border-[#FF6B3D]/20",
      label: "Positif",
    },
    neutral: {
      icon: Minus,
      color: "text-[#f59e0b]",
      bg: "bg-[#f59e0b]/10 border-[#f59e0b]/20",
      label: "Neutre",
    },
    negative: {
      icon: ThumbsDown,
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
      label: "Négatif",
    },
    question: {
      icon: HelpCircle,
      color: "text-[#C8CEFF]",
      bg: "bg-[#C8CEFF]/10 border-[#C8CEFF]/20",
      label: "Question",
    },
  };

  const urgencyConfig = {
    high: { color: "text-red-400", label: "Haute" },
    medium: { color: "text-[#f59e0b]", label: "Moyenne" },
    low: { color: "text-[#969BA8]", label: "Basse" },
  };

  return (
    <div className="app-panel space-y-4 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Eye className="h-4 w-4 text-[#C8CEFF]" />
          <h3 className="truncate text-sm font-semibold text-white">
            Veilleur — {companyName}
          </h3>
        </div>
        <button
          onClick={() => {
            setIsOpen(false);
            setAnalysis(null);
            setError("");
          }}
          className="text-xs text-[#969BA8] hover:text-white/60"
        >
          Fermer
        </button>
      </div>

      {/* Input */}
      {!analysis && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <AgentAvatar
              agentId="veilleur"
              size="md"
              status={loading ? "active" : undefined}
            />
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#C8CEFF]">
                Agent Veilleur
              </p>
              <p className="mt-1 text-xs text-[#969BA8]">
                Je transforme chaque réponse en décision claire pour la suite.
              </p>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-[#969BA8] mb-1 block">
              Collez la réponse reçue
            </label>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={6}
              placeholder="Bonjour, merci pour votre proposition. Nous serions effectivement intéressés pour discuter..."
              className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.045] px-4 py-3 text-sm text-white/80 placeholder-white/20 focus:border-[#C8CEFF]/30 focus:outline-none leading-relaxed resize-y"
            />
          </div>

          <button
            onClick={analyze}
            disabled={loading || !replyContent.trim()}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#C8CEFF] px-4 py-2.5 text-sm font-semibold text-[#0B0D12] transition-colors hover:bg-[#C8CEFF]/80 disabled:opacity-40 sm:w-auto sm:py-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyse en cours…
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Analyser
              </>
            )}
          </button>
          {loading && (
            <AgentExecutionCard
              agentId="veilleur"
              title={`Analyse de la réponse de ${companyName}`}
              detail="Je distingue le sentiment, l’urgence et l’action commerciale la plus pertinente."
              status="running"
              progress={58}
            />
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Results */}
      {analysis &&
        (() => {
          const sc = sentimentConfig[analysis.sentiment];
          const SentimentIcon = sc.icon;
          const uc = urgencyConfig[analysis.urgency];
          const handoff = getVeilleurHandoff(analysis);

          return (
            <div className="space-y-3">
              {/* Sentiment banner */}
              <div
                className={`flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-3 ${sc.bg}`}
              >
                <SentimentIcon className={`h-5 w-5 ${sc.color}`} />
                <div>
                  <span className={`text-sm font-semibold ${sc.color}`}>
                    {sc.label}
                  </span>
                  <span className="text-xs text-[#969BA8] ml-2">
                    — {analysis.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:ml-auto">
                  <Clock className={`h-3 w-3 ${uc.color}`} />
                  <span className={`text-xs font-mono ${uc.color}`}>
                    Urgence {uc.label.toLowerCase()}
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#969BA8] mb-1">
                  Résumé
                </p>
                <p className="text-sm text-white/70">{analysis.summary}</p>
              </div>

              {/* Next action */}
              <div className="flex items-start gap-2 rounded-lg bg-white/[0.045] p-3">
                <ArrowRight className="h-4 w-4 text-[#FF6B3D] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[#969BA8] mb-0.5">
                    Action recommandée
                  </p>
                  <p className="text-sm text-white/80">
                    {analysis.next_action}
                  </p>
                </div>
              </div>

              <Link
                href={handoff.href}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-[#C8CEFF]/20 bg-[#C8CEFF]/[0.06] p-3 transition hover:bg-[#C8CEFF]/10"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <AgentAvatar
                    agentId={handoff.nextAgentId}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#C8CEFF]">
                      Étape recommandée
                    </p>
                    <p className="mt-0.5 text-sm text-white/75">
                      {handoff.guide}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#C8CEFF] transition-transform group-hover:translate-x-1" />
              </Link>

              {/* Key info */}
              {analysis.key_info && (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-[#f59e0b] mt-0.5 shrink-0" />
                  <p className="text-xs text-[#f59e0b]">{analysis.key_info}</p>
                </div>
              )}

              {/* Stage suggestion */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#969BA8]">
                <span>Stage suggéré :</span>
                <span className="rounded bg-white/[0.06] px-2 py-0.5 font-mono text-white/50">
                  {analysis.suggested_stage}
                </span>
                <span className="text-white/15">
                  — prospect et deal mis à jour automatiquement
                </span>
              </div>

              {/* Reset */}
              <button
                onClick={() => {
                  setAnalysis(null);
                  setReplyContent("");
                }}
                className="text-xs text-[#969BA8] hover:text-white/60"
              >
                Analyser une autre réponse
              </button>
            </div>
          );
        })()}
    </div>
  );
}

function getVeilleurHandoff(analysis: ReplyAnalysis) {
  if (
    analysis.sentiment === "positive" ||
    analysis.category === "meeting_request"
  ) {
    return {
      nextAgentId: "matchmaker" as const,
      label: "Faire avancer le deal",
      href: "/pipeline",
      guide: "La réponse est favorable : ouvrez le pipeline et préparez l’étape commerciale.",
    };
  }
  if (analysis.sentiment === "question") {
    return {
      nextAgentId: "redacteur" as const,
      label: "Préparer la réponse",
      href: "/emails",
      guide: "La marque attend une précision : passez la main au Rédacteur.",
    };
  }
  return {
    nextAgentId: "relanceur" as const,
    label: "Planifier la suite",
    href: "/emails",
    guide: "Veilleur a clarifié le signal : consultez la recommandation avant toute relance.",
  };
}
