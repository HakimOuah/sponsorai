"use client";

import { useState, useTransition } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import {
  approveProspectOutreach,
  revokeProspectOutreachApproval,
} from "@/lib/actions/prospection";

interface PublicContact {
  id: string;
  roleRaw: string;
  contactability: string;
  contactScore: number | null;
}

export function OutreachApproval({
  prospectId,
  approved,
  selectedContactId,
  contacts,
  legacyContactReady,
}: {
  prospectId: string;
  approved: boolean;
  selectedContactId: string | null;
  contacts: PublicContact[];
  legacyContactReady: boolean;
}) {
  const [contactId, setContactId] = useState(
    selectedContactId || contacts[0]?.id || ""
  );
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const actionableContacts = contacts.filter((contact) =>
    ["verified", "public_source"].includes(contact.contactability)
  );
  const canApprove = actionableContacts.length > 0 || legacyContactReady;

  const approve = () => {
    startTransition(async () => {
      try {
        await approveProspectOutreach(prospectId, contactId || undefined);
        setMessage("Outreach approuvé");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Approbation impossible");
      }
    });
  };

  const revoke = () => {
    startTransition(async () => {
      await revokeProspectOutreachApproval(prospectId);
      setMessage("Approbation retirée");
    });
  };

  if (approved) {
    return (
      <div className="rounded-xl border border-[#3EF2A0]/15 bg-[#3EF2A0]/5 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs text-[#3EF2A0]">
            <Check className="h-3.5 w-3.5" /> Validation humaine enregistrée
          </span>
          <button
            type="button"
            onClick={revoke}
            disabled={pending}
            className="text-[#8FA69E] hover:text-white"
            aria-label="Retirer l'approbation"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {message && <p className="mt-1 text-[11px] text-[#8FA69E]">{message}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs text-[#8FA69E]">
        <ShieldCheck className="h-3.5 w-3.5" /> Valider avant le premier envoi
      </p>
      {actionableContacts.length > 0 && (
        <select
          value={contactId}
          onChange={(event) => setContactId(event.target.value)}
          className="mb-2 w-full rounded-lg border border-white/[0.08] bg-[#020403] px-2.5 py-2 text-xs text-white"
        >
          {actionableContacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.roleRaw} · {contact.contactScore ?? "—"}/100
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        onClick={approve}
        disabled={pending || !canApprove}
        className="rounded-full bg-[#3EF2A0] px-3 py-1.5 text-xs font-semibold text-[#020403] disabled:opacity-40"
      >
        {pending ? "Validation..." : "Approuver l’outreach"}
      </button>
      {message && <p className="mt-1 text-[11px] text-[#f59e0b]">{message}</p>}
    </div>
  );
}
