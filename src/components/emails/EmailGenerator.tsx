"use client";

import { useState } from "react";
import { PenTool, Loader2, Check, Mail, ArrowRight, Languages } from "lucide-react";
import { AgentAvatar } from "@/components/agents/experience/AgentAvatar";
import { useAgentExperience } from "@/components/agents/experience/AgentExperienceProvider";
import {
  OUTREACH_LANGUAGES,
  suggestOutreachLanguage,
  type OutreachLanguage,
} from "@/lib/agents/outreach-language";

interface EmailGeneratorProps {
  prospectId: string;
  companyName: string;
  companyCountry?: string | null;
  onGenerated?: (email: { id: string; subject: string; body: string }) => void;
}

const EMAIL_TYPES = [
  { value: "first_contact", label: "1er contact" },
  { value: "followup_1", label: "Relance J+4" },
  { value: "followup_2", label: "Relance J+10" },
];

export function EmailGenerator({
  prospectId,
  companyName,
  companyCountry,
  onGenerated,
}: EmailGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [emailType, setEmailType] = useState("first_contact");
  const [language, setLanguage] = useState<OutreachLanguage>(
    () => suggestOutreachLanguage(companyCountry).language,
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    id: string;
    subject: string;
    body: string;
  } | null>(null);
  const [error, setError] = useState("");
  const { startMission, finishMission, failMission } = useAgentExperience();

  const generate = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    const missionId = startMission({
      agentId: "redacteur",
      title: `Email pour ${companyName}`,
      detail: "Rédacteur adapte l’angle, le destinataire et la langue.",
    });

    try {
      const res = await fetch("/api/agents/redacteur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId, emailType, language }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Erreur lors de la génération");
      }

      const data = await res.json();
      setResult(data.email);
      onGenerated?.(data.email);
      finishMission(
        missionId,
        `Le brouillon pour ${companyName} est prêt. Relisez-le avant de demander à Dispatcher de l’envoyer.`,
        {
          status: "waiting",
          nextAgentId: "dispatcher",
          actionLabel: "Relire le brouillon",
          actionHref: `/emails/${data.email.id}`,
        },
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de générer l'email. Réessayez.";
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
        className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[#C8CEFF]/20 bg-[#C8CEFF]/5 px-3 py-2 text-xs text-[#C8CEFF] transition-colors hover:bg-[#C8CEFF]/10 sm:w-auto sm:py-1.5"
      >
        <AgentAvatar agentId="redacteur" size="sm" />
        Demander à Rédacteur
      </button>
    );
  }

  return (
    <div className="app-panel p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <AgentAvatar
            agentId="redacteur"
            size="sm"
            status={loading ? "active" : result ? "done" : undefined}
          />
          <h3 className="truncate text-sm font-semibold text-white">
            Agent Rédacteur — {companyName}
          </h3>
        </div>
        <button
          onClick={() => {
            setIsOpen(false);
            setResult(null);
            setError("");
          }}
          className="text-xs text-[#969BA8] hover:text-white/60 transition-colors"
        >
          Fermer
        </button>
      </div>

      {/* Type selector */}
      {!result && (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <Languages className="mt-0.5 h-3.5 w-3.5 text-[#C8CEFF]" />
              <div>
                <p className="text-xs text-white/65">Langue du message</p>
                <p className="text-[10px] text-[#969BA8]">
                  Suggestion modifiable avant génération
                </p>
              </div>
            </div>
            <select
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value as OutreachLanguage)
              }
              className="rounded-xl border border-white/[0.09] bg-[#0B0D12] px-3 py-2 text-xs text-white"
            >
              {OUTREACH_LANGUAGES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {EMAIL_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setEmailType(t.value)}
                className={`shrink-0 rounded-full px-3 py-2 text-xs font-medium transition-colors sm:py-1.5 ${
                  emailType === t.value
                    ? "bg-[#C8CEFF]/15 text-[#C8CEFF] border border-[#C8CEFF]/30"
                    : "bg-white/[0.06] text-[#969BA8] border border-[#FF6B3D]/10 hover:bg-white/[0.06]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#C8CEFF] px-4 py-2 text-sm font-semibold text-[#0B0D12] hover:bg-[#FF6B3D] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Génération en cours…
              </>
            ) : (
              <>
                <PenTool className="h-4 w-4" />
                Générer
              </>
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {/* Result */}
      {result && (
        <div className="space-y-3">
          <div className="rounded-lg border border-[#FF6B3D]/20 bg-[#FF6B3D]/5 px-3 py-2 text-xs text-[#FF6B3D] flex items-center gap-2">
            <Check className="h-3.5 w-3.5" />
            Email généré et sauvegardé en brouillon
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#969BA8] mb-1">
              Objet
            </p>
            <p className="text-sm text-white/80">{result.subject}</p>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#969BA8] mb-1">
              Corps
            </p>
            <div className="rounded-lg bg-white/[0.045] p-3 text-sm text-white/70 whitespace-pre-wrap leading-relaxed">
              {result.body}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={`/emails/${result.id}`}
              className="flex items-center justify-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-2 text-xs text-white/50 transition-colors hover:bg-white/[0.1] sm:py-1.5"
            >
              <Mail className="h-3 w-3" />
              Relire puis passer à Dispatcher
              <ArrowRight className="h-3 w-3" />
            </a>
            <button
              onClick={() => {
                setResult(null);
                setError("");
              }}
              className="rounded-full bg-white/[0.06] px-3 py-2 text-xs text-white/50 transition-colors hover:bg-white/[0.1] sm:py-1.5"
            >
              Générer un autre
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
