import { Building2 } from "lucide-react";
import { createCompany } from "@/lib/actions/companies";
import { CompanyForm } from "@/components/companies/CompanyForm";

export default function NewCompanyPage() {
  return (
    <div className="min-w-0">
      <div className="mb-6 flex items-center gap-3">
        <Building2 className="h-6 w-6 text-[#FF6B3D]" />
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#F6F4EF] sm:text-3xl">
          Nouvelle entreprise
        </h1>
      </div>
      <div className="app-panel p-4 sm:p-6">
        <CompanyForm action={createCompany} />
      </div>
    </div>
  );
}
