"use client";

import Link from "@/components/layout/NavigationLink";
import {
  Mail,
  Send,
  Eye,
  MessageSquare,
  AlertTriangle,
  FileText,
} from "lucide-react";

interface EmailRowProps {
  email: {
    id: string;
    type: string;
    subject: string;
    status: string;
    sentAt: Date | null;
    createdAt: Date;
    company: { name: string };
    prospect: {
      player: { firstName: string; lastName: string };
    } | null;
  };
}

const statusConfig: Record<
  string,
  { icon: typeof Mail; color: string; label: string }
> = {
  draft: { icon: FileText, color: "text-[#969BA8]", label: "Brouillon" },
  sent: { icon: Send, color: "text-[#C8CEFF]", label: "Envoyé" },
  opened: { icon: Eye, color: "text-[#C8CEFF]", label: "Ouvert" },
  replied: { icon: MessageSquare, color: "text-[#FF6B3D]", label: "Répondu" },
  bounced: { icon: AlertTriangle, color: "text-red-400", label: "Bounced" },
};

const typeLabels: Record<string, string> = {
  first_contact: "1er contact",
  followup_1: "Relance 1",
  followup_2: "Relance 2",
  reply: "Réponse",
  custom: "Custom",
};

export function EmailRow({ email }: EmailRowProps) {
  const config = statusConfig[email.status] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <Link
      href={`/emails/${email.id}`}
      className="flex flex-col gap-2 border-b border-white/[0.04] px-4 py-3 transition-colors last:border-0 hover:bg-white/[0.02] sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="flex min-w-0 items-start gap-3 sm:flex-1">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.color}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">
              {email.subject}
            </span>
            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-[#969BA8] shrink-0">
              {typeLabels[email.type] || email.type}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#969BA8]">
            <span>{email.company.name}</span>
            {email.prospect && (
              <>
                <span>·</span>
                <span>
                  {email.prospect.player.firstName}{" "}
                  {email.prospect.player.lastName}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="ml-7 flex items-center justify-between gap-3 sm:ml-0 sm:shrink-0">
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-mono ${statusBg(email.status)}`}
        >
          {config.label}
        </span>

        <span className="w-20 shrink-0 text-right font-mono text-xs text-[#969BA8] sm:w-24">
          {(email.sentAt || email.createdAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>
    </Link>
  );
}

function statusBg(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-white/[0.06] text-white/50",
    sent: "bg-[#C8CEFF]/10 text-[#C8CEFF]",
    opened: "bg-[#C8CEFF]/10 text-[#C8CEFF]",
    replied: "bg-[#FF6B3D]/10 text-[#FF6B3D]",
    bounced: "bg-red-500/10 text-red-400",
  };
  return colors[status] || colors.draft;
}
