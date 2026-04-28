import { LucideIcon } from "lucide-react";

interface AgentCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  status: "active" | "inactive" | "coming_soon";
  color: string;
}

export function AgentCard({
  name,
  description,
  icon: Icon,
  status,
  color,
}: AgentCardProps) {
  const statusConfig = {
    active: { label: "Actif", bg: "bg-[#3EF2A0]/10", text: "text-[#3EF2A0]" },
    inactive: { label: "Inactif", bg: "bg-white/[0.06]", text: "text-[#8FA69E]" },
    coming_soon: { label: "Bientôt", bg: "bg-[#f59e0b]/10", text: "text-[#f59e0b]" },
  };

  const s = statusConfig[status];

  return (
    <div className="app-panel p-5">
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-mono font-medium ${s.bg} ${s.text}`}
        >
          {s.label}
        </span>
      </div>
      <h3 className="font-semibold text-white mb-1">{name}</h3>
      <p className="text-sm text-[#8FA69E] leading-relaxed">{description}</p>
    </div>
  );
}
