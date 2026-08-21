"use client";

import { useState, useTransition } from "react";
import { submitProspectFeedback } from "@/lib/actions/prospection";

export function ProspectFeedback({ prospectId }: { prospectId: string }) {
  const [brandRating, setBrandRating] = useState<"excellent" | "possible" | "mauvais">("possible");
  const [contactRating, setContactRating] = useState<"excellent" | "acceptable" | "mauvais">("acceptable");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      await submitProspectFeedback(prospectId, { brandRating, contactRating });
      setSaved(true);
    });
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[#8FA69E]">
        Retour pilote
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-[#8FA69E]">
          Marque
          <select
            value={brandRating}
            onChange={(event) => setBrandRating(event.target.value as typeof brandRating)}
            className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#020403] px-2 py-1.5 text-white"
          >
            <option value="excellent">Excellente</option>
            <option value="possible">Possible</option>
            <option value="mauvais">Mauvaise</option>
          </select>
        </label>
        <label className="text-xs text-[#8FA69E]">
          Contact
          <select
            value={contactRating}
            onChange={(event) => setContactRating(event.target.value as typeof contactRating)}
            className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#020403] px-2 py-1.5 text-white"
          >
            <option value="excellent">Excellent</option>
            <option value="acceptable">Acceptable</option>
            <option value="mauvais">Mauvais</option>
          </select>
        </label>
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="mt-2 rounded-full border border-[#3EF2A0]/20 px-3 py-1.5 text-xs text-[#3EF2A0] disabled:opacity-50"
      >
        {pending ? "Enregistrement..." : saved ? "Enregistré" : "Enregistrer le feedback"}
      </button>
    </div>
  );
}
