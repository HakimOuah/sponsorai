import {
  Bot,
  Search,
  Target,
  PenTool,
  Database,
  Send,
  Eye,
  RefreshCw,
  Radar,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AgentCard } from "@/components/agents/AgentCard";
import { ScanLauncher } from "@/components/agents/ScanLauncher";
import { RelanceurPanel } from "@/components/agents/RelanceurPanel";
import { VeillePanel } from "@/components/agents/VeillePanel";

export const dynamic = "force-dynamic";

const agents = [
  {
    name: "Scout",
    description:
      "Recherche de marques potentielles via web search + Claude. Trouve 25-30 marques par scan.",
    icon: Search,
    status: "active" as const,
    color: "#3EF2A0",
  },
  {
    name: "Matchmaker",
    description:
      "Scoring multi-critères des marques. 6 axes d'analyse, priorité A/B/C.",
    icon: Target,
    status: "active" as const,
    color: "#DDFBEA",
  },
  {
    name: "Rédacteur",
    description:
      "Génération de mails de prospection personnalisés avec templates configurables.",
    icon: PenTool,
    status: "active" as const,
    color: "#DDFBEA",
  },
  {
    name: "Enrichisseur",
    description:
      "Recherche de contacts décisionnaires (nom, email, LinkedIn) pour chaque entreprise.",
    icon: Database,
    status: "active" as const,
    color: "#f59e0b",
  },
  {
    name: "Dispatcher",
    description:
      "Envoi en masse des brouillons prêts. Identifie les emails sans contact.",
    icon: Send,
    status: "active" as const,
    color: "#ef4444",
  },
  {
    name: "Veilleur",
    description:
      "Analyse et catégorisation des réponses reçues. Alerte sur les réponses positives.",
    icon: Eye,
    status: "active" as const,
    color: "#DDFBEA",
  },
  {
    name: "Relanceur",
    description:
      "Relance contextuelle basée sur l'actualité du profil. Timing score et email personnalisé.",
    icon: RefreshCw,
    status: "active" as const,
    color: "#f59e0b",
  },
  {
    name: "Veille Concurrence",
    description:
      "Scan du marché sponsoring : nouveaux deals, fins de contrat, marques entrantes, tendances.",
    icon: Radar,
    status: "active" as const,
    color: "#a855f7",
  },
];

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: { prospect?: string };
}) {
  const [players, recentScans, contactedProspects] = await Promise.all([
    prisma.player.findMany({
      where: { active: true },
      select: { id: true, firstName: true, lastName: true, club: true },
      orderBy: { lastName: "asc" },
    }),
    prisma.scan.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        player: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.prospect.findMany({
      where: {
        emails: {
          some: { status: { in: ["sent", "opened"] } },
        },
      },
      select: {
        id: true,
        status: true,
        company: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
  ]);

  const relanceurProspects = contactedProspects.map((p) => ({
    id: p.id,
    companyName: p.company.name,
    status: p.status,
  }));

  return (
    <div className="min-w-0">
      <div className="mb-6 flex items-center gap-3">
        <Bot className="h-6 w-6 text-[#3EF2A0]" />
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#F8FAF7] sm:text-3xl">Agents IA</h1>
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {agents.map((agent) => (
          <AgentCard key={agent.name} {...agent} />
        ))}
      </div>

      {/* Scan launcher */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8FA69E] mb-3">
          Lancer un scan Scout + Matchmaker
        </h2>
        <ScanLauncher players={players} />
      </div>

      {/* Relanceur */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8FA69E] mb-3">
          Relanceur Intelligent
        </h2>
        {relanceurProspects.length > 0 ? (
          <RelanceurPanel prospects={relanceurProspects} defaultProspectId={searchParams.prospect} />
        ) : (
          <p className="text-sm text-[#8FA69E]">
            Aucun prospect contacté disponible. Envoyez d&apos;abord des emails de prospection.
          </p>
        )}
      </div>

      {/* Veille Concurrence */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8FA69E] mb-3">
          Veille Concurrentielle
        </h2>
        <VeillePanel />
      </div>

      {/* Recent scans */}
      {recentScans.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8FA69E] mb-3">
            Scans récents
          </h2>
          <div className="app-panel overflow-x-auto">
            <table className="min-w-[620px] w-full text-sm">
              <thead>
                <tr className="border-b border-[#3EF2A0]/10 text-left text-xs text-[#8FA69E]">
                  <th className="px-4 py-2.5 font-medium">Profil</th>
                  <th className="px-4 py-2.5 font-medium">Statut</th>
                  <th className="px-4 py-2.5 font-medium">Marques</th>
                  <th className="px-4 py-2.5 font-medium">Durée</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.map((scan) => (
                  <tr
                    key={scan.id}
                    className="border-b border-white/[0.04] last:border-0"
                  >
                    <td className="px-4 py-2.5 text-white/80">
                      {scan.player.firstName} {scan.player.lastName}
                    </td>
                    <td className="px-4 py-2.5">
                      <ScanStatusBadge status={scan.status} />
                    </td>
                    <td className="px-4 py-2.5 font-mono text-white/50">
                      {scan.brandsFound ?? "—"} / {scan.brandsScored ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-white/50">
                      {scan.duration ? `${scan.duration}s` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-[#8FA69E]">
                      {scan.createdAt.toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ScanStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    running: { bg: "bg-[#DDFBEA]/10", text: "text-[#DDFBEA]" },
    completed: { bg: "bg-[#3EF2A0]/10", text: "text-[#3EF2A0]" },
    failed: { bg: "bg-red-500/10", text: "text-red-400" },
  };
  const c = config[status] || config.running;
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-mono text-[11px] capitalize ${c.bg} ${c.text}`}
    >
      {status}
    </span>
  );
}
