"use client";

import { useState } from "react";
import { Send, Loader2, Check, AlertTriangle } from "lucide-react";
import { sendEmail } from "@/lib/actions/emails";

interface DispatcherPanelProps {
  draftEmails: {
    id: string;
    subject: string;
    company: { name: string; contactEmail: string | null };
  }[];
}

export function DispatcherPanel({ draftEmails }: DispatcherPanelProps) {
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ sent: number; errors: number; noContact: number } | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  const sendable = draftEmails.filter((e) => e.company.contactEmail);
  const noContact = draftEmails.filter((e) => !e.company.contactEmail);

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

    for (let i = 0; i < sendable.length; i++) {
      try {
        await sendEmail(sendable[i].id);
        sent++;
      } catch {
        errors++;
      }
      setProgress(i + 1);
    }

    setResults({ sent, errors, noContact: noContact.length });
    setSending(false);
  };

  if (draftEmails.length === 0) {
    return (
      <div className="app-panel p-6 text-center">
        <Send className="h-8 w-8 text-white/10 mx-auto mb-2" />
        <p className="text-sm text-[#8FA69E]">Aucun brouillon à envoyer</p>
        <p className="text-xs text-[#8FA69E]/55 mt-1">
          Générez des emails depuis la page Prospection
        </p>
      </div>
    );
  }

  return (
    <div className="app-panel p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            {draftEmails.length} brouillon{draftEmails.length > 1 ? "s" : ""} prêt{draftEmails.length > 1 ? "s" : ""}
          </h3>
          <p className="text-xs text-[#8FA69E] mt-0.5">
            {sendable.length} avec contact email · {noContact.length} sans contact
          </p>
        </div>

        {!results && (
          <div className="flex items-center gap-2">
            {confirmAll && (
              <button
                onClick={() => setConfirmAll(false)}
                className="text-xs text-[#8FA69E] hover:text-white/60"
              >
                Annuler
              </button>
            )}
            <button
              onClick={handleSendAll}
              disabled={sending || sendable.length === 0}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40 ${
                confirmAll
                  ? "bg-[#f59e0b] text-[#020403] hover:bg-[#f59e0b]/80"
                  : "bg-[#3EF2A0] text-[#020403] hover:bg-[#2CFF93]"
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
          <div className="flex items-center gap-2 text-xs text-[#8FA69E]">
            <Loader2 className="h-3 w-3 animate-spin" />
            Envoi en cours… {progress}/{sendable.length}
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-[#3EF2A0] transition-all"
              style={{ width: `${(progress / sendable.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-[#3EF2A0]" />
            <span className="text-sm text-[#3EF2A0]">
              {results.sent} email{results.sent > 1 ? "s" : ""} envoyé{results.sent > 1 ? "s" : ""}
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
              {results.noContact} entreprise{results.noContact > 1 ? "s" : ""} sans email de contact — utilisez l&apos;Enrichisseur
            </div>
          )}
        </div>
      )}

      {/* No-contact warning */}
      {noContact.length > 0 && !results && (
        <div className="flex items-start gap-2 rounded-lg border border-[#f59e0b]/20 bg-[#f59e0b]/5 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-[#f59e0b] mt-0.5 shrink-0" />
          <div className="text-xs text-[#f59e0b]">
            <p className="font-medium">{noContact.length} brouillon{noContact.length > 1 ? "s" : ""} sans email de contact :</p>
            <p className="text-[#f59e0b]/70 mt-0.5">
              {noContact.map((e) => e.company.name).join(", ")}
            </p>
            <p className="mt-1 text-[#f59e0b]/50">
              Enrichissez ces entreprises d&apos;abord pour trouver les contacts.
            </p>
          </div>
        </div>
      )}

      {/* Draft list preview */}
      <div className="max-h-48 overflow-y-auto divide-y divide-white/[0.04] rounded-lg border border-[#3EF2A0]/10">
        {draftEmails.map((email) => (
          <div key={email.id} className="flex items-center gap-3 px-3 py-2 text-xs">
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${email.company.contactEmail ? "bg-[#3EF2A0]" : "bg-white/10"}`} />
            <span className="text-white/60 truncate flex-1">{email.subject}</span>
            <span className="text-[#8FA69E] shrink-0">{email.company.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
