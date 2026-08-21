import Link from "next/link";
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
    scout: "bg-[#3EF2A0]/10 text-[#3EF2A0]",
    manual: "bg-[#DDFBEA]/10 text-[#DDFBEA]",
    import: "bg-[#f59e0b]/10 text-[#f59e0b]",
  };

  return (
    <Link
      href={`/companies/${company.id}`}
      className="group rounded-[28px] border border-white/[0.10] bg-[#061511]/85 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-[#3EF2A0]/35 hover:bg-[#082019]"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#DDFBEA]/15 bg-[#DDFBEA]/10 text-lg font-semibold text-[#DDFBEA]">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="truncate font-semibold text-[#F8FAF7]">{company.name}</h3>
          <div className="mt-0.5 flex items-center gap-2 text-sm text-[#8FA69E]">
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
            <span className="flex items-center gap-1 text-[#8FA69E]/55">
            <Globe className="h-3 w-3" />
          </span>
        )}
        {company.outreachReady && (
          <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${company.outreachReady ? "bg-[#3EF2A0]/10 text-[#3EF2A0]" : "bg-[#f59e0b]/10 text-[#f59e0b]"}`}>
            contact vérifié
          </span>
        )}
      </div>

      {/* Counts */}
      <div className="mt-3 flex items-center gap-2 border-t border-[#3EF2A0]/10 pt-3">
        {company._count.prospects > 0 && (
          <span className="rounded-full bg-[#DDFBEA]/10 px-2 py-0.5 font-mono text-[11px] text-[#DDFBEA]">
            {company._count.prospects} prospect{company._count.prospects > 1 ? "s" : ""}
          </span>
        )}
        {company._count.deals > 0 && (
          <span className="rounded-full bg-[#3EF2A0]/10 px-2 py-0.5 font-mono text-[11px] text-[#3EF2A0]">
            {company._count.deals} deal{company._count.deals > 1 ? "s" : ""}
          </span>
        )}
        {company._count.emails > 0 && (
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[11px] text-[#D8DEDA]/60">
            {company._count.emails} email{company._count.emails > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </Link>
  );
}
