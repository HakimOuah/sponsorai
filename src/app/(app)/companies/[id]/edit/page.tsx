import { notFound } from "next/navigation";
import Link from "next/link";
import { Building2, ArrowLeft } from "lucide-react";
import { getCompany, updateCompany } from "@/lib/actions/companies";
import { CompanyForm } from "@/components/companies/CompanyForm";

export const dynamic = "force-dynamic";

export default async function EditCompanyPage({
  params,
}: {
  params: { id: string };
}) {
  const company = await getCompany(params.id);
  if (!company) return notFound();

  const updateAction = updateCompany.bind(null, company.id);

  return (
    <div>
      <Link
        href={`/companies/${company.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#8FA69E] hover:text-white/70 transition-colors mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {company.name}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <Building2 className="h-6 w-6 text-[#3EF2A0]" />
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#F8FAF7]">Modifier l&apos;entreprise</h1>
      </div>

      <div className="app-panel p-6">
        <CompanyForm action={updateAction} company={company} />
      </div>
    </div>
  );
}
