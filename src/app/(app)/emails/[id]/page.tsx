import { notFound } from "next/navigation";
import Link from "@/components/layout/NavigationLink";
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
    <div className="min-w-0">
      <div className="mb-6 flex min-w-0 flex-wrap items-center gap-3">
        <Link
          href="/emails"
          className="flex items-center gap-1.5 text-sm text-[#969BA8] hover:text-white/60 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <div className="h-4 w-px bg-white/[0.08]" />
        <Mail className="h-5 w-5 text-[#FF6B3D]" />
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-white sm:text-lg">
          {email.subject}
        </h1>
      </div>

      <div className="app-panel p-4 sm:p-6">
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
