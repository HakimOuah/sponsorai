"use client";

import Link from "next/link";
import { Mail, Send, Eye, MessageSquare, AlertTriangle, FileText } from "lucide-react";

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

const statusConfig: Record<string, { icon: typeof Mail; color: string; label: string }> = {
  draft: { icon: FileText, color: "text-[#8FA69E]", label: "Brouillon" },
  sent: { icon: Send, color: "text-[#DDFBEA]", label: "Envoyé" },
  opened: { icon: Eye, color: "text-[#DDFBEA]", label: "Ouvert" },
  replied: { icon: MessageSquare, color: "text-[#3EF2A0]", label: "Répondu" },
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
      className="flex items-center gap-4 border-b border-white/[0.04] px-4 py-3 hover:bg-white/[0.02] transition-colors last:border-0"
    >
      <Icon className={`h-4 w-4 shrink-0 ${config.color}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">
            {email.subject}
          </span>
          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-[#8FA69E] shrink-0">
            {typeLabels[email.type] || email.type}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#8FA69E]">
          <span>{email.company.name}</span>
          {email.prospect && (
            <>
              <span>·</span>
              <span>
                {email.prospect.player.firstName} {email.prospect.player.lastName}
              </span>
            </>
          )}
        </div>
      </div>

      <span className={`rounded-full px-2 py-0.5 text-[11px] font-mono shrink-0 ${statusBg(email.status)}`}>
        {config.label}
      </span>

      <span className="text-xs text-[#8FA69E] shrink-0 w-24 text-right font-mono">
        {(email.sentAt || email.createdAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        })}
      </span>
    </Link>
  );
}

function statusBg(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-white/[0.06] text-white/50",
    sent: "bg-[#DDFBEA]/10 text-[#DDFBEA]",
    opened: "bg-[#DDFBEA]/10 text-[#DDFBEA]",
    replied: "bg-[#3EF2A0]/10 text-[#3EF2A0]",
    bounced: "bg-red-500/10 text-red-400",
  };
  return colors[status] || colors.draft;
}
