import { notFound } from "next/navigation";
import Link from "@/components/layout/NavigationLink";
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
  const editableCompany = {
    id: company.id,
    name: company.name,
    sector: company.sector,
    country: company.country,
    website: company.website,
    description: company.description,
    existingSportsSponsoring: company.existingSportsSponsoring,
    estimatedBudget: company.estimatedBudget,
    employeeCount: company.employeeCount,
    companySizeBucket: company.companySizeBucket,
    notes: company.notes,
    source: company.source,
  };

  return (
    <div className="min-w-0">
      <Link
        href={`/companies/${company.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#969BA8] hover:text-white/70 transition-colors mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {company.name}
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <Building2 className="h-6 w-6 text-[#FF6B3D]" />
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#F6F4EF] sm:text-3xl">
          Modifier l&apos;entreprise
        </h1>
      </div>

      <div className="app-panel p-4 sm:p-6">
        <CompanyForm action={updateAction} company={editableCompany} />
      </div>
    </div>
  );
}
