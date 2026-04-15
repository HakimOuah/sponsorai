import { Radar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { VeilleHistory } from "@/components/veille/VeilleHistory";

export const dynamic = "force-dynamic";

export default async function VeillePage() {
  const runs = await prisma.veilleRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Radar className="h-6 w-6 text-[#a855f7]" />
        <h1 className="text-2xl font-bold text-white">Veille Concurrentielle</h1>
        <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 font-mono text-xs text-white/40">
          {runs.length} run{runs.length !== 1 ? "s" : ""}
        </span>
      </div>

      <VeilleHistory initialRuns={runs} />
    </div>
  );
}
