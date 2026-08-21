"use client";

import { useRouter, useSearchParams } from "next/navigation";

const STATUSES = [
  { value: "", label: "Tous" },
  { value: "draft", label: "Brouillons" },
  { value: "sent", label: "Envoyés" },
  { value: "opened", label: "Ouverts" },
  { value: "replied", label: "Répondu" },
  { value: "bounced", label: "Bounced" },
];

export function EmailFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") || "";

  const setFilter = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    router.push(`/emails?${params.toString()}`);
  };

  return (
    <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {STATUSES.map((s) => (
        <button
          key={s.value}
          onClick={() => setFilter(s.value)}
          className={`shrink-0 rounded-full px-3 py-2 text-xs font-medium transition-colors sm:py-1.5 ${
            currentStatus === s.value
              ? "bg-[#FF6B3D]/10 text-[#FF6B3D] border border-[#FF6B3D]/20"
              : "bg-white/[0.06] text-[#969BA8] border border-[#FF6B3D]/10 hover:bg-white/[0.06]"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
