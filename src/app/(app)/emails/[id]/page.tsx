import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { getEmail } from "@/lib/actions/emails";
import { EmailEditor } from "@/components/emails/EmailEditor";
import { VeilleurPanel } from "@/components/emails/VeilleurPanel";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function EmailDetailPage({ params }: Props) {
  const email = await getEmail(params.id);

  if (!email) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/emails"
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <div className="h-4 w-px bg-white/[0.08]" />
        <Mail className="h-5 w-5 text-[#00d4aa]" />
        <h1 className="text-lg font-bold text-white truncate">
          {email.subject}
        </h1>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-[#0c1019] p-6">
        <EmailEditor email={email} />
      </div>

      {/* Veilleur - only for sent emails */}
      {email.status === "sent" && (
        <div className="mt-6">
          <VeilleurPanel emailId={email.id} companyName={email.company.name} />
        </div>
      )}
    </div>
  );
}
