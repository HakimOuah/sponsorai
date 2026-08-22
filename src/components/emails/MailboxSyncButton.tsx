"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type SyncResponse = {
  analyzed?: number;
  failed?: number;
  error?: string;
};

export function MailboxSyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const sync = async () => {
    if (loading) return;
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/mailbox/sync", {
        method: "POST",
        cache: "no-store",
      });
      const result = (await response.json()) as SyncResponse;
      if (!response.ok) {
        throw new Error(result.error || "La relève a échoué");
      }

      const analyzed = result.analyzed || 0;
      setMessage(
        analyzed > 0
          ? `${analyzed} nouvelle${analyzed > 1 ? "s" : ""} réponse${analyzed > 1 ? "s" : ""}`
          : result.failed
            ? "Relève partielle"
            : "Aucune nouvelle réponse",
      );
      if (analyzed > 0) router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "La relève a échoué");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-w-0 items-center gap-3">
      {message ? (
        <span className="hidden max-w-52 truncate text-xs text-[#969BA8] sm:inline">
          {message}
        </span>
      ) : null}
      <button
        type="button"
        onClick={sync}
        disabled={loading}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 text-sm font-medium text-[#F6F4EF] transition hover:border-[#FF6B3D]/45 hover:bg-[#FF6B3D]/10 disabled:cursor-wait disabled:opacity-65"
        aria-label="Relever maintenant les réponses reçues"
      >
        <RefreshCw
          className={cn("h-4 w-4 text-[#FF6B3D]", loading && "animate-spin")}
        />
        <span className="hidden sm:inline">
          {loading ? "Relève en cours…" : "Relever maintenant"}
        </span>
      </button>
    </div>
  );
}
