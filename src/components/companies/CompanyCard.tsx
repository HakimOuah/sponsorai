import Link from "next/link";
import { Globe, MapPin } from "lucide-react";
import type { Company } from "@prisma/client";

interface CompanyCardProps {
  company: Company & {
    _count: {
      prospects: number;
      deals: number;
      emails: number;
    };
  };
}

export function CompanyCard({ company }: CompanyCardProps) {
  const initial = company.name.charAt(0).toUpperCase();

  const sourceColors: Record<string, string> = {
    scout: "bg-[#00d4aa]/10 text-[#00d4aa]",
    manual: "bg-[#0088ff]/10 text-[#0088ff]",
    import: "bg-[#f59e0b]/10 text-[#f59e0b]",
  };

  return (
    <Link
      href={`/companies/${company.id}`}
      className="group rounded-xl border border-white/[0.06] bg-[#0c1019] p-5 transition-all hover:border-white/[0.12] hover:bg-[#0e1220]"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#0088ff]/10 text-[#0088ff] font-semibold text-lg">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{company.name}</h3>
          <div className="flex items-center gap-2 mt-0.5 text-sm text-white/40">
            {company.sector && <span>{company.sector}</span>}
            {company.country && (
              <>
                <MapPin className="h-3 w-3" />
                <span>{company.country}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {company.source && (
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${sourceColors[company.source] || sourceColors.manual}`}
          >
            {company.source}
          </span>
        )}
        {company.website && (
          <span className="flex items-center gap-1 text-white/20">
            <Globe className="h-3 w-3" />
          </span>
        )}
        {company.contactEmail && (
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[11px] text-white/40">
            contact
          </span>
        )}
      </div>

      {/* Counts */}
      <div className="mt-3 flex items-center gap-2 border-t border-white/[0.06] pt-3">
        {company._count.prospects > 0 && (
          <span className="rounded-full bg-[#0088ff]/10 px-2 py-0.5 font-mono text-[11px] text-[#0088ff]">
            {company._count.prospects} prospect{company._count.prospects > 1 ? "s" : ""}
          </span>
        )}
        {company._count.deals > 0 && (
          <span className="rounded-full bg-[#00d4aa]/10 px-2 py-0.5 font-mono text-[11px] text-[#00d4aa]">
            {company._count.deals} deal{company._count.deals > 1 ? "s" : ""}
          </span>
        )}
        {company._count.emails > 0 && (
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[11px] text-white/40">
            {company._count.emails} email{company._count.emails > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </Link>
  );
}
