import { Building2 } from "lucide-react";
import { createCompany } from "@/lib/actions/companies";
import { CompanyForm } from "@/components/companies/CompanyForm";

export default function NewCompanyPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="h-6 w-6 text-[#3EF2A0]" />
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#F8FAF7]">Nouvelle entreprise</h1>
      </div>
      <div className="app-panel p-6">
        <CompanyForm action={createCompany} />
      </div>
    </div>
  );
}
