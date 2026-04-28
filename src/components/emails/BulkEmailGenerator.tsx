"use client";

import { useState } from "react";
import { PenTool, Loader2, Check } from "lucide-react";

interface BulkEmailGeneratorProps {
  prospectIds: string[];
  onDone?: () => void;
}

export function BulkEmailGenerator({ prospectIds, onDone }: BulkEmailGeneratorProps) {
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
      <div className="flex items-center gap-2 rounded-lg border border-[#3EF2A0]/20 bg-[#3EF2A0]/5 px-3 py-2 text-xs">
        <Check className="h-3.5 w-3.5 text-[#3EF2A0]" />
        <span className="text-[#3EF2A0]">
          {results.success} email{results.success > 1 ? "s" : ""} généré{results.success > 1 ? "s" : ""}
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
      <div className="flex items-center gap-2 rounded-lg border border-[#DDFBEA]/20 bg-[#DDFBEA]/5 px-3 py-2 text-xs text-[#DDFBEA]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>
          Génération… {progress}/{prospectIds.length}
        </span>
        <div className="ml-2 h-1.5 flex-1 rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-[#DDFBEA] transition-all"
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
      className="flex items-center gap-1.5 rounded-lg border border-[#DDFBEA]/20 bg-[#DDFBEA]/10 px-3 py-1.5 text-xs font-medium text-[#DDFBEA] hover:bg-[#DDFBEA]/20 transition-colors disabled:opacity-40"
    >
      <PenTool className="h-3 w-3" />
      Générer {prospectIds.length} email{prospectIds.length > 1 ? "s" : ""}
    </button>
  );
}
