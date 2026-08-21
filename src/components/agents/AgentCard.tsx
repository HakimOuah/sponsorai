import Image from "next/image";
import { LucideIcon } from "lucide-react";

interface AgentCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  avatar: string;
  status: "active" | "inactive" | "coming_soon";
  color: string;
}

export function AgentCard({
  name,
  description,
  icon: Icon,
  avatar,
  status,
  color,
}: AgentCardProps) {
  const statusConfig = {
    active: { label: "Actif", bg: "bg-[#FF6B3D]/10", text: "text-[#FF6B3D]" },
    inactive: {
      label: "Inactif",
      bg: "bg-white/[0.06]",
      text: "text-[#969BA8]",
    },
    coming_soon: {
      label: "Bientôt",
      bg: "bg-[#f59e0b]/10",
      text: "text-[#f59e0b]",
    },
  };

  const s = statusConfig[status];

  return (
    <div className="app-panel group overflow-hidden p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#FF6B3D]/20">
      <div className="flex items-start gap-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#0B0908] shadow-[0_16px_40px_rgba(0,0,0,0.24)]">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: `radial-gradient(circle at 50% 70%, ${color}40, transparent 68%)`,
            }}
            aria-hidden="true"
          />
          <Image
            src={avatar}
            alt={`Avatar 3D de l'agent ${name}`}
            fill
            sizes="96px"
            className="object-cover object-top transition duration-500 group-hover:scale-[1.04]"
          />
          <span
            className="absolute bottom-2 left-2 flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.10] bg-black/55 backdrop-blur-md"
            aria-hidden="true"
          >
            <Icon className="h-3.5 w-3.5" style={{ color }} />
          </span>
        </div>

        <div className="min-w-0 flex-1 pt-1">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-mono font-medium ${s.bg} ${s.text}`}
          >
            {s.label}
          </span>
          <h3 className="mt-3 font-semibold text-white">{name}</h3>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-white/35">
            Intelligence spécialisée
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-[#969BA8]">
        {description}
      </p>
    </div>
  );
}
