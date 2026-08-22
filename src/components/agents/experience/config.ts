import { agentAvatars } from "@/lib/agent-avatars";
import type { AgentId } from "./types";

export const agentExperienceConfig: Record<
  AgentId,
  { name: string; role: string; avatar: string; color: string }
> = {
  scout: {
    name: "Scout",
    role: "Détection de partenaires",
    avatar: agentAvatars.scout,
    color: "#FF6B3D",
  },
  matchmaker: {
    name: "Matchmaker",
    role: "Priorisation des opportunités",
    avatar: agentAvatars.matchmaker,
    color: "#C8CEFF",
  },
  enrichisseur: {
    name: "Enrichisseur",
    role: "Identification des décideurs",
    avatar: agentAvatars.enrichisseur,
    color: "#F59E0B",
  },
  redacteur: {
    name: "Rédacteur",
    role: "Messages personnalisés",
    avatar: agentAvatars.redacteur,
    color: "#C8CEFF",
  },
  dispatcher: {
    name: "Dispatcher",
    role: "Envois contrôlés",
    avatar: agentAvatars.dispatcher,
    color: "#FF6B3D",
  },
  veilleur: {
    name: "Veilleur",
    role: "Analyse des réponses",
    avatar: agentAvatars.veilleur,
    color: "#C8CEFF",
  },
  relanceur: {
    name: "Relanceur",
    role: "Relances contextuelles",
    avatar: agentAvatars.relanceur,
    color: "#F59E0B",
  },
  "veille-concurrence": {
    name: "Veille",
    role: "Intelligence du marché",
    avatar: agentAvatars.veilleConcurrence,
    color: "#A855F7",
  },
};

