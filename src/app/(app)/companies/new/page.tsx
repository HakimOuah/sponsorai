import { Building2 } from "lucide-react";
import { createCompany } from "@/lib/actions/companies";
import { CompanyForm } from "@/components/companies/CompanyForm";

export default function NewCompanyPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="h-6 w-6 text-[#00d4aa]" />
        <h1 className="text-2xl font-bold text-white">Nouvelle entreprise</h1>
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-[#0c1019] p-6">
        <CompanyForm action={createCompany} />
      </div>
    </div>
  );
}
