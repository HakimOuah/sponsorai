"use client";

import { useSearchParams } from "next/navigation";
import { useNavigationRouter as useRouter } from "@/components/layout/NavigationProvider";
import { Search } from "lucide-react";

interface CompanyFiltersProps {
  sectors: string[];
  countries: string[];
}

export function CompanyFilters({ sectors, countries }: CompanyFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/companies?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_auto_auto_auto]">
      {/* Search */}
      <div className="relative min-w-0 sm:col-span-2 xl:col-span-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#969BA8]/55" />
        <input
          type="text"
          placeholder="Rechercher..."
          defaultValue={searchParams.get("search") || ""}
          onChange={(e) => update("search", e.target.value)}
          className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.045] pl-9 pr-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#FF6B3D]/50 focus:outline-none transition-colors"
        />
      </div>

      {/* Sector */}
      <select
        defaultValue={searchParams.get("sector") || ""}
        onChange={(e) => update("sector", e.target.value)}
        className="w-full rounded-full border border-white/[0.10] bg-white/[0.045] px-3 py-2.5 text-sm text-white focus:border-[#FF6B3D]/50 focus:outline-none transition-colors xl:w-auto xl:py-2"
      >
        <option value="">Tous secteurs</option>
        {sectors.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* Country */}
      <select
        defaultValue={searchParams.get("country") || ""}
        onChange={(e) => update("country", e.target.value)}
        className="w-full rounded-full border border-white/[0.10] bg-white/[0.045] px-3 py-2.5 text-sm text-white focus:border-[#FF6B3D]/50 focus:outline-none transition-colors xl:w-auto xl:py-2"
      >
        <option value="">Tous pays</option>
        {countries.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {/* Source */}
      <select
        defaultValue={searchParams.get("source") || ""}
        onChange={(e) => update("source", e.target.value)}
        className="w-full rounded-full border border-white/[0.10] bg-white/[0.045] px-3 py-2.5 text-sm text-white focus:border-[#FF6B3D]/50 focus:outline-none transition-colors xl:w-auto xl:py-2"
      >
        <option value="">Toutes sources</option>
        <option value="scout">Scout IA</option>
        <option value="manual">Manuel</option>
        <option value="import">Import</option>
      </select>
    </div>
  );
}
