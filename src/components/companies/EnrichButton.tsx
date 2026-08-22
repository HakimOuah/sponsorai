"use client";

import { useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CircleAlert,
  Database,
  Globe2,
  LoaderCircle,
  MailCheck,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { AgentExecutionCard } from "@/components/agents/experience/AgentExecutionCard";
import { AgentAvatar } from "@/components/agents/experience/AgentAvatar";
import { useAgentExperience } from "@/components/agents/experience/AgentExperienceProvider";
import { WriterHandoffModal } from "@/components/agents/experience/WriterHandoffModal";

interface EnrichContact {
  id: string;
  role: string;
  roleNormalized: string;
  currentRoleVerified: boolean;
  contactability: "verified" | "public_source" | "guessed" | "missing";
  relevance: number;
  score: number | null;
  scoreVersion: string;
  source: string | null;
}

interface EnrichmentDiagnostic {
  provider: "apollo" | "web_search";
  stage: "people_search" | "email_enrichment" | "public_web_search";
  status: "success" | "partial" | "no_result" | "failed";
  message: string;
  requested?: number;
  matched?: number;
  usableEmails?: number;
  creditsConsumed?: number | null;
}

interface CompanyProspect {
  id: string;
  athleteName: string;
  club: string;
}

interface EnrichButtonProps {
  companyId: string;
  companyName: string;
  companyCountry?: string | null;
  prospects?: CompanyProspect[];
}

export function EnrichButton({
  companyId,
  companyName,
  companyCountry,
  prospects = [],
}: EnrichButtonProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [contacts, setContacts] = useState<EnrichContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [insights, setInsights] = useState("");
  const [diagnostics, setDiagnostics] = useState<EnrichmentDiagnostic[]>([]);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [detail, setDetail] = useState(
    "Enrichisseur prépare la recherche de décideurs.",
  );
  const [handoffOpen, setHandoffOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const {
    startMission,
    updateMission,
    finishMission,
    failMission,
  } = useAgentExperience();

  const run = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    setContacts([]);
    setSelectedContactId("");
    setInsights("");
    setDiagnostics([]);
    setDone(false);
    setExpanded(true);
    setProgress(8);
    setDetail("Enrichisseur identifie les fonctions décisionnaires pertinentes.");

    const missionId = startMission({
      agentId: "enrichisseur",
      title: `Décideurs chez ${companyName}`,
      detail: "Enrichisseur identifie les fonctions décisionnaires pertinentes.",
      progress: 8,
    });
    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/agents/enrichisseur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Enrichissement indisponible (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let terminalEventReceived = false;

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "log") {
              setProgress((current) => {
                const next = Math.min(88, current + 11);
                updateMission(missionId, { progress: next });
                return next;
              });
              const nextDetail = getEnrichmentDetail(data.message);
              setDetail(nextDetail);
              updateMission(missionId, { detail: nextDetail });
            } else if (data.type === "done") {
              terminalEventReceived = true;
              const enrichedContacts = data.result.contacts as EnrichContact[];
              const enrichmentDiagnostics = Array.isArray(
                data.result.diagnostics,
              )
                ? (data.result.diagnostics as EnrichmentDiagnostic[])
                : [];
              const usableEmailCount = enrichedContacts.filter((contact) =>
                isUsableContactability(contact.contactability),
              ).length;
              setContacts(enrichedContacts);
              setSelectedContactId(
                enrichedContacts.find(
                  (contact) =>
                    contact.currentRoleVerified &&
                    isUsableContactability(contact.contactability),
                )?.id ||
                  enrichedContacts.find(
                    (contact) => contact.currentRoleVerified,
                  )?.id ||
                  "",
              );
              setInsights(data.result.insights);
              setDiagnostics(enrichmentDiagnostics);
              setDone(true);
              setProgress(100);
              setDetail(
                `${enrichedContacts.length} décideur${enrichedContacts.length > 1 ? "s" : ""} identifié${enrichedContacts.length > 1 ? "s" : ""} · ${usableEmailCount} email${usableEmailCount > 1 ? "s" : ""} exploitable${usableEmailCount > 1 ? "s" : ""}.`,
              );
              finishMission(
                missionId,
                usableEmailCount > 0
                  ? `${usableEmailCount} destinataire${usableEmailCount > 1 ? "s" : ""} joignable${usableEmailCount > 1 ? "s" : ""}. Choisissez maintenant à qui écrire avec Rédacteur.`
                  : `${enrichedContacts.length} décideur${enrichedContacts.length > 1 ? "s" : ""} identifié${enrichedContacts.length > 1 ? "s" : ""}, mais aucun email exploitable. Vous pouvez préparer le brouillon ; l’envoi restera bloqué.`,
                {
                  status: "waiting",
                  nextAgentId: "redacteur",
                  actionLabel: "Choisir le destinataire",
                  actionHref: `/companies/${companyId}`,
                },
              );
            } else if (data.type === "error") {
              terminalEventReceived = true;
              throw new Error(data.message);
            }
          } catch (caught) {
            if (caught instanceof SyntaxError) continue;
            throw caught;
          }
        }
      }

      if (!terminalEventReceived) {
        throw new Error("La connexion a été interrompue avant la fin.");
      }
    } catch (caught) {
      if (caught instanceof Error && caught.name !== "AbortError") {
        setError(caught.message);
        failMission(missionId, caught.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={done ? () => setExpanded(true) : run}
        disabled={loading}
        className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[#F59E0B]/20 bg-[#F59E0B]/5 px-3 py-2.5 text-sm text-[#F59E0B] transition-colors hover:bg-[#F59E0B]/10 disabled:opacity-50 sm:w-auto sm:py-2"
      >
        {loading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : done ? (
          <Check className="h-4 w-4" />
        ) : (
          <AgentAvatar agentId="enrichisseur" size="sm" />
        )}
        {done ? "Voir les décideurs" : "Demander à Enrichisseur"}
      </button>
    );
  }

  const usableEmailCount = contacts.filter((contact) =>
    isUsableContactability(contact.contactability),
  ).length;

  return (
    <>
      <AgentExecutionCard
        agentId="enrichisseur"
        title={`Décideurs chez ${companyName}`}
        detail={error || detail}
        status={error ? "error" : done ? "completed" : "running"}
        progress={progress}
        onMinimize={() => setExpanded(false)}
      >
        {done && contacts.length > 0 ? (
          <div className="space-y-2.5">
            <div
              className={`rounded-2xl border px-3 py-2.5 text-xs leading-relaxed ${
                usableEmailCount > 0
                  ? "border-emerald-400/15 bg-emerald-400/[0.05] text-emerald-200/80"
                  : "border-[#F59E0B]/20 bg-[#F59E0B]/[0.06] text-[#F6C76F]"
              }`}
            >
              <span className="flex items-start gap-2">
                {usableEmailCount > 0 ? (
                  <MailCheck className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>
                  {usableEmailCount > 0
                    ? `${usableEmailCount} email${usableEmailCount > 1 ? "s" : ""} professionnel${usableEmailCount > 1 ? "s" : ""} exploitable${usableEmailCount > 1 ? "s" : ""}. L’envoi restera soumis à votre validation.`
                    : "Apollo et la recherche web publique n’ont confirmé aucun email. Les décideurs peuvent être sélectionnés pour préparer un brouillon, mais l’envoi reste bloqué."}
                </span>
              </span>
            </div>

            <fieldset className="space-y-2.5" role="radiogroup">
              <legend className="sr-only">Choisir un décideur</legend>
              {contacts.map((contact) => {
                const selected = contact.id === selectedContactId;
                const selectable = contact.currentRoleVerified;

                return (
                  <button
                    key={contact.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={!selectable}
                    onClick={() => setSelectedContactId(contact.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-45 ${
                      selected
                        ? "border-[#F59E0B]/55 bg-[#F59E0B]/[0.10] shadow-[0_0_0_1px_rgba(245,158,11,0.10)]"
                        : "border-emerald-400/10 bg-emerald-400/[0.035] hover:border-[#F59E0B]/30 hover:bg-[#F59E0B]/[0.05]"
                    }`}
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          selected
                            ? "border-[#F59E0B] bg-[#F59E0B] text-[#0B0D12]"
                            : "border-white/20 text-transparent"
                        }`}
                        aria-hidden="true"
                      >
                        <Check className="h-3 w-3" />
                      </span>
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                      <span className="text-sm font-medium text-white/80">
                        {contact.role}
                      </span>
                      <span className="ml-auto font-mono text-[10px] text-emerald-300">
                        score {contact.score ?? "—"}/100
                      </span>
                    </span>
                    <span className="mt-1 block pl-6 text-[11px] text-[#969BA8]">
                      {contact.currentRoleVerified
                        ? "Poste actuel vérifié"
                        : "Poste à confirmer"}{" "}
                      · {getContactabilityLabel(contact.contactability)}
                    </span>
                  </button>
                );
              })}
            </fieldset>

            {insights ? (
              <p className="text-xs italic leading-relaxed text-[#969BA8]">
                {insights}
              </p>
            ) : null}

            {diagnostics.length > 0 ? (
              <div className="space-y-1.5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#969BA8]">
                  Sources consultées
                </p>
                {diagnostics.map((diagnostic, index) => (
                  <div
                    key={`${diagnostic.provider}-${diagnostic.stage}-${index}`}
                    className="flex items-start gap-2 text-[11px] leading-relaxed text-white/55"
                  >
                    {diagnostic.provider === "apollo" ? (
                      <Database className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F59E0B]" />
                    ) : (
                      <Globe2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C8CEFF]" />
                    )}
                    <span className="min-w-0 flex-1">
                      {diagnostic.message}
                    </span>
                    <span
                      className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                        diagnostic.status === "success"
                          ? "bg-emerald-400"
                          : diagnostic.status === "failed"
                            ? "bg-rose-400"
                            : "bg-[#F59E0B]"
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setHandoffOpen(true)}
              disabled={prospects.length === 0 || !selectedContactId}
              className="group mt-1 flex w-full items-start gap-3 rounded-2xl border border-[#C8CEFF]/15 bg-[#C8CEFF]/[0.05] p-3 text-left transition-colors hover:bg-[#C8CEFF]/[0.08] disabled:opacity-40"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-[#D9DDFF]">
                  {usableEmailCount > 0
                    ? "Passer le relais à Rédacteur"
                    : "Préparer le brouillon sans email"}
                </span>
                <span className="mt-1 block text-[11px] leading-relaxed text-[#969BA8]">
                  {usableEmailCount > 0
                    ? "Le décideur sélectionné et la langue seront transmis à Rédacteur pour préparer le brouillon."
                    : "Rédacteur peut préparer le message pour le décideur sélectionné. Dispatcher ne pourra pas l’envoyer tant qu’un email n’aura pas été confirmé."}
                </span>
              </span>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#C8CEFF] transition-transform group-hover:translate-x-0.5" />
            </button>

            {prospects.length === 0 ? (
              <p className="text-[11px] text-[#F59E0B]">
                Créez d’abord une opportunité liée à cette entreprise pour
                préparer un message.
              </p>
            ) : null}
          </div>
        ) : null}

        {done && contacts.length === 0 ? (
          <div className="rounded-2xl border border-[#F59E0B]/20 bg-[#F59E0B]/5 px-3 py-2 text-xs leading-relaxed text-[#F59E0B]">
            Aucun contact actuel n’a pu être vérifié avec assez de fiabilité.
            La fiche entreprise n’a pas été modifiée.
          </div>
        ) : null}

        {error ? (
          <button
            type="button"
            onClick={run}
            className="inline-flex items-center gap-2 rounded-full bg-[#F59E0B] px-4 py-2 text-xs font-semibold text-[#0B0D12]"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Réessayer
          </button>
        ) : null}
      </AgentExecutionCard>

      {handoffOpen ? (
        <WriterHandoffModal
          open
          onClose={() => setHandoffOpen(false)}
          companyName={companyName}
          companyCountry={companyCountry}
          contacts={contacts}
          prospects={prospects}
          initialContactId={selectedContactId}
        />
      ) : null}
    </>
  );
}

function getContactabilityLabel(
  contactability: EnrichContact["contactability"],
) {
  if (contactability === "verified") return "email vérifié";
  if (contactability === "public_source") {
    return "email issu d’une source publique";
  }
  if (contactability === "guessed") return "email à vérifier avant envoi";
  return "email à compléter avant envoi";
}

function isUsableContactability(
  contactability: EnrichContact["contactability"],
) {
  return contactability === "verified" || contactability === "public_source";
}

function getEnrichmentDetail(message: string) {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("bulk_match") ||
    normalized.includes("a échoué") ||
    normalized.includes("aucun email")
  ) {
    return "Apollo n’a pas confirmé d’email ; Enrichisseur active la recherche publique de secours.";
  }
  if (normalized.includes("recherche publique")) {
    return "Enrichisseur cherche une coordonnée publique avec une source vérifiable.";
  }
  if (normalized.includes("apollo")) {
    return "Enrichisseur interroge les sources structurées disponibles.";
  }
  if (normalized.includes("pattern email")) {
    return "Enrichisseur vérifie les coordonnées professionnelles.";
  }
  if (normalized.includes("web search") || normalized.includes("recherche")) {
    return "Enrichisseur vérifie les fonctions et les postes actuels.";
  }
  if (normalized.includes("vérifié") || normalized.includes("qualifié")) {
    return "Enrichisseur classe les décideurs selon leur fiabilité.";
  }
  return "Enrichisseur consolide les contacts trouvés.";
}
