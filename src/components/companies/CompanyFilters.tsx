"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8FA69E]/55" />
        <input
          type="text"
          placeholder="Rechercher..."
          defaultValue={searchParams.get("search") || ""}
          onChange={(e) => update("search", e.target.value)}
          className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.045] pl-9 pr-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#3EF2A0]/50 focus:outline-none transition-colors"
        />
      </div>

      {/* Sector */}
      <select
        defaultValue={searchParams.get("sector") || ""}
        onChange={(e) => update("sector", e.target.value)}
        className="rounded-full border border-white/[0.10] bg-white/[0.045] px-3 py-2 text-sm text-white focus:border-[#3EF2A0]/50 focus:outline-none transition-colors"
      >
        <option value="">Tous secteurs</option>
        {sectors.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Country */}
      <select
        defaultValue={searchParams.get("country") || ""}
        onChange={(e) => update("country", e.target.value)}
        className="rounded-full border border-white/[0.10] bg-white/[0.045] px-3 py-2 text-sm text-white focus:border-[#3EF2A0]/50 focus:outline-none transition-colors"
      >
        <option value="">Tous pays</option>
        {countries.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* Source */}
      <select
        defaultValue={searchParams.get("source") || ""}
        onChange={(e) => update("source", e.target.value)}
        className="rounded-full border border-white/[0.10] bg-white/[0.045] px-3 py-2 text-sm text-white focus:border-[#3EF2A0]/50 focus:outline-none transition-colors"
      >
        <option value="">Toutes sources</option>
        <option value="scout">Scout IA</option>
        <option value="manual">Manuel</option>
        <option value="import">Import</option>
      </select>
    </div>
  );
}
