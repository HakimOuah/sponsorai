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
import Link from "next/link";
import { getDashboardData } from "@/lib/actions/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard className="h-6 w-6 text-[#00d4aa]" />
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      </div>

      {/* KPI Cards + Day Score */}
      <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-6">
        <KPICard
          icon={Users}
          label="Joueurs actifs"
          value={data.kpis.activePlayers}
          color="text-[#00d4aa]"
        />
        <KPICard
          icon={Building2}
          label="En pipeline"
          value={data.kpis.companiesInPipeline}
          color="text-[#0088ff]"
        />
        <KPICard
          icon={TrendingUp}
          label="Taux réponse"
          value={`${data.kpis.responseRate}%`}
          color="text-[#8b5cf6]"
        />
        <KPICard
          icon={DollarSign}
          label="CA signé"
          value={`${data.kpis.signedRevenue.toLocaleString("fr-FR")}€`}
          color="text-[#00d4aa]"
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
              <Target className="h-4 w-4 text-[#00d4aa]" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/30">
                Leads prioritaires
              </h2>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#0c1019] divide-y divide-white/[0.04]">
              {data.priorityProspects.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-white/20">
                  Aucun lead prioritaire en attente
                </div>
              ) : (
                data.priorityProspects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                        p.priority === "A"
                          ? "bg-[#00d4aa]/10 text-[#00d4aa]"
                          : "bg-[#0088ff]/10 text-[#0088ff]"
                      }`}
                    >
                      {p.priority}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {p.company.name}
                      </p>
                      <p className="text-xs text-white/40">
                        {p.player.firstName} {p.player.lastName}
                        {p.company.sector && ` · ${p.company.sector}`}
                      </p>
                    </div>
                    {p.score && (
                      <span className="font-mono text-sm text-white/50">
                        {p.score}/10
                      </span>
                    )}
                    {p.company.contactEmail ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#00d4aa] shrink-0" title="Contact disponible" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-white/10 shrink-0" title="Pas de contact" />
                    )}
                  </div>
                ))
              )}
              <Link
                href="/prospection"
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs text-white/30 hover:text-[#00d4aa] transition-colors"
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
                <RefreshCw className="h-4 w-4 text-[#ec4899]" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white/30">
                  Relances à faire
                </h2>
                <span className="rounded-full bg-[#ec4899]/10 px-2 py-0.5 font-mono text-[10px] text-[#ec4899]">
                  {data.pendingFollowups.length}
                </span>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-[#0c1019] divide-y divide-white/[0.04]">
                {data.pendingFollowups.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <RefreshCw className="h-4 w-4 shrink-0 text-[#ec4899]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {f.company.name}
                      </p>
                      <p className="text-xs text-white/40">
                        {f.player.firstName} {f.player.lastName}
                      </p>
                    </div>
                    <span className="font-mono text-xs text-[#ec4899] shrink-0">
                      {f.daysSince}j sans réponse
                    </span>
                    <Link
                      href={`/agents?prospect=${f.id}#relanceur`}
                      className="rounded-lg bg-[#ec4899]/10 px-2.5 py-1 text-[11px] font-medium text-[#ec4899] hover:bg-[#ec4899]/20 transition-colors shrink-0"
                    >
                      Relancer
                    </Link>
                  </div>
                ))}
                <Link
                  href="/agents#relanceur"
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs text-white/30 hover:text-[#ec4899] transition-colors"
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
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/30">
                Actions requises
              </h2>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#0c1019] divide-y divide-white/[0.04]">
              {data.overdueActions.length === 0 && data.draftEmails === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-white/20">
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
                        <p className="text-xs text-white/40">
                          {deal.company.name} · {deal.player.firstName}{" "}
                          {deal.player.lastName}
                        </p>
                      </div>
                      <span className="font-mono text-[10px] text-red-400 shrink-0">
                        {deal.nextActionDate &&
                          new Date(deal.nextActionDate).toLocaleDateString(
                            "fr-FR",
                            { day: "numeric", month: "short" }
                          )}
                      </span>
                    </div>
                  ))}
                  {data.draftEmails > 0 && (
                    <Link
                      href="/emails?status=draft"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <Mail className="h-4 w-4 shrink-0 text-[#0088ff]" />
                      <div className="flex-1">
                        <p className="text-sm text-white/80">
                          {data.draftEmails} brouillon{data.draftEmails > 1 ? "s" : ""} à envoyer
                        </p>
                      </div>
                      <ArrowRight className="h-3 w-3 text-white/20" />
                    </Link>
                  )}
                </>
              )}
              <Link
                href="/pipeline"
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs text-white/30 hover:text-[#f59e0b] transition-colors"
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
            <Zap className="h-4 w-4 text-[#8b5cf6]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/30">
              Activité récente
            </h2>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-[#0c1019]">
            {data.recentActivity.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-white/20">
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
                      <p className="text-sm text-white/70">{activity.message}</p>
                      <p className="text-xs text-white/30 mt-0.5">
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
    <div className="rounded-xl border border-white/[0.06] bg-[#0c1019] p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-white/40">{label}</span>
      </div>
      <span className="font-mono text-xl font-bold text-white">{value}</span>
    </div>
  );
}

function DayScoreCard({ score }: { score: number }) {
  const color =
    score >= 70
      ? "text-[#00d4aa]"
      : score >= 40
        ? "text-[#f59e0b]"
        : "text-white/40";
  const bg =
    score >= 70
      ? "bg-[#00d4aa]"
      : score >= 40
        ? "bg-[#f59e0b]"
        : "bg-white/20";

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0c1019] p-4">
      <div className="flex items-center gap-2 mb-2">
        <Zap className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-white/40">Score du jour</span>
      </div>
      <div className="flex items-end gap-2">
        <span className={`font-mono text-xl font-bold ${color}`}>{score}</span>
        <span className="text-xs text-white/20 mb-0.5">/100</span>
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
    scan_completed: { icon: Target, color: "text-[#00d4aa]" },
    email_sent: { icon: Mail, color: "text-[#0088ff]" },
    deal_updated: { icon: TrendingUp, color: "text-[#f59e0b]" },
    reply_received: { icon: Mail, color: "text-[#8b5cf6]" },
  };
  const c = config[type] || { icon: Zap, color: "text-white/30" };
  const Icon = c.icon;
  return <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${c.color}`} />;
}
