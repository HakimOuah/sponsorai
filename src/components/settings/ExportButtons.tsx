"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import {
  exportPlayersCSV,
  exportCompaniesCSV,
  exportProspectsCSV,
} from "@/lib/actions/settings";

export function ExportButtons() {
  const [loading, setLoading] = useState<string | null>(null);

  const download = async (
    type: "players" | "companies" | "prospects",
    fn: () => Promise<string>
  ) => {
    setLoading(type);
    try {
      const csv = await fn();
      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sponsorai_${type}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <ExportBtn
        label="Joueurs"
        loading={loading === "players"}
        onClick={() => download("players", exportPlayersCSV)}
      />
      <ExportBtn
        label="Entreprises"
        loading={loading === "companies"}
        onClick={() => download("companies", exportCompaniesCSV)}
      />
      <ExportBtn
        label="Prospects"
        loading={loading === "prospects"}
        onClick={() => download("prospects", exportProspectsCSV)}
      />
    </div>
  );
}

function ExportBtn({
  label,
  loading,
  onClick,
}: {
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.045] px-4 py-2 text-sm text-white/60 hover:bg-white/[0.06] transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}
