"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import {
  WriterHandoffModal,
  type HandoffContact,
  type HandoffProspect,
} from "@/components/agents/experience/WriterHandoffModal";
import { AgentAvatar } from "@/components/agents/experience/AgentAvatar";

export function CompanyWriterButton({
  companyName,
  companyCountry,
  contacts,
  prospects,
}: {
  companyName: string;
  companyCountry?: string | null;
  contacts: HandoffContact[];
  prospects: HandoffProspect[];
}) {
  const [open, setOpen] = useState(false);
  const draftableContacts = contacts.filter(
    (contact) => contact.currentRoleVerified,
  );
  const disabled = draftableContacts.length === 0 || prospects.length === 0;
  const initialContactId =
    draftableContacts.find((contact) =>
      ["verified", "public_source"].includes(contact.contactability),
    )?.id || draftableContacts[0]?.id;

  return (
    <>
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-[#C8CEFF]/25 bg-[#C8CEFF]/10 px-4 py-2.5 text-sm font-medium text-[#D9DDFF] transition-all hover:border-[#C8CEFF]/40 hover:bg-[#C8CEFF]/15 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-2"
        >
          <AgentAvatar agentId="redacteur" size="sm" />
          Demander à Rédacteur
          <Mail className="h-3.5 w-3.5" />
        </button>
        {disabled ? (
          <p className="max-w-sm text-[11px] leading-relaxed text-[#969BA8]/60">
            {prospects.length === 0
              ? "Créez d’abord une opportunité entre cette marque et un talent."
              : "Aucun contact actuel n’est suffisamment vérifié pour rédiger."}
          </p>
        ) : null}
      </div>

      {open ? (
        <WriterHandoffModal
          open
          onClose={() => setOpen(false)}
          companyName={companyName}
          companyCountry={companyCountry}
          contacts={contacts}
          prospects={prospects}
          initialContactId={initialContactId}
          origin="company"
        />
      ) : null}
    </>
  );
}
