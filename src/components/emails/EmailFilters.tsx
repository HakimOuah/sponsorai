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
    <div className="flex gap-1.5">
      {STATUSES.map((s) => (
        <button
          key={s.value}
          onClick={() => setFilter(s.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            currentStatus === s.value
              ? "bg-[#00d4aa]/10 text-[#00d4aa] border border-[#00d4aa]/20"
              : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.06]"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
