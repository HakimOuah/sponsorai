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
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="app-title-icon">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#F8FAF7]">
                Entreprises
              </h1>
              <span className="rounded-full border border-[#3EF2A0]/15 bg-[#3EF2A0]/10 px-2.5 py-0.5 font-mono text-xs text-[#3EF2A0]">
                {companies.length}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#8FA69E]">
              Marques qualifiées, contacts et historique des opportunités.
            </p>
          </div>
        </div>
        <Link
          href="/companies/new"
          className="flex items-center gap-2 rounded-full bg-[#F8FAF7] px-4 py-2 text-sm font-semibold text-[#020403] shadow-[0_14px_38px_rgba(62,242,160,0.12)] transition-all hover:-translate-y-0.5 hover:bg-white"
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
        <div className="app-panel p-12 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-white/10" />
          <p className="text-[#8FA69E] mb-4">Aucune entreprise trouvée</p>
          <Link
            href="/companies/new"
            className="inline-flex items-center gap-2 rounded-full bg-[#F8FAF7] px-4 py-2 text-sm font-semibold text-[#020403] transition-all hover:-translate-y-0.5 hover:bg-white"
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
