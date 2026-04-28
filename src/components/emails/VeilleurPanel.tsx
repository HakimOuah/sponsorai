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

  const analyze = async () => {
    if (!replyContent.trim()) return;

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const res = await fetch("/api/agents/veilleur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId, replyContent }),
      });

      if (!res.ok) throw new Error("Erreur d'analyse");

      const data = await res.json();
      setAnalysis(data.analysis);
    } catch {
      setError("Impossible d'analyser la réponse. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-[#DDFBEA]/20 bg-[#DDFBEA]/5 px-3 py-2 text-sm text-[#DDFBEA] hover:bg-[#DDFBEA]/10 transition-colors"
      >
        <Eye className="h-4 w-4" />
        Analyser une réponse
      </button>
    );
  }

  const sentimentConfig = {
    positive: { icon: ThumbsUp, color: "text-[#3EF2A0]", bg: "bg-[#3EF2A0]/10 border-[#3EF2A0]/20", label: "Positif" },
    neutral: { icon: Minus, color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10 border-[#f59e0b]/20", label: "Neutre" },
    negative: { icon: ThumbsDown, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", label: "Négatif" },
    question: { icon: HelpCircle, color: "text-[#DDFBEA]", bg: "bg-[#DDFBEA]/10 border-[#DDFBEA]/20", label: "Question" },
  };

  const urgencyConfig = {
    high: { color: "text-red-400", label: "Haute" },
    medium: { color: "text-[#f59e0b]", label: "Moyenne" },
    low: { color: "text-[#8FA69E]", label: "Basse" },
  };

  return (
    <div className="app-panel p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-[#DDFBEA]" />
          <h3 className="text-sm font-semibold text-white">
            Veilleur — {companyName}
          </h3>
        </div>
        <button
          onClick={() => { setIsOpen(false); setAnalysis(null); setError(""); }}
          className="text-xs text-[#8FA69E] hover:text-white/60"
        >
          Fermer
        </button>
      </div>

      {/* Input */}
      {!analysis && (
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-[#8FA69E] mb-1 block">
              Collez la réponse reçue
            </label>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={6}
              placeholder="Bonjour, merci pour votre proposition. Nous serions effectivement intéressés pour discuter..."
              className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.045] px-4 py-3 text-sm text-white/80 placeholder-white/20 focus:border-[#DDFBEA]/30 focus:outline-none leading-relaxed resize-y"
            />
          </div>

          <button
            onClick={analyze}
            disabled={loading || !replyContent.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-[#DDFBEA] px-4 py-2 text-sm font-semibold text-[#020403] hover:bg-[#DDFBEA]/80 transition-colors disabled:opacity-40"
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
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Results */}
      {analysis && (() => {
        const sc = sentimentConfig[analysis.sentiment];
        const SentimentIcon = sc.icon;
        const uc = urgencyConfig[analysis.urgency];

        return (
          <div className="space-y-3">
            {/* Sentiment banner */}
            <div className={`flex items-center gap-3 rounded-lg border p-3 ${sc.bg}`}>
              <SentimentIcon className={`h-5 w-5 ${sc.color}`} />
              <div>
                <span className={`text-sm font-semibold ${sc.color}`}>{sc.label}</span>
                <span className="text-xs text-[#8FA69E] ml-2">— {analysis.category}</span>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <Clock className={`h-3 w-3 ${uc.color}`} />
                <span className={`text-xs font-mono ${uc.color}`}>
                  Urgence {uc.label.toLowerCase()}
                </span>
              </div>
            </div>

            {/* Summary */}
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#8FA69E] mb-1">
                Résumé
              </p>
              <p className="text-sm text-white/70">{analysis.summary}</p>
            </div>

            {/* Next action */}
            <div className="flex items-start gap-2 rounded-lg bg-white/[0.045] p-3">
              <ArrowRight className="h-4 w-4 text-[#3EF2A0] mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#8FA69E] mb-0.5">
                  Action recommandée
                </p>
                <p className="text-sm text-white/80">{analysis.next_action}</p>
              </div>
            </div>

            {/* Key info */}
            {analysis.key_info && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-[#f59e0b] mt-0.5 shrink-0" />
                <p className="text-xs text-[#f59e0b]">{analysis.key_info}</p>
              </div>
            )}

            {/* Stage suggestion */}
            <div className="flex items-center gap-2 text-xs text-[#8FA69E]">
              <span>Stage suggéré :</span>
              <span className="rounded bg-white/[0.06] px-2 py-0.5 font-mono text-white/50">
                {analysis.suggested_stage}
              </span>
              <span className="text-white/15">— prospect et deal mis à jour automatiquement</span>
            </div>

            {/* Reset */}
            <button
              onClick={() => { setAnalysis(null); setReplyContent(""); }}
              className="text-xs text-[#8FA69E] hover:text-white/60"
            >
              Analyser une autre réponse
            </button>
          </div>
        );
      })()}
    </div>
  );
}
