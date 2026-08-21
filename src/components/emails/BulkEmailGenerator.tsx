"use client";

import { useState } from "react";
import { PenTool, Loader2, Check } from "lucide-react";

interface BulkEmailGeneratorProps {
  prospectIds: string[];
  onDone?: () => void;
}

export function BulkEmailGenerator({
  prospectIds,
  onDone,
}: BulkEmailGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: number }>({
    success: 0,
    errors: 0,
  });

  const generate = async () => {
    setLoading(true);
    setProgress(0);
    let success = 0;
    let errors = 0;

    for (let i = 0; i < prospectIds.length; i++) {
      try {
        const res = await fetch("/api/agents/redacteur", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prospectId: prospectIds[i],
            emailType: "first_contact",
          }),
        });

        if (res.ok) {
          success++;
        } else {
          errors++;
        }
      } catch {
        errors++;
      }

      setProgress(i + 1);
      setResults({ success, errors });
    }

    setLoading(false);
    setDone(true);
    onDone?.();
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[#FF6B3D]/20 bg-[#FF6B3D]/5 px-3 py-2 text-xs">
        <Check className="h-3.5 w-3.5 text-[#FF6B3D]" />
        <span className="text-[#FF6B3D]">
          {results.success} email{results.success > 1 ? "s" : ""} généré
          {results.success > 1 ? "s" : ""}
        </span>
        {results.errors > 0 && (
          <span className="text-red-400">
            · {results.errors} erreur{results.errors > 1 ? "s" : ""}
          </span>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[#C8CEFF]/20 bg-[#C8CEFF]/5 px-3 py-2 text-xs text-[#C8CEFF]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>
          Génération… {progress}/{prospectIds.length}
        </span>
        <div className="ml-2 h-1.5 flex-1 rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-[#C8CEFF] transition-all"
            style={{
              width: `${(progress / prospectIds.length) * 100}%`,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={generate}
      disabled={prospectIds.length === 0}
      className="flex items-center justify-center gap-1.5 rounded-full border border-[#C8CEFF]/20 bg-[#C8CEFF]/10 px-3 py-2 text-xs font-medium text-[#C8CEFF] transition-colors hover:bg-[#C8CEFF]/20 disabled:opacity-40 sm:py-1.5"
    >
      <PenTool className="h-3 w-3" />
      Générer {prospectIds.length} email{prospectIds.length > 1 ? "s" : ""}
    </button>
  );
}
