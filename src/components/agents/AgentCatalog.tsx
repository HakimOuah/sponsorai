"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  Database,
  Eye,
  Mail,
  PenTool,
  Radar,
  RefreshCw,
  Search,
  Send,
  Target,
  X,
  type LucideIcon,
} from "lucide-react";
import { AgentCard } from "@/components/agents/AgentCard";
import { ScanLauncher } from "@/components/agents/ScanLauncher";
import { RelanceurPanel } from "@/components/agents/RelanceurPanel";
import { VeillePanel } from "@/components/agents/VeillePanel";
import { AgentAvatar } from "@/components/agents/experience/AgentAvatar";
import {
  WriterHandoffModal,
  type HandoffContact,
  type HandoffProspect,
} from "@/components/agents/experience/WriterHandoffModal";
import { EnrichButton } from "@/components/companies/EnrichButton";
import { agentExperienceConfig } from "@/components/agents/experience/config";
import type { AgentId } from "@/components/agents/experience/types";

export type AgentPlayerOption = {
  id: string;
  firstName: string;
  lastName: string;
  club: string;
};

export type AgentCompanyOption = {
  id: string;
  name: string;
  country: string | null;
  contacts: HandoffContact[];
  prospects: HandoffProspect[];
};

export type AgentProspectOption = {
  id: string;
  companyName: string;
  status: string;
};

type AgentDefinition = {
  id: AgentId;
  name: string;
  shortDescription: string;
  longDescription: string;
  capabilities: string[];
  icon: LucideIcon;
  color: string;
};

const AGENTS: AgentDefinition[] = [
  {
    id: "scout",
    name: "Scout",
    shortDescription:
      "Recherche les marques cohérentes et accessibles pour chaque talent.",
    longDescription:
      "Scout analyse le profil public d’un talent, son audience, son actualité et son positionnement pour détecter 12 à 15 partenaires réalistes. Il privilégie les marques activables plutôt que les grands noms évidents.",
    capabilities: [
      "Recherche web et signaux récents",
      "Détection de marques par territoire et secteur",
      "Transmission automatique à Matchmaker",
    ],
    icon: Search,
    color: "#FF6B3D",
  },
  {
    id: "matchmaker",
    name: "Matchmaker",
    shortDescription:
      "Évalue chaque marque et classe les opportunités par potentiel.",
    longDescription:
      "Matchmaker reprend les marques trouvées par Scout et les compare au profil du talent sur six axes : image, audience, historique sponsoring, potentiel commercial, accessibilité et timing.",
    capabilities: [
      "Score multi-critères sur 10",
      "Priorités A, B et C expliquées",
      "Angle de partenariat recommandé",
    ],
    icon: Target,
    color: "#C8CEFF",
  },
  {
    id: "redacteur",
    name: "Rédacteur",
    shortDescription:
      "Prépare un email professionnel au nom du représentant du talent.",
    longDescription:
      "Rédacteur transforme une opportunité et un décideur qualifié en brouillon personnalisé. Il adapte la langue au pays, présente le représentant et le talent, puis propose une prise de contact sobre et professionnelle.",
    capabilities: [
      "Choix de l’entreprise, du talent et du destinataire",
      "Langue adaptée au marché ciblé",
      "Brouillon obligatoire avant tout envoi",
    ],
    icon: PenTool,
    color: "#C8CEFF",
  },
  {
    id: "enrichisseur",
    name: "Enrichisseur",
    shortDescription:
      "Identifie les décideurs et recherche un email réellement exploitable.",
    longDescription:
      "Enrichisseur croise Apollo et les sources web publiques pour retrouver les fonctions marketing, communication, partenariat ou sponsoring actuellement en poste. Il privilégie les emails vérifiés et les boîtes fonctionnelles officielles.",
    capabilities: [
      "Identification des bons interlocuteurs",
      "Recherche et qualification des emails",
      "Sources et niveau de confiance visibles par l’administrateur",
    ],
    icon: Database,
    color: "#F59E0B",
  },
  {
    id: "dispatcher",
    name: "Dispatcher",
    shortDescription:
      "Centralise les brouillons validés et sécurise leur envoi.",
    longDescription:
      "Dispatcher prend le relais uniquement après validation humaine. Il vérifie le destinataire, l’identité d’envoi et l’état du brouillon avant de déclencher un envoi traçable dans Vectis.",
    capabilities: [
      "Contrôle des brouillons prêts",
      "Validation humaine conservée",
      "Suivi des statuts d’envoi",
    ],
    icon: Send,
    color: "#FF6B3D",
  },
  {
    id: "veilleur",
    name: "Veilleur",
    shortDescription:
      "Analyse les réponses reçues et recommande la prochaine étape.",
    longDescription:
      "Veilleur lit les réponses centralisées, détecte leur intention et propose une évolution du pipeline. Une réponse positive reste soumise à votre décision avant toute action commerciale.",
    capabilities: [
      "Catégorisation des réponses",
      "Détection des signaux positifs ou négatifs",
      "Suggestion de prochaine étape",
    ],
    icon: Eye,
    color: "#C8CEFF",
  },
  {
    id: "relanceur",
    name: "Relanceur",
    shortDescription:
      "Prépare une relance contextualisée au bon moment.",
    longDescription:
      "Relanceur repart du premier message, recherche un angle d’actualité pertinent et produit un nouveau brouillon. Il attribue également un score de timing pour éviter les relances mécaniques.",
    capabilities: [
      "Recherche d’un angle d’actualité",
      "Score de timing expliqué",
      "Relance enregistrée en brouillon",
    ],
    icon: RefreshCw,
    color: "#F59E0B",
  },
  {
    id: "veille-concurrence",
    name: "Veille Concurrence",
    shortDescription:
      "Surveille le marché du sponsoring et détecte les signaux utiles.",
    longDescription:
      "Veille Concurrence recherche les nouveaux deals, fins de contrat, marques entrantes et tendances du sponsoring sportif. Les signaux détectés alimentent ensuite la recherche d’opportunités.",
    capabilities: [
      "Lecture de l’actualité sponsoring",
      "Priorisation des signaux de marché",
      "Alimentation du graphe d’opportunités",
    ],
    icon: Radar,
    color: "#A855F7",
  },
];

