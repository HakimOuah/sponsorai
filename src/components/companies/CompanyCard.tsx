import Link from "@/components/layout/NavigationLink";
import { Globe, MapPin } from "lucide-react";
interface CompanyCardProps {
  company: {
    id: string;
    name: string;
    sector: string | null;
    country: string | null;
    website: string | null;
    source: string | null;
    outreachReady: boolean;
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
    scout: "bg-[#FF6B3D]/10 text-[#FF6B3D]",
    manual: "bg-[#C8CEFF]/10 text-[#C8CEFF]",
    import: "bg-[#f59e0b]/10 text-[#f59e0b]",
  };

  return (
    <Link
      href={`/companies/${company.id}`}
      className="group rounded-[28px] border border-white/[0.10] bg-[#141720]/85 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-[#FF6B3D]/35 hover:bg-[#1A1E2A]"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#C8CEFF]/15 bg-[#C8CEFF]/10 text-lg font-semibold text-[#C8CEFF]">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="truncate font-semibold text-[#F6F4EF]">
            {company.name}
          </h3>
          <div className="mt-0.5 flex items-center gap-2 text-sm text-[#969BA8]">
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
          <span className="flex items-center gap-1 text-[#969BA8]/55">
            <Globe className="h-3 w-3" />
          </span>
        )}
        {company.outreachReady && (
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${company.outreachReady ? "bg-[#FF6B3D]/10 text-[#FF6B3D]" : "bg-[#f59e0b]/10 text-[#f59e0b]"}`}
          >
            contact vérifié
          </span>
        )}
      </div>

      {/* Counts */}
      <div className="mt-3 flex items-center gap-2 border-t border-[#FF6B3D]/10 pt-3">
        {company._count.prospects > 0 && (
          <span className="rounded-full bg-[#C8CEFF]/10 px-2 py-0.5 font-mono text-[11px] text-[#C8CEFF]">
            {company._count.prospects} prospect
            {company._count.prospects > 1 ? "s" : ""}
          </span>
        )}
        {company._count.deals > 0 && (
          <span className="rounded-full bg-[#FF6B3D]/10 px-2 py-0.5 font-mono text-[11px] text-[#FF6B3D]">
            {company._count.deals} deal{company._count.deals > 1 ? "s" : ""}
          </span>
        )}
        {company._count.emails > 0 && (
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[11px] text-[#D5D7DF]/60">
            {company._count.emails} email{company._count.emails > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </Link>
  );
}
