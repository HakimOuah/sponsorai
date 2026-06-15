"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface PlayerFiltersProps {
  sports: string[];
}

export function PlayerFilters({ sports }: PlayerFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/players?${params.toString()}`);
  }

  return (
    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex xl:items-center">
      <select
        defaultValue={searchParams.get("profileType") || ""}
        onChange={(e) => update("profileType", e.target.value)}
        className="w-full rounded-full border border-white/[0.10] bg-white/[0.045] px-3 py-2.5 text-sm text-white focus:border-[#3EF2A0]/50 focus:outline-none transition-colors xl:w-auto xl:py-2"
      >
        <option value="">Tous types</option>
        <option value="athlete">Sportifs</option>
        <option value="club">Clubs</option>
      </select>

      <select
        defaultValue={searchParams.get("sport") || ""}
        onChange={(e) => update("sport", e.target.value)}
        className="w-full rounded-full border border-white/[0.10] bg-white/[0.045] px-3 py-2.5 text-sm text-white focus:border-[#3EF2A0]/50 focus:outline-none transition-colors xl:w-auto xl:py-2"
      >
        <option value="">Tous sports</option>
        {sports.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
