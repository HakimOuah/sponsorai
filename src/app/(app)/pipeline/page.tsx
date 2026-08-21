import { Kanban } from "lucide-react";
import { getDeals } from "@/lib/actions/deals";
import { KanbanBoard } from "@/components/pipeline/KanbanBoard";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const deals = await getDeals();

  return (
    <div className="min-w-0">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Kanban className="h-6 w-6 text-[#FF6B3D]" />
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#F6F4EF] sm:text-3xl">
            Pipeline
          </h1>
        </div>
      </div>

      <KanbanBoard initialDeals={deals} />
    </div>
  );
}
