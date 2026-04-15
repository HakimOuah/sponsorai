import { Kanban } from "lucide-react";
import { getDeals } from "@/lib/actions/deals";
import { KanbanBoard } from "@/components/pipeline/KanbanBoard";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const deals = await getDeals();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Kanban className="h-6 w-6 text-[#00d4aa]" />
          <h1 className="text-2xl font-bold text-white">Pipeline</h1>
        </div>
      </div>

      <KanbanBoard initialDeals={deals} />
    </div>
  );
}
