"use client";

import { useState, useTransition } from "react";
import { Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { updateEmailTemplate, deleteEmailTemplate } from "@/lib/actions/emails";

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    type: string;
    subject: string;
    body: string;
    active: boolean;
  };
}

const typeLabels: Record<string, string> = {
  first_contact: "1er contact",
  followup_1: "Relance J+4",
  followup_2: "Relance J+10",
};

export function TemplateCard({ template }: TemplateCardProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    startTransition(async () => {
      await updateEmailTemplate(template.id, { active: !template.active });
    });
  };

  const handleDelete = () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    startTransition(async () => {
      await deleteEmailTemplate(template.id);
    });
  };

  return (
    <div className="app-panel overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className="font-semibold text-white truncate cursor-pointer hover:text-[#3EF2A0] transition-colors"
              onClick={() => setExpanded(!expanded)}
            >
              {template.name}
            </h3>
            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-[#8FA69E] shrink-0">
              {typeLabels[template.type] || template.type}
            </span>
          </div>
          <p className="text-xs text-[#8FA69E] truncate mt-0.5">{template.subject}</p>
        </div>

        <button
          onClick={handleToggle}
          disabled={isPending}
          className="shrink-0 text-[#8FA69E] hover:text-white/60 transition-colors"
          title={template.active ? "Désactiver" : "Activer"}
        >
          {template.active ? (
            <ToggleRight className="h-5 w-5 text-[#3EF2A0]" />
          ) : (
            <ToggleLeft className="h-5 w-5" />
          )}
        </button>

        <button
          onClick={handleDelete}
          disabled={isPending}
          className={`shrink-0 transition-colors ${
            deleteConfirm ? "text-red-400" : "text-[#8FA69E] hover:text-red-400"
          }`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
        {deleteConfirm && (
          <button
            onClick={() => setDeleteConfirm(false)}
            className="text-[10px] text-[#8FA69E] hover:text-white/60"
          >
            Annuler
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-[#3EF2A0]/10 px-4 pb-4 pt-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#8FA69E] mb-1">
            Corps du template
          </p>
          <div className="rounded-lg bg-white/[0.045] p-3 text-sm text-white/60 whitespace-pre-wrap leading-relaxed">
            {template.body}
          </div>
          <p className="mt-2 text-[10px] text-[#8FA69E]/55">
            Variables disponibles : {"{joueur}"}, {"{marque}"}, {"{rationnel}"}, {"{secteur}"}, {"{type_partenariat}"}
          </p>
        </div>
      )}
    </div>
  );
}
