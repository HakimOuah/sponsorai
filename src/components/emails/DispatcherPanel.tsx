"use client";

import { useState } from "react";
import { Send, Loader2, Check, AlertTriangle } from "lucide-react";
import { sendEmail } from "@/lib/actions/emails";
import { AgentAvatar } from "@/components/agents/experience/AgentAvatar";
import { useAgentExperience } from "@/components/agents/experience/AgentExperienceProvider";

const MAX_APPROVED_BATCH_SIZE = 30;

interface DispatcherPanelProps {
  draftEmails: {
    id: string;
    subject: string;
    prospect: { outreachApprovedAt: Date | null } | null;
    company: {
      name: string;
      outreachReady?: boolean | null;
    };
  }[];
}

export function DispatcherPanel({ draftEmails }: DispatcherPanelProps) {
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    sent: number;
    errors: number;
    noContact: number;
  } | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const { startMission, updateMission, finishMission, failMission } =
    useAgentExperience();

  const approved = draftEmails.filter(
    (email) =>
      email.company.outreachReady && email.prospect?.outreachApprovedAt,
  );
  const sendable = approved.slice(0, MAX_APPROVED_BATCH_SIZE);
  const deferred = Math.max(0, approved.length - sendable.length);
  const noContact = draftEmails.filter((e) => !e.company.outreachReady);
  const notQualified = draftEmails.filter(
    (email) =>
      email.company.outreachReady && !email.prospect?.outreachApprovedAt,
  );

  const handleSendAll = async () => {
    if (!confirmAll) {
      setConfirmAll(true);
      return;
    }

    setSending(true);
    setProgress(0);
    setConfirmAll(false);
    let sent = 0;
    let errors = 0;
    const missionId = startMission({
      agentId: "dispatcher",
      title: `${sendable.length} envoi${sendable.length > 1 ? "s" : ""} approuvé${sendable.length > 1 ? "s" : ""}`,
      detail: "Dispatcher envoie uniquement les messages validés.",
      progress: 4,
    });

    for (let i = 0; i < sendable.length; i++) {
      try {
        await sendEmail(sendable[i].id);
        sent++;
      } catch {
        errors++;
      }
      setProgress(i + 1);
      updateMission(missionId, {
        progress: ((i + 1) / sendable.length) * 100,
        detail: `${i + 1}/${sendable.length} message${sendable.length > 1 ? "s" : ""} traité${sendable.length > 1 ? "s" : ""}.`,
      });
    }

    setResults({
      sent,
      errors,
      noContact: noContact.length + notQualified.length,
    });
    setSending(false);
    if (sent === 0) {
      failMission(missionId, "Aucun message n’a pu être envoyé.");
    } else {
      finishMission(
        missionId,
        `${sent} message${sent > 1 ? "s" : ""} envoyé${sent > 1 ? "s" : ""}. Veilleur pourra analyser les réponses reçues.`,
        {
          status: "waiting",
          nextAgentId: "veilleur",
          actionLabel: "Suivre les réponses",
          actionHref: "/emails",
        },
      );
    }
  };

  if (draftEmails.length === 0) {
    return (
      <div className="app-panel p-6 text-center">
        <Send className="h-8 w-8 text-white/10 mx-auto mb-2" />
        <p className="text-sm text-[#969BA8]">Aucun brouillon à envoyer</p>
        <p className="text-xs text-[#969BA8]/55 mt-1">
          Générez des emails depuis la page Prospection
        </p>
      </div>
    );
  }

  return (
    <div className="app-panel space-y-4 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AgentAvatar
            agentId="dispatcher"
            size="sm"
            status={sending ? "active" : results ? "done" : undefined}
          />
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#FF8A66]">
              Agent Dispatcher
            </p>
            <h3 className="mt-0.5 text-sm font-semibold text-white">
              {draftEmails.length} brouillon{draftEmails.length > 1 ? "s" : ""}{" "}
              prêt{draftEmails.length > 1 ? "s" : ""}
            </h3>
            <p className="mt-0.5 text-xs text-[#969BA8]">
              {sendable.length} dans ce lot approuvé · {noContact.length} sans
              contact · {notQualified.length} à valider
            </p>
          </div>
          {deferred > 0 && (
            <p className="mt-1 text-[11px] text-[#f59e0b]">
              {deferred} brouillon{deferred > 1 ? "s" : ""} reporté
              {deferred > 1 ? "s" : ""} au lot suivant (limite pilote : 30).
            </p>
          )}
        </div>

        {!results && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {confirmAll && (
              <button
                onClick={() => setConfirmAll(false)}
                className="rounded-full px-3 py-2 text-xs text-[#969BA8] hover:bg-white/[0.05] hover:text-white/60"
              >
                Annuler
              </button>
            )}
            <button
              onClick={handleSendAll}
              disabled={sending || sendable.length === 0}
              className={`flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-40 sm:w-auto sm:py-2 ${
                confirmAll
                  ? "bg-[#f59e0b] text-[#0B0D12] hover:bg-[#f59e0b]/80"
                  : "bg-[#FF6B3D] text-[#0B0D12] hover:bg-[#FF865F]"
              }`}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {confirmAll
                ? `Confirmer l'envoi de ${sendable.length} email${sendable.length > 1 ? "s" : ""}`
                : `Envoyer tout (${sendable.length})`}
            </button>
          </div>
        )}
      </div>

      {/* Progress */}
      {sending && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#969BA8]">
            <Loader2 className="h-3 w-3 animate-spin" />
            Envoi en cours… {progress}/{sendable.length}
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-[#FF6B3D] transition-all"
              style={{ width: `${(progress / sendable.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-[#FF6B3D]" />
            <span className="text-sm text-[#FF6B3D]">
              {results.sent} email{results.sent > 1 ? "s" : ""} envoyé
              {results.sent > 1 ? "s" : ""}
            </span>
            {results.errors > 0 && (
              <span className="text-sm text-red-400">
                · {results.errors} erreur{results.errors > 1 ? "s" : ""}
              </span>
            )}
          </div>
          {results.noContact > 0 && (
            <div className="flex items-center gap-2 text-xs text-[#f59e0b]">
              <AlertTriangle className="h-3 w-3" />
              {results.noContact} entreprise{results.noContact > 1 ? "s" : ""}{" "}
              sans contact envoyable — utilisez l&apos;Enrichisseur
            </div>
          )}
        </div>
      )}

      {notQualified.length > 0 && !results && (
        <div className="flex items-start gap-2 rounded-lg border border-[#f59e0b]/20 bg-[#f59e0b]/5 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#f59e0b]" />
          <div className="text-xs text-[#f59e0b]">
            <p className="font-medium">
              {notQualified.length} brouillon
              {notQualified.length > 1 ? "s" : ""} avec email non qualifié :
            </p>
            <p className="mt-0.5 text-[#f59e0b]/70">
              {notQualified.map((e) => e.company.name).join(", ")}
            </p>
            <p className="mt-1 text-[#f59e0b]/50">
              L&apos;envoi est bloqué tant que le représentant n&apos;a pas
              validé le premier outreach.
            </p>
          </div>
        </div>
      )}

      {/* No-contact warning */}
      {noContact.length > 0 && !results && (
        <div className="flex items-start gap-2 rounded-lg border border-[#f59e0b]/20 bg-[#f59e0b]/5 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-[#f59e0b] mt-0.5 shrink-0" />
          <div className="text-xs text-[#f59e0b]">
            <p className="font-medium">
              {noContact.length} brouillon{noContact.length > 1 ? "s" : ""} sans
              email de contact :
            </p>
            <p className="text-[#f59e0b]/70 mt-0.5">
              {noContact.map((e) => e.company.name).join(", ")}
            </p>
            <p className="mt-1 text-[#f59e0b]/50">
              Enrichissez ces entreprises d&apos;abord pour trouver les
              contacts.
            </p>
          </div>
        </div>
      )}

      {/* Draft list preview */}
      <div className="max-h-48 overflow-y-auto divide-y divide-white/[0.04] rounded-lg border border-[#FF6B3D]/10">
        {draftEmails.map((email) => (
          <div
            key={email.id}
            className="flex items-center gap-3 px-3 py-2 text-xs"
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${email.company.outreachReady && email.prospect?.outreachApprovedAt ? "bg-[#FF6B3D]" : email.company.outreachReady ? "bg-[#f59e0b]" : "bg-white/10"}`}
            />
            <span className="text-white/60 truncate flex-1">
              {email.subject}
            </span>
            <span className="hidden shrink-0 text-[#969BA8] sm:inline">
              {email.company.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
