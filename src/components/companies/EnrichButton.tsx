"use client";

import { useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Database,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { AgentExecutionCard } from "@/components/agents/experience/AgentExecutionCard";
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
  const [insights, setInsights] = useState("");
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
    setInsights("");
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
              setContacts(data.result.contacts);
              setInsights(data.result.insights);
              setDone(true);
              setProgress(100);
              setDetail(
                `${data.result.contacts.length} contact${data.result.contacts.length > 1 ? "s" : ""} qualifié${data.result.contacts.length > 1 ? "s" : ""} pour la suite.`,
              );
              finishMission(
                missionId,
                `${data.result.contacts.length} décideur${data.result.contacts.length > 1 ? "s" : ""} qualifié${data.result.contacts.length > 1 ? "s" : ""}. Choisissez maintenant le destinataire avec Rédacteur.`,
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
          <Database className="h-4 w-4" />
        )}
        {done ? "Voir les décideurs" : "Enrichir les contacts"}
      </button>
    );
  }

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
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.035] p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-sm font-medium text-white/80">
                    {contact.role}
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-emerald-300">
                    score {contact.score ?? "—"}/100
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#969BA8]">
                  {contact.currentRoleVerified
                    ? "Poste actuel vérifié"
                    : "Poste à confirmer"}{" "}
                  · contactabilité {contact.contactability}
                </p>
              </div>
            ))}

            {insights ? (
              <p className="text-xs italic leading-relaxed text-[#969BA8]">
                {insights}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => setHandoffOpen(true)}
              disabled={
                prospects.length === 0 ||
                !contacts.some((contact) =>
                  ["verified", "public_source"].includes(
                    contact.contactability,
                  ),
                )
              }
              className="group mt-1 flex w-full items-start gap-3 rounded-2xl border border-[#C8CEFF]/15 bg-[#C8CEFF]/[0.05] p-3 text-left transition-colors hover:bg-[#C8CEFF]/[0.08] disabled:opacity-40"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-[#D9DDFF]">
                  Passer le relais à Rédacteur
                </span>
                <span className="mt-1 block text-[11px] leading-relaxed text-[#969BA8]">
                  J’ai trouvé les décideurs pertinents. Choisissez à qui écrire
                  et la langue du message ; Rédacteur préparera le brouillon.
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
        />
      ) : null}
    </>
  );
}

function getEnrichmentDetail(message: string) {
  const normalized = message.toLowerCase();
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