export function AgentCatalog({
  players,
  companies,
  contactedProspects,
  defaultProspectId,
  canOperate,
  canViewContactDetails,
}: {
  players: AgentPlayerOption[];
  companies: AgentCompanyOption[];
  contactedProspects: AgentProspectOption[];
  defaultProspectId?: string;
  canOperate: boolean;
  canViewContactDetails: boolean;
}) {
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId | null>(
    defaultProspectId ? "relanceur" : null,
  );
  const [writerCompanyId, setWriterCompanyId] = useState("");
  const [enrichCompanyId, setEnrichCompanyId] = useState("");
  const [writerOpen, setWriterOpen] = useState(false);

  const selectedAgent = AGENTS.find((agent) => agent.id === selectedAgentId);
  const writerCompanies = useMemo(
    () =>
      companies.filter(
        (company) =>
          company.prospects.length > 0 &&
          company.contacts.some((contact) => contact.currentRoleVerified),
      ),
    [companies],
  );
  const writerCompany = writerCompanies.find(
    (company) => company.id === writerCompanyId,
  );
  const enrichCompany = companies.find(
    (company) => company.id === enrichCompanyId,
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map((agent) => (
          <AgentCard
            key={agent.id}
            name={agent.name}
            description={agent.shortDescription}
            icon={agent.icon}
            avatar={agentExperienceConfig[agent.id].avatar}
            status="active"
            color={agent.color}
            onSelect={() => setSelectedAgentId(agent.id)}
          />
        ))}
      </div>

      {selectedAgent && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050609]/82 p-3 backdrop-blur-md sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="agent-detail-title"
            >
              <button
                type="button"
                className="absolute inset-0 cursor-default"
                onClick={() => setSelectedAgentId(null)}
                aria-label="Fermer la fiche de l’agent"
              />
              <div className="relative z-10 max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-[30px] border border-white/[0.10] bg-[#080A0F] p-4 shadow-[0_30px_110px_rgba(0,0,0,0.68)] sm:p-6">
                <div className="flex items-start gap-4">
                  <AgentAvatar agentId={selectedAgent.id} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#FF6B3D]/20 bg-[#FF6B3D]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#FF8B69]">
                        Agent actif
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                        {agentExperienceConfig[selectedAgent.id].role}
                      </span>
                    </div>
                    <h2
                      id="agent-detail-title"
                      className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white"
                    >
                      {selectedAgent.name}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#969BA8]">
                      {selectedAgent.longDescription}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAgentId(null)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.09] text-white/45 hover:bg-white/[0.05] hover:text-white"
                    aria-label="Fermer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  {selectedAgent.capabilities.map((capability) => (
                    <div
                      key={capability}
                      className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3"
                    >
                      <Check className="h-3.5 w-3.5 text-[#FF6B3D]" />
                      <p className="mt-2 text-xs leading-relaxed text-white/65">
                        {capability}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-3xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Bot className="h-4 w-4 text-[#FF6B3D]" />
                    <h3 className="text-sm font-semibold text-white/80">
                      Utiliser {selectedAgent.name}
                    </h3>
                  </div>
                  {canOperate ? (
                    <AgentAction
                      agent={selectedAgent}
                      players={players}
                      companies={companies}
                      writerCompanies={writerCompanies}
                      writerCompanyId={writerCompanyId}
                      setWriterCompanyId={setWriterCompanyId}
                      onOpenWriter={() => setWriterOpen(true)}
                      enrichCompanyId={enrichCompanyId}
                      setEnrichCompanyId={setEnrichCompanyId}
                      enrichCompany={enrichCompany}
                      contactedProspects={contactedProspects}
                      defaultProspectId={defaultProspectId}
                      canViewContactDetails={canViewContactDetails}
                    />
                  ) : (
                    <div className="rounded-2xl border border-[#C8CEFF]/20 bg-[#C8CEFF]/[0.06] px-4 py-3 text-sm leading-relaxed text-[#D9DDFF]">
                      Votre compte Free user permet de découvrir cet agent, mais
                      pas de le lancer. Un administrateur peut faire évoluer
                      votre rôle vers Client.
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {writerOpen && writerCompany ? (
        <WriterHandoffModal
          open
          onClose={() => setWriterOpen(false)}
          companyName={writerCompany.name}
          companyCountry={writerCompany.country}
          contacts={writerCompany.contacts}
          prospects={writerCompany.prospects}
          origin="company"
        />
      ) : null}
    </>
  );
}

