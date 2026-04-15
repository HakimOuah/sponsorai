import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Bot,
  Search,
  Target,
  ArrowDownRight,
  Mail,
} from "lucide-react";
import { getAnalyticsData } from "@/lib/actions/analytics";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  const maxFunnelCount = Math.max(...data.funnel.map((f) => f.count), 1);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-6 w-6 text-[#00d4aa]" />
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
      </div>

      {/* CA Overview */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <CACard
          label="CA Signé"
          value={data.ca.signed}
          color="text-[#00d4aa]"
          bg="bg-[#00d4aa]"
        />
        <CACard
          label="CA Pipeline"
          value={data.ca.pipeline}
          color="text-[#0088ff]"
          bg="bg-[#0088ff]"
        />
        <CACard
          label="CA Perdu"
          value={data.ca.lost}
          color="text-red-400"
          bg="bg-red-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Funnel */}
        <section>
          <SectionHeader icon={TrendingUp} label="Funnel Pipeline" color="text-[#00d4aa]" />
          <div className="rounded-xl border border-white/[0.06] bg-[#0c1019] p-4 space-y-2">
            {data.funnel.map((step) => (
              <FunnelRow
                key={step.stage}
                label={step.label}
                count={step.count}
                value={step.value}
                percentage={step.percentage}
                maxCount={maxFunnelCount}
                stage={step.stage}
              />
            ))}
          </div>
        </section>

        {/* Monthly CA */}
        <section>
          <SectionHeader icon={DollarSign} label="CA Mensuel" color="text-[#f59e0b]" />
          <div className="rounded-xl border border-white/[0.06] bg-[#0c1019] p-4">
            <div className="flex items-end gap-2 h-40">
              {data.monthlyCA.map((m) => {
                const maxVal = Math.max(
                  ...data.monthlyCA.map((x) => x.signed + x.pipeline),
                  1
                );
                const totalH = ((m.signed + m.pipeline) / maxVal) * 100;
                const signedH =
                  m.signed + m.pipeline > 0
                    ? (m.signed / (m.signed + m.pipeline)) * totalH
                    : 0;
                const pipeH = totalH - signedH;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col items-center justify-end h-32">
                      <div
                        className="w-full max-w-8 rounded-t bg-[#0088ff]/40"
                        style={{ height: `${pipeH}%` }}
                      />
                      <div
                        className="w-full max-w-8 rounded-b bg-[#00d4aa]"
                        style={{ height: `${signedH}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-white/30 font-mono">{m.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-xs text-white/40">
                <div className="h-2 w-2 rounded-sm bg-[#00d4aa]" />
                Signé
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/40">
                <div className="h-2 w-2 rounded-sm bg-[#0088ff]/40" />
                Pipeline
              </div>
            </div>
          </div>
        </section>

        {/* Response by player */}
        <section>
          <SectionHeader icon={Mail} label="Taux de réponse par joueur" color="text-[#8b5cf6]" />
          <div className="rounded-xl border border-white/[0.06] bg-[#0c1019] divide-y divide-white/[0.04]">
            {data.responseByPlayer.length === 0 ? (
              <EmptyState text="Aucune donnée email" />
            ) : (
              data.responseByPlayer.map((p) => (
                <div key={p.name} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-sm text-white/70 flex-1 truncate">
                    {p.name}
                  </span>
                  <span className="font-mono text-xs text-white/30">
                    {p.replied}/{p.sent}
                  </span>
                  <div className="w-20 h-1.5 rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-[#8b5cf6]"
                      style={{ width: `${p.rate}%` }}
                    />
                  </div>
                  <span className="font-mono text-sm font-bold text-white w-10 text-right">
                    {p.rate}%
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Response by sector */}
        <section>
          <SectionHeader icon={BarChart3} label="Taux de réponse par secteur" color="text-[#0088ff]" />
          <div className="rounded-xl border border-white/[0.06] bg-[#0c1019] divide-y divide-white/[0.04]">
            {data.responseBySector.length === 0 ? (
              <EmptyState text="Aucune donnée email" />
            ) : (
              data.responseBySector.slice(0, 8).map((s) => (
                <div key={s.sector} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-sm text-white/70 flex-1 truncate">
                    {s.sector}
                  </span>
                  <span className="font-mono text-xs text-white/30">
                    {s.replied}/{s.sent}
                  </span>
                  <div className="w-20 h-1.5 rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-[#0088ff]"
                      style={{ width: `${s.rate}%` }}
                    />
                  </div>
                  <span className="font-mono text-sm font-bold text-white w-10 text-right">
                    {s.rate}%
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Agent Performance */}
      <section className="mt-6">
        <SectionHeader icon={Bot} label="Performance Agents" color="text-[#00d4aa]" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <PerfCard
            icon={Search}
            label="Scans total"
            value={data.agentPerf.totalScans}
          />
          <PerfCard
            icon={Search}
            label="Scans OK"
            value={data.agentPerf.completedScans}
            color="text-[#00d4aa]"
          />
          <PerfCard
            icon={Target}
            label="Marques trouvées"
            value={data.agentPerf.totalBrandsFound}
          />
          <PerfCard
            icon={Target}
            label="Marques scorées"
            value={data.agentPerf.totalBrandsScored}
          />
          <PerfCard
            icon={ArrowDownRight}
            label="Conversion scan→deal"
            value={`${data.agentPerf.conversionRate}%`}
            color="text-[#f59e0b]"
          />
          <PerfCard
            icon={BarChart3}
            label="Durée moy."
            value={`${data.agentPerf.avgDuration}s`}
          />
        </div>
      </section>
    </div>
  );
}

/* ─── Sub-components ─── */

function SectionHeader({
  icon: Icon,
  label,
  color,
}: {
  icon: typeof BarChart3;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`h-4 w-4 ${color}`} />
      <h2 className="text-sm font-semibold uppercase tracking-wider text-white/30">
        {label}
      </h2>
    </div>
  );
}

function CACard({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0c1019] p-4">
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <p className={`font-mono text-xl font-bold ${color}`}>
        {value.toLocaleString("fr-FR")}€
      </p>
      <div className="mt-2 h-1 rounded-full bg-white/[0.06]">
        <div className={`h-full rounded-full ${bg} opacity-40`} style={{ width: "100%" }} />
      </div>
    </div>
  );
}

const funnelColors: Record<string, string> = {
  lead: "bg-gray-500",
  contacted: "bg-[#0088ff]",
  meeting: "bg-[#8b5cf6]",
  negotiation: "bg-[#f59e0b]",
  offer: "bg-[#f97316]",
  signed: "bg-[#00d4aa]",
  lost: "bg-red-400",
};

function FunnelRow({
  label,
  count,
  value,
  percentage,
  maxCount,
  stage,
}: {
  label: string;
  count: number;
  value: number;
  percentage: number;
  maxCount: number;
  stage: string;
}) {
  const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/50 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-6 rounded bg-white/[0.03] relative overflow-hidden">
        <div
          className={`h-full rounded ${funnelColors[stage] || "bg-white/20"} opacity-60 transition-all`}
          style={{ width: `${barWidth}%` }}
        />
        <span className="absolute inset-0 flex items-center px-2 text-xs font-mono text-white/70">
          {count}
        </span>
      </div>
      <span className="font-mono text-[10px] text-white/30 w-12 text-right shrink-0">
        {percentage}%
      </span>
      {value > 0 && (
        <span className="font-mono text-[10px] text-white/20 w-20 text-right shrink-0">
          {value.toLocaleString("fr-FR")}€
        </span>
      )}
    </div>
  );
}

function PerfCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0c1019] p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5 text-white/30" />
        <span className="text-[10px] text-white/40">{label}</span>
      </div>
      <span className={`font-mono text-lg font-bold ${color || "text-white"}`}>
        {value}
      </span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="px-4 py-8 text-center text-xs text-white/20">{text}</div>
  );
}
