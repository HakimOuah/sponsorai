"use client";

import { useState } from "react";
import { PenTool, Loader2, Check, Mail } from "lucide-react";

interface EmailGeneratorProps {
  prospectId: string;
  companyName: string;
  onGenerated?: (email: { id: string; subject: string; body: string }) => void;
}

const EMAIL_TYPES = [
  { value: "first_contact", label: "1er contact" },
  { value: "followup_1", label: "Relance J+4" },
  { value: "followup_2", label: "Relance J+10" },
];

export function EmailGenerator({ prospectId, companyName, onGenerated }: EmailGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [emailType, setEmailType] = useState("first_contact");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id: string; subject: string; body: string } | null>(null);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/agents/redacteur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId, emailType }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la génération");
      }

      const data = await res.json();
      setResult(data.email);
      onGenerated?.(data.email);
    } catch {
      setError("Impossible de générer l'email. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-[#DDFBEA]/20 bg-[#DDFBEA]/5 px-2.5 py-1.5 text-xs text-[#DDFBEA] hover:bg-[#DDFBEA]/10 transition-colors"
      >
        <PenTool className="h-3 w-3" />
        Générer email
      </button>
    );
  }

  return (
    <div className="app-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PenTool className="h-4 w-4 text-[#DDFBEA]" />
          <h3 className="text-sm font-semibold text-white">
            Agent Rédacteur — {companyName}
          </h3>
        </div>
        <button
          onClick={() => {
            setIsOpen(false);
            setResult(null);
            setError("");
          }}
          className="text-xs text-[#8FA69E] hover:text-white/60 transition-colors"
        >
          Fermer
        </button>
      </div>

      {/* Type selector */}
      {!result && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {EMAIL_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setEmailType(t.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  emailType === t.value
                    ? "bg-[#DDFBEA]/15 text-[#DDFBEA] border border-[#DDFBEA]/30"
                    : "bg-white/[0.06] text-[#8FA69E] border border-[#3EF2A0]/10 hover:bg-white/[0.06]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#DDFBEA] px-4 py-2 text-sm font-semibold text-[#020403] hover:bg-[#F8FAF7] transition-colors disabled:opacity-50"
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
      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3">
          <div className="rounded-lg border border-[#3EF2A0]/20 bg-[#3EF2A0]/5 px-3 py-2 text-xs text-[#3EF2A0] flex items-center gap-2">
            <Check className="h-3.5 w-3.5" />
            Email généré et sauvegardé en brouillon
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#8FA69E] mb-1">
              Objet
            </p>
            <p className="text-sm text-white/80">{result.subject}</p>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#8FA69E] mb-1">
              Corps
            </p>
            <div className="rounded-lg bg-white/[0.045] p-3 text-sm text-white/70 whitespace-pre-wrap leading-relaxed">
              {result.body}
            </div>
          </div>

          <div className="flex gap-2">
            <a
              href={`/emails`}
              className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs text-white/50 hover:bg-white/[0.1] transition-colors"
            >
              <Mail className="h-3 w-3" />
              Voir dans Emails
            </a>
            <button
              onClick={() => {
                setResult(null);
                setError("");
              }}
              className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs text-white/50 hover:bg-white/[0.1] transition-colors"
            >
              Générer un autre
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
