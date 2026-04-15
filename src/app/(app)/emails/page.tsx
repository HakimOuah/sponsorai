import { Mail, FileText, Send, MessageSquare } from "lucide-react";
import { getEmails } from "@/lib/actions/emails";
import { prisma } from "@/lib/prisma";
import { EmailFilters } from "@/components/emails/EmailFilters";
import { EmailRow } from "@/components/emails/EmailRow";
import { DispatcherPanel } from "@/components/emails/DispatcherPanel";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: { status?: string };
}

export default async function EmailsPage({ searchParams }: Props) {
  const filters = searchParams.status ? { status: searchParams.status } : undefined;
  const emails = await getEmails(filters);

  const allEmails = await getEmails();
  const stats = {
    total: allEmails.length,
    drafts: allEmails.filter((e) => e.status === "draft").length,
    sent: allEmails.filter((e) => e.status === "sent").length,
    replied: allEmails.filter((e) => e.status === "replied").length,
  };

  // Drafts for dispatcher
  const draftEmails = await prisma.email.findMany({
    where: { status: "draft" },
    select: {
      id: true,
      subject: true,
      company: { select: { name: true, contactEmail: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Mail className="h-6 w-6 text-[#00d4aa]" />
          <h1 className="text-2xl font-bold text-white">Emails</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard icon={Mail} label="Total" value={stats.total} color="text-white/60" />
        <StatCard icon={FileText} label="Brouillons" value={stats.drafts} color="text-white/40" />
        <StatCard icon={Send} label="Envoyés" value={stats.sent} color="text-[#0088ff]" />
        <StatCard icon={MessageSquare} label="Répondu" value={stats.replied} color="text-[#00d4aa]" />
      </div>

      {/* Dispatcher */}
      {draftEmails.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/30 mb-3">
            Dispatcher — Envoi en masse
          </h2>
          <DispatcherPanel draftEmails={draftEmails} />
        </div>
      )}

      {/* Filters */}
      <div className="mb-4">
        <EmailFilters />
      </div>

      {/* Email list */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0c1019] overflow-hidden">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/20">
            <Mail className="h-8 w-8 mb-2" />
            <p className="text-sm">Aucun email</p>
            <p className="text-xs mt-1">
              Générez des emails depuis la page Prospection
            </p>
          </div>
        ) : (
          emails.map((email) => <EmailRow key={email.id} email={email} />)
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Mail;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0c1019] p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <span className="text-xs text-white/40">{label}</span>
      </div>
      <span className="font-mono text-lg font-bold text-white">{value}</span>
    </div>
  );
}
