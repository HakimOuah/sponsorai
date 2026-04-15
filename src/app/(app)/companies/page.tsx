import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { getCompanies, getCompanyFilters } from "@/lib/actions/companies";
import { CompanyCard } from "@/components/companies/CompanyCard";
import { CompanyFilters } from "@/components/companies/CompanyFilters";

export const dynamic = "force-dynamic";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: { sector?: string; country?: string; source?: string; search?: string };
}) {
  const [companies, filters] = await Promise.all([
    getCompanies(searchParams),
    getCompanyFilters(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-[#00d4aa]" />
          <h1 className="text-2xl font-bold text-white">Entreprises</h1>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 font-mono text-xs text-white/40">
            {companies.length}
          </span>
        </div>
        <Link
          href="/companies/new"
          className="flex items-center gap-2 rounded-lg bg-[#00d4aa] px-4 py-2 text-sm font-semibold text-[#07090f] hover:bg-[#00e4ba] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <CompanyFilters sectors={filters.sectors} countries={filters.countries} />
      </div>

      {companies.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-[#0c1019] p-12 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-white/10" />
          <p className="text-white/40 mb-4">Aucune entreprise trouvée</p>
          <Link
            href="/companies/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#00d4aa] px-4 py-2 text-sm font-semibold text-[#07090f] hover:bg-[#00e4ba] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter la première entreprise
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}
