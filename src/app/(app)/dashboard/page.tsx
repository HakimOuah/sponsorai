import {
  LayoutDashboard,
  Users,
  Building2,
  TrendingUp,
  DollarSign,
  Zap,
  AlertTriangle,
  ArrowRight,
  Clock,
  Mail,
  Target,
  RefreshCw,
} from "lucide-react";
import Link from "@/components/layout/NavigationLink";
import { getDashboardData } from "@/lib/actions/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="min-w-0">
      <div className="mb-6 flex items-start gap-3 sm:mb-8 sm:items-center">
        <span className="app-title-icon">
          <LayoutDashboard className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#F6F4EF] sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-[#969BA8]">
            Vue de contrôle des leads, relances et signaux commerciaux.
          </p>
        </div>
      </div>

      {/* KPI Cards + Day Score */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:mb-8 xl:grid-cols-6">
        <KPICard
          icon={Users}
          label="Profils actifs"
          value={data.kpis.activePlayers}
          color="text-[#FF6B3D]"
        />
        <KPICard
          icon={Building2}
          label="En pipeline"
          value={data.kpis.companiesInPipeline}
          color="text-[#C8CEFF]"
        />
        <KPICard
          icon={TrendingUp}
          label="Taux réponse"
          value={`${data.kpis.responseRate}%`}
          color="text-[#C8CEFF]"
        />
        <KPICard
          icon={DollarSign}
          label="CA signé"
          value={`${data.kpis.signedRevenue.toLocaleString("fr-FR")}€`}
          color="text-[#FF6B3D]"
        />
        <KPICard
          icon={DollarSign}
          label="CA pipeline"
          value={`${data.kpis.pipelineRevenue.toLocaleString("fr-FR")}€`}
          color="text-[#f59e0b]"
        />
        <DayScoreCard score={data.dayScore} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* Priority leads */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-[#FF6B3D]" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#969BA8]">
                Leads prioritaires
              </h2>
            </div>
            <div className="app-panel divide-y divide-white/[0.04]">
              {data.priorityProspects.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-[#969BA8]/55">
                  Aucun lead prioritaire en attente
                </div>
              ) : (
                data.priorityProspects.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                        p.priority === "A"
                          ? "bg-[#FF6B3D]/10 text-[#FF6B3D]"
                          : "bg-[#C8CEFF]/10 text-[#C8CEFF]"
                      }`}
                    >
                      {p.priority}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {p.company.name}
                      </p>
                      <p className="text-xs text-[#969BA8]">
                        {p.player.firstName} {p.player.lastName}
                        {p.company.sector && ` · ${p.company.sector}`}
                      </p>
                    </div>
                    {p.score && (
                      <span className="font-mono text-sm text-white/50">
                        {p.score}/10
                      </span>
                    )}
                    {p.company.outreachReady ? (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[#FF6B3D] shrink-0"
                        title="Contact disponible"
                      />
                    ) : (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-white/10 shrink-0"
                        title="Pas de contact"
                      />
                    )}
                  </div>
                ))
              )}
              <Link
                href="/prospection"
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs text-[#969BA8] hover:text-[#FF6B3D] transition-colors"
              >
                Voir tous les prospects
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </section>

          {/* Relances à faire */}
          {data.pendingFollowups.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="h-4 w-4 text-[#f59e0b]" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#969BA8]">
                  Relances à faire
                </h2>
                <span className="rounded-full bg-[#f59e0b]/10 px-2 py-0.5 font-mono text-[10px] text-[#f59e0b]">
                  {data.pendingFollowups.length}
                </span>
              </div>
              <div className="app-panel divide-y divide-white/[0.04]">
                {data.pendingFollowups.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                    <RefreshCw className="h-4 w-4 shrink-0 text-[#f59e0b]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {f.company.name}
                      </p>
                      <p className="text-xs text-[#969BA8]">
                        {f.player.firstName} {f.player.lastName}
                      </p>
                    </div>
                    <span className="font-mono text-xs text-[#f59e0b] shrink-0">
                      {f.daysSince}j sans réponse
                    </span>
                    <Link
                      href={`/agents?prospect=${f.id}#relanceur`}
                      className="rounded-lg bg-[#f59e0b]/10 px-2.5 py-1 text-[11px] font-medium text-[#f59e0b] hover:bg-[#f59e0b]/20 transition-colors shrink-0"
                    >
                      Relancer
                    </Link>
                  </div>
                ))}
                <Link
                  href="/agents#relanceur"
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs text-[#969BA8] hover:text-[#f59e0b] transition-colors"
                >
                  Voir le relanceur
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </section>
          )}

          {/* Actions requises */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#969BA8]">
                Actions requises
              </h2>
            </div>
            <div className="app-panel divide-y divide-white/[0.04]">
              {data.overdueActions.length === 0 && data.draftEmails === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-[#969BA8]/55">
                  Aucune action en attente
                </div>
              ) : (
                <>
                  {data.overdueActions.map((deal) => (
                    <div
                      key={deal.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <Clock className="h-4 w-4 shrink-0 text-red-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 truncate">
                          {deal.nextAction || "Action à définir"}
                        </p>
                        <p className="text-xs text-[#969BA8]">
                          {deal.company.name} · {deal.player.firstName}{" "}
                          {deal.player.lastName}
                        </p>
                      </div>
                      <span className="font-mono text-[10px] text-red-400 shrink-0">
                        {deal.nextActionDate &&
                          new Date(deal.nextActionDate).toLocaleDateString(
                            "fr-FR",
                            { day: "numeric", month: "short" },
                          )}
                      </span>
                    </div>
                  ))}
                  {data.draftEmails > 0 && (
                    <Link
                      href="/emails?status=draft"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <Mail className="h-4 w-4 shrink-0 text-[#C8CEFF]" />
                      <div className="flex-1">
                        <p className="text-sm text-white/80">
                          {data.draftEmails} brouillon
                          {data.draftEmails > 1 ? "s" : ""} à envoyer
                        </p>
                      </div>
                      <ArrowRight className="h-3 w-3 text-[#969BA8]/55" />
                    </Link>
                  )}
                </>
              )}
              <Link
                href="/pipeline"
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs text-[#969BA8] hover:text-[#f59e0b] transition-colors"
              >
                Voir le pipeline
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </section>
        </div>

        {/* Right column: Activity */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-[#C8CEFF]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#969BA8]">
              Activité récente
            </h2>
          </div>
          <div className="app-panel">
            {data.recentActivity.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-[#969BA8]/55">
                Aucune activité récente
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {data.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 px-4 py-3"
                  >
                    <ActivityIcon type={activity.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/70">
                        {activity.message}
                      </p>
                      <p className="text-xs text-[#969BA8] mt-0.5">
                        {activity.createdAt.toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function KPICard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="app-panel p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FF6B3D]/20">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-[#969BA8]">{label}</span>
      </div>
      <span className="font-mono text-xl font-bold text-[#F6F4EF]">
        {value}
      </span>
    </div>
  );
}

function DayScoreCard({ score }: { score: number }) {
  const color =
    score >= 70
      ? "text-[#FF6B3D]"
      : score >= 40
        ? "text-[#f59e0b]"
        : "text-[#969BA8]";
  const bg =
    score >= 70 ? "bg-[#FF6B3D]" : score >= 40 ? "bg-[#f59e0b]" : "bg-white/20";

  return (
    <div className="app-panel p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FF6B3D]/20">
      <div className="flex items-center gap-2 mb-2">
        <Zap className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-[#969BA8]">Score du jour</span>
      </div>
      <div className="flex items-end gap-2">
        <span className={`font-mono text-xl font-bold ${color}`}>{score}</span>
        <span className="text-xs text-[#969BA8]/55 mb-0.5">/100</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full ${bg} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const config: Record<string, { icon: typeof Zap; color: string }> = {
    scan_completed: { icon: Target, color: "text-[#FF6B3D]" },
    email_sent: { icon: Mail, color: "text-[#C8CEFF]" },
    deal_updated: { icon: TrendingUp, color: "text-[#f59e0b]" },
    reply_received: { icon: Mail, color: "text-[#C8CEFF]" },
  };
  const c = config[type] || { icon: Zap, color: "text-[#969BA8]" };
  const Icon = c.icon;
  return <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${c.color}`} />;
}