function AgentAction({
  agent,
  players,
  companies,
  writerCompanies,
  writerCompanyId,
  setWriterCompanyId,
  onOpenWriter,
  enrichCompanyId,
  setEnrichCompanyId,
  enrichCompany,
  contactedProspects,
  defaultProspectId,
  canViewContactDetails,
}: {
  agent: AgentDefinition;
  players: AgentPlayerOption[];
  companies: AgentCompanyOption[];
  writerCompanies: AgentCompanyOption[];
  writerCompanyId: string;
  setWriterCompanyId: (value: string) => void;
  onOpenWriter: () => void;
  enrichCompanyId: string;
  setEnrichCompanyId: (value: string) => void;
  enrichCompany?: AgentCompanyOption;
  contactedProspects: AgentProspectOption[];
  defaultProspectId?: string;
  canViewContactDetails: boolean;
}) {
  if (agent.id === "scout" || agent.id === "matchmaker") {
    return players.length > 0 ? (
      <div className="space-y-3">
        <p className="text-xs leading-relaxed text-[#969BA8]">
          Choisissez le talent à analyser. Scout et Matchmaker travailleront
          ensemble et la progression restera visible ici.
        </p>
        <ScanLauncher players={players} />
      </div>
    ) : (
      <EmptyAction message="Ajoutez d’abord un talent pour lancer cette analyse." />
    );
  }

  if (agent.id === "redacteur") {
    return writerCompanies.length > 0 ? (
      <div className="space-y-3">
        <label className="space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40">
            Entreprise
          </span>
          <select
            value={writerCompanyId}
            onChange={(event) => setWriterCompanyId(event.target.value)}
            className={selectClassName}
          >
            <option value="">Choisir une entreprise et son contact…</option>
            {writerCompanies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name} · {company.contacts.length} contact(s)
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onOpenWriter}
          disabled={!writerCompanyId}
          className={primaryButtonClassName}
        >
          <PenTool className="h-4 w-4" />
          Choisir le destinataire et rédiger
        </button>
      </div>
    ) : (
      <EmptyAction message="Aucune entreprise ne dispose encore d’une opportunité et d’un décideur vérifié." />
    );
  }

  if (agent.id === "enrichisseur") {
    return companies.length > 0 ? (
      <div className="space-y-3">
        <label className="space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40">
            Entreprise à enrichir
          </span>
          <select
            value={enrichCompanyId}
            onChange={(event) => setEnrichCompanyId(event.target.value)}
            className={selectClassName}
          >
            <option value="">Choisir une entreprise…</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </label>
        {enrichCompany ? (
          <EnrichButton
            key={enrichCompany.id}
            companyId={enrichCompany.id}
            companyName={enrichCompany.name}
            companyCountry={enrichCompany.country}
            prospects={enrichCompany.prospects}
            canViewContactDetails={canViewContactDetails}
          />
        ) : null}
      </div>
    ) : (
      <EmptyAction message="Ajoutez d’abord une entreprise à enrichir." />
    );
  }

  if (agent.id === "relanceur") {
    return contactedProspects.length > 0 ? (
      <RelanceurPanel
        prospects={contactedProspects}
        defaultProspectId={defaultProspectId}
      />
    ) : (
      <EmptyAction message="Aucun prospect contacté n’est encore disponible pour une relance." />
    );
  }

  if (agent.id === "veille-concurrence") return <VeillePanel />;

  if (agent.id === "dispatcher") {
    return (
      <NavigationAction
        href="/emails?status=draft"
        icon={Mail}
        label="Voir les brouillons à valider"
        detail="Dispatcher reste volontairement derrière une validation humaine avant chaque envoi."
      />
    );
  }

  return (
    <NavigationAction
      href="/emails"
      icon={Eye}
      label="Ouvrir les conversations"
      detail="Sélectionnez un message reçu pour demander à Veilleur de l’analyser."
    />
  );
}

function NavigationAction({
  href,
  icon: Icon,
  label,
  detail,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  detail: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-[#969BA8]">{detail}</p>
      <Link href={href} className={primaryButtonClassName}>
        <Icon className="h-4 w-4" />
        {label}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function EmptyAction({ message }: { message: string }) {
  return (
    <p className="rounded-2xl border border-[#F59E0B]/18 bg-[#F59E0B]/[0.05] px-4 py-3 text-xs leading-relaxed text-[#F6C978]">
      {message}
    </p>
  );
}

const selectClassName =
  "w-full rounded-2xl border border-white/[0.10] bg-[#11141D] px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF6B3D]/40";

const primaryButtonClassName =
  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6B3D] px-4 py-3 text-sm font-semibold text-[#0B0D12] transition-colors hover:bg-[#FF865F] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto";
