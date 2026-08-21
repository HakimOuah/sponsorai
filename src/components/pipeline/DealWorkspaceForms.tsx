"use client";

import { FormEvent, useState, useTransition } from "react";
import { CalendarPlus, FileSignature, FileText } from "lucide-react";
import {
  createContract,
  createMeeting,
  createProposal,
  completeMeeting,
  markContractSigned,
} from "@/lib/actions/deal-workflow";

export function DealWorkspaceForms({
  dealId,
  contracts,
  meetings,
}: {
  dealId: string;
  contracts: { id: string; title: string; status: string }[];
  meetings: { id: string; status: string; scheduledAt: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const submitMeeting = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    startTransition(async () => {
      await createMeeting({
        dealId,
        scheduledAt: String(form.get("scheduledAt")),
        externalUrl: String(form.get("externalUrl") || ""),
        notes: String(form.get("notes") || ""),
      });
      setMessage("Meeting enregistré");
      formElement.reset();
    });
  };

  const submitProposal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const amount = Number(form.get("amount"));
    startTransition(async () => {
      await createProposal({
        dealId,
        amount: Number.isFinite(amount) && amount > 0 ? amount : undefined,
        summary: String(form.get("summary") || ""),
        externalUrl: String(form.get("externalUrl") || ""),
      });
      setMessage("Proposition enregistrée comme envoyée");
      formElement.reset();
    });
  };

  const submitContract = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    startTransition(async () => {
      await createContract({
        dealId,
        title: String(form.get("title")),
        externalUrl: String(form.get("externalUrl") || ""),
      });
      setMessage("Contrat externe enregistré");
      formElement.reset();
    });
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-xl border border-[#3EF2A0]/20 bg-[#3EF2A0]/5 px-3 py-2 text-xs text-[#3EF2A0]">
          {message}
        </div>
      )}
      <WorkflowForm title="Meeting externe" icon={CalendarPlus} onSubmit={submitMeeting}>
        <input name="scheduledAt" type="datetime-local" required className={inputClass} />
        <input name="externalUrl" type="url" placeholder="Lien Meet/Teams (optionnel)" className={inputClass} />
        <input name="notes" placeholder="Objectif ou notes" className={inputClass} />
      </WorkflowForm>

      {meetings.filter((meeting) => meeting.status !== "completed").map((meeting) => (
        <form
          key={meeting.id}
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            startTransition(async () => {
              await completeMeeting({
                meetingId: meeting.id,
                outcome: String(form.get("outcome") || "completed"),
              });
              setMessage("Outcome du meeting enregistré");
            });
          }}
          className="flex flex-col gap-2 rounded-xl border border-white/[0.08] p-3 sm:flex-row sm:items-center"
        >
          <span className="text-xs text-white/70">Meeting du {new Date(meeting.scheduledAt).toLocaleString("fr-FR")}</span>
          <select name="outcome" className={`${inputClass} sm:ml-auto sm:w-auto`}>
            <option value="positive">Positif</option>
            <option value="follow_up">À relancer</option>
            <option value="negative">Négatif</option>
          </select>
          <button className="rounded-full border border-[#3EF2A0]/20 px-3 py-1.5 text-xs text-[#3EF2A0]">Clôturer le meeting</button>
        </form>
      ))}

      <WorkflowForm title="Proposition" icon={FileText} onSubmit={submitProposal}>
        <input name="amount" type="number" min="0" step="100" placeholder="Montant estimé" className={inputClass} />
        <input name="externalUrl" type="url" placeholder="Lien vers la proposition" className={inputClass} />
        <input name="summary" placeholder="Résumé de l’offre" className={inputClass} />
      </WorkflowForm>

      <WorkflowForm title="Contrat externe" icon={FileSignature} onSubmit={submitContract}>
        <input name="title" required placeholder="Titre du contrat" className={inputClass} />
        <input name="externalUrl" type="url" placeholder="Lien Drive/DocuSign/Adobe Sign" className={inputClass} />
      </WorkflowForm>

      {contracts.filter((contract) => contract.status !== "signed").map((contract) => (
        <div key={contract.id} className="flex items-center justify-between rounded-xl border border-white/[0.08] px-3 py-2">
          <span className="text-xs text-white/70">{contract.title} · {contract.status}</span>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => {
              await markContractSigned(contract.id);
              setMessage("Contrat marqué signé, deal clôturé WON");
            })}
            className="rounded-full bg-[#3EF2A0] px-3 py-1.5 text-xs font-semibold text-[#020403]"
          >
            Marquer signé
          </button>
        </div>
      ))}
      {pending && <p className="text-xs text-[#8FA69E]">Mise à jour du workflow…</p>}
    </div>
  );
}

const inputClass = "w-full rounded-xl border border-white/[0.08] bg-[#020403] px-3 py-2 text-sm text-white placeholder:text-[#8FA69E]/60";

function WorkflowForm({
  title,
  icon: Icon,
  onSubmit,
  children,
}: {
  title: string;
  icon: typeof CalendarPlus;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} className="app-panel space-y-2 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
        <Icon className="h-4 w-4 text-[#3EF2A0]" /> {title}
      </h3>
      {children}
      <button className="rounded-full border border-[#3EF2A0]/25 px-3 py-1.5 text-xs text-[#3EF2A0]">
        Enregistrer
      </button>
    </form>
  );
}
