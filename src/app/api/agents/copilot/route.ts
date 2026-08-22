import { NextRequest, NextResponse } from "next/server";
import { generateAIText } from "@/lib/ai";
import { extractJSONObject } from "@/lib/utils";
import type { AgentId } from "@/components/agents/experience/types";
import { getCurrentUserAccess } from "@/lib/auth/access";

export const runtime = "nodejs";
export const maxDuration = 45;

const ALLOWED_ROUTES = new Set([
  "/players",
  "/companies",
  "/prospection",
  "/emails",
  "/agents",
  "/veille",
  "/pipeline",
]);

const AGENT_IDS = new Set<AgentId>([
  "scout",
  "matchmaker",
  "enrichisseur",
  "redacteur",
  "dispatcher",
  "veilleur",
  "relanceur",
  "veille-concurrence",
]);

type CopilotPlan = {
  reply?: string;
  actions?: Array<{ label?: string; href?: string; agentId?: AgentId }>;
};

export async function POST(request: NextRequest) {
  const access = await getCurrentUserAccess();
  if (!access.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!access.canOperate) {
    return NextResponse.json(
      { error: "Votre compte est en mode découverte." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    message?: string;
    pathname?: string;
  } | null;
  const message = body?.message?.trim();

  if (!message || message.length > 800) {
    return NextResponse.json(
      { error: "Votre demande doit contenir entre 1 et 800 caractères." },
      { status: 400 },
    );
  }

  const prompt = `Tu es le copilote de Vectis Agency, un CRM de sponsoring sportif.
Tu guides l'utilisateur vers le bon agent et la bonne page, mais tu n'exécutes jamais un envoi, une suppression ou une validation à sa place.

AGENTS ET PAGES AUTORISÉES :
- Scout + Matchmaker : rechercher et scorer des marques depuis la fiche d'un athlète — /players
- Enrichisseur : identifier des décideurs depuis une entreprise — /companies
- Rédacteur : préparer des brouillons personnalisés — /prospection
- Dispatcher : vérifier et envoyer uniquement les brouillons approuvés — /emails
- Veilleur : analyser les réponses reçues — /emails
- Relanceur : préparer une relance contextuelle — /agents
- Veille Concurrence : détecter les signaux du marché — /veille
- Pipeline : suivre les opportunités — /pipeline

CONTEXTE : page actuelle ${body?.pathname || "inconnue"}
DEMANDE : ${message}

Réponds en français, en deux phrases maximum, puis propose au maximum 3 actions concrètes. Si une information manque (athlète, entreprise, destinataire), explique qu'elle sera demandée sur l'écran suivant. Ne prétends jamais qu'une action a déjà été réalisée.
Retourne uniquement ce JSON :
{"reply":"...","actions":[{"label":"...","href":"/players","agentId":"scout"}]}`;

  try {
    const text = await generateAIText({
      prompt,
      maxOutputTokens: 900,
      reasoningEffort: "low",
      timeoutMs: 30_000,
    });
    const parsed = extractJSONObject<CopilotPlan>(text);
    if (!parsed?.reply) throw new Error("Invalid copilot response");

    const actions = (parsed.actions || [])
      .filter(
        (action) =>
          action.label &&
          action.href &&
          action.agentId &&
          ALLOWED_ROUTES.has(action.href) &&
          AGENT_IDS.has(action.agentId),
      )
      .slice(0, 3);

    return NextResponse.json({ reply: parsed.reply, actions });
  } catch {
    return NextResponse.json(buildFallbackPlan(message));
  }
}

function buildFallbackPlan(message: string): CopilotPlan {
  const normalized = message.toLowerCase();

  if (/contact|décideur|enrich/.test(normalized)) {
    return {
      reply:
        "Enrichisseur peut identifier les décideurs les plus pertinents. Choisissez d’abord l’entreprise à analyser.",
      actions: [
        {
          label: "Choisir une entreprise",
          href: "/companies",
          agentId: "enrichisseur",
        },
      ],
    };
  }
  if (/mail|email|rédig|message/.test(normalized)) {
    return {
      reply:
        "Rédacteur peut préparer un brouillon personnalisé à partir d’une opportunité et d’un contact qualifié.",
      actions: [
        {
          label: "Choisir une opportunité",
          href: "/prospection",
          agentId: "redacteur",
        },
      ],
    };
  }
  if (/veille|marché|concurr/.test(normalized)) {
    return {
      reply:
        "Veille peut analyser les signaux récents du marché du sponsoring et faire ressortir les priorités.",
      actions: [
        {
          label: "Ouvrir la veille",
          href: "/veille",
          agentId: "veille-concurrence",
        },
      ],
    };
  }

  return {
    reply:
      "Je peux organiser la recherche de marques, l’enrichissement, la rédaction et le suivi. Commencez par choisir le talent concerné.",
    actions: [
      {
        label: "Choisir un talent",
        href: "/players",
        agentId: "scout",
      },
    ],
  };
}
