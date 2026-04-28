"use client";

import { Trash2 } from "lucide-react";
import { deleteCompany } from "@/lib/actions/companies";
import { useState } from "react";

export function DeleteCompanyButton({ companyId }: { companyId: string }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#8FA69E]">Confirmer ?</span>
        <button
          onClick={() => deleteCompany(companyId)}
          className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
        >
          Supprimer
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-full border border-white/[0.10] px-3 py-2 text-sm text-[#8FA69E] hover:bg-white/[0.06] transition-colors"
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-2 rounded-full border border-white/[0.10] px-3 py-2 text-sm text-[#8FA69E] hover:border-red-500/30 hover:text-red-400 transition-colors"
    >
      <Trash2 className="h-3.5 w-3.5" />
      Supprimer
    </button>
  );
}
