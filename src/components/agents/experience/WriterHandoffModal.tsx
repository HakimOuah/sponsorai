"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Languages,
  LoaderCircle,
  Mail,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  OUTREACH_LANGUAGES,
  suggestOutreachLanguage,
  type OutreachLanguage,
} from "@/lib/agents/outreach-language";
import { AgentAvatar } from "./AgentAvatar";
import { AgentExecutionCard } from "./AgentExecutionCard";
import { useAgentExperience } from "./AgentExperienceProvider";

interface HandoffContact {
  id: string;
  role: string;
  currentRoleVerified: boolean;
  contactability: "verified" | "public_source" | "guessed" | "missing";
  score: number | null;
}

interface HandoffProspect {
  id: string;
  athleteName: string;
  club: string;
}

export function WriterHandoffModal({
  open,
  onClose,
  companyName,
  companyCountry,
  contacts,
  prospects,
  initialContactId,
}: {
  open: boolean;
  onClose: () => void;
  companyName: string;
  companyCountry?: string | null;
  contacts: HandoffContact[];
  prospects: HandoffProspect[];
  initialContactId?: string;
}) {
  const draftableContacts = useMemo(
    () => contacts.filter((contact) => contact.currentRoleVerified),
    [contacts],
  );
  const suggestion = useMemo(
    () => suggestOutreachLanguage(companyCountry),
    [companyCountry],
  );
  const [prospectId, setProspectId] = useState(prospects[0]?.id || "");
  const [contactId, setContactId] = useState(
    draftableContacts.some((contact) => contact.id === initialContactId)
      ? initialContactId || ""
      : draftableContacts[0]?.id || "",
  );
  const [language, setLanguage] = useState<OutreachLanguage>(
    suggestion.language,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    id: string;
    subject: string;
    body: string;
    language: OutreachLanguage;
  } | null>(null);
  const { startMission, finishMission, failMission } = useAgentExperience();

  if (!open || typeof document === "undefined") return null;

  const selectedProspect = prospects.find(
    (prospect) => prospect.id === prospectId,
  );
  const selectedContact = draftableContacts.find(
    (contact) => contact.id === contactId,
  );
  const selectedContactHasUsableEmail = selectedContact
    ? ["verified", "public_source"].includes(selectedContact.contactability)
    : false;

  const generate = async () => {
    if (!prospectId || !contactId || loading) return;
    setLoading(true);
    setError("");
    setResult(null);

    const missionId = startMission({
      agentId: "redacteur",
      title: `Email pour ${companyName}`,
      detail: `Rédacteur prépare une approche en ${OUTREACH_LANGUAGES.find((item) => item.value === language)?.label.toLowerCase() || language}.`,
    });

    try {
      const response = await fetch("/api/agents/redacteur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId,
          contactId,
          language,
          emailType: "first_contact",
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Impossible de générer le brouillon");
      }

      setResult(data.email);
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
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Erreur inconnue";
      setError(message);
      failMission(missionId, message);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-[#050609]/82 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="writer-handoff-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Fermer le passage de relais"
      />
      <div className="relative z-10 max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-white/[0.10] bg-[#080A0F] p-3 shadow-[0_30px_110px_rgba(0,0,0,0.68)] sm:p-5">
        <div className="flex items-start justify-between gap-4 px-1 pb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#969BA8]">
              Passage de relais
            </p>
            <h2
              id="writer-handoff-title"
              className="mt-1 text-xl font-semibold tracking-[-0.03em] text-white"
            >
              Enrichisseur transmet le dossier à Rédacteur
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-white/45 hover:bg-white/[0.05] hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex items-center justify-center gap-3 rounded-3xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
          <AgentAvatar agentId="enrichisseur" size="md" status="done" />
          <div className="min-w-0 flex-1">
            <div className="h-px bg-gradient-to-r from-[#F59E0B] via-[#FF6B3D] to-[#C8CEFF]" />
            <p className="mt-1 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
              Contexte transmis
            </p>
          </div>
          <AgentAvatar
            agentId="redacteur"
            size="md"
            status={loading ? "active" : result ? "done" : undefined}
          />
        </div>

        {loading || result ? (
          <AgentExecutionCard
            agentId="redacteur"
            title={result ? "Brouillon prêt à être relu" : "Rédaction en cours"}
            detail={
              result
                ? `Le message pour ${companyName} a été sauvegardé dans les brouillons.`
                : `Rédacteur adapte l’angle, le destinataire et la langue pour ${companyName}.`
            }
            status={result ? "completed" : "running"}
          >
            {result ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] p-3">
                  <p className="flex items-center gap-2 text-xs text-emerald-200/80">
                    <Check className="h-3.5 w-3.5" /> Objet
                  </p>
                  <p className="mt-1 text-sm text-white/80">{result.subject}</p>
                </div>
                <p className="line-clamp-4 whitespace-pre-wrap text-xs leading-relaxed text-[#969BA8]">
                  {result.body}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Link
                    href={`/emails/${result.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C8CEFF] px-4 py-2.5 text-sm font-semibold text-[#0B0D12]"
                  >
                    Relire le brouillon <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-white/50">
                <LoaderCircle className="h-4 w-4 animate-spin text-[#C8CEFF]" />
                Le message est généré dans la langue sélectionnée…
              </div>
            )}
          </AgentExecutionCard>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#969BA8]">
                  Opportunité
                </span>
                <select
                  value={prospectId}
                  onChange={(event) => setProspectId(event.target.value)}
                  className="w-full rounded-2xl border border-white/[0.09] bg-white/[0.035] px-3 py-2.5 text-sm text-white focus:border-[#C8CEFF]/30 focus:outline-none"
                >
                  {prospects.map((prospect) => (
                    <option key={prospect.id} value={prospect.id}>
                      {prospect.athleteName} — {prospect.club}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#969BA8]">
                  Destinataire
                </span>
                <select
                  value={contactId}
                  onChange={(event) => setContactId(event.target.value)}
                  className="w-full rounded-2xl border border-white/[0.09] bg-white/[0.035] px-3 py-2.5 text-sm text-white focus:border-[#F59E0B]/30 focus:outline-none"
                >
                  {draftableContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.role} · {contact.score ?? "—"}/100
                      {!["verified", "public_source"].includes(
                        contact.contactability,
                      )
                        ? " · email à compléter"
                        : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5">
              <div className="flex items-start gap-3">
                <Languages className="mt-0.5 h-4 w-4 shrink-0 text-[#C8CEFF]" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-medium text-white/75">
                        Langue du message
                      </p>
                      <p className="mt-0.5 text-[10px] leading-relaxed text-[#969BA8]">
                        {suggestion.reason} Vous gardez toujours le dernier mot.
                      </p>
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
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-[#969BA8]">
                    <ShieldCheck className="h-3 w-3 text-[#FF6B3D]" />
                    Confiance {suggestion.confidence === "medium" ? "moyenne" : "faible"}
                  </p>
                </div>
              </div>
            </div>

            {error ? (
              <p className="rounded-xl border border-red-400/15 bg-red-400/[0.05] px-3 py-2 text-xs text-red-200/80">
                {error}
              </p>
            ) : null}

            {!selectedProspect ? (
              <p className="text-xs text-[#F59E0B]">
                Cette entreprise n’est encore liée à aucune opportunité.
              </p>
            ) : null}
            {draftableContacts.length === 0 ? (
              <p className="text-xs text-[#F59E0B]">
                Aucun décideur avec un poste actuel suffisamment vérifié.
              </p>
            ) : null}

            {selectedContact && !selectedContactHasUsableEmail ? (
              <div className="rounded-2xl border border-[#F59E0B]/20 bg-[#F59E0B]/[0.06] px-3.5 py-3 text-xs leading-relaxed text-[#F6C978]">
                Rédacteur peut préparer le brouillon pour ce décideur. L’envoi
                restera bloqué tant qu’aucun email vérifié ou issu d’une source
                publique n’est disponible.
              </div>
            ) : null}

            <button
              type="button"
              onClick={generate}
              disabled={!prospectId || !contactId}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#C8CEFF] px-4 py-3 text-sm font-semibold text-[#0B0D12] transition-colors hover:bg-[#D9DDFF] disabled:opacity-35"
            >
              <Mail className="h-4 w-4" />
              Confier le message à Rédacteur
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
