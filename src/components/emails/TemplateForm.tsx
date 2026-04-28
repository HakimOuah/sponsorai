"use client";

import { useTransition, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { createEmailTemplate } from "@/lib/actions/emails";

export function TemplateForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await createEmailTemplate({
        name: formData.get("name") as string,
        type: formData.get("type") as string,
        subject: formData.get("subject") as string,
        body: formData.get("body") as string,
      });
      setIsOpen(false);
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-full bg-[#F8FAF7] px-4 py-2 text-sm font-semibold text-[#020403] hover:bg-[#2CFF93] transition-colors"
      >
        <Plus className="h-4 w-4" />
        Nouveau template
      </button>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="rounded-xl border border-[#3EF2A0]/20 bg-[#061511] p-4 space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-[#8FA69E] mb-1 block">
            Nom
          </label>
          <input
            name="name"
            required
            placeholder="Ex: Premier contact formel"
            className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.045] px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#3EF2A0]/30 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-[#8FA69E] mb-1 block">
            Type
          </label>
          <select
            name="type"
            required
            className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.045] px-3 py-2 text-sm text-white focus:border-[#3EF2A0]/30 focus:outline-none"
          >
            <option value="first_contact">1er contact</option>
            <option value="followup_1">Relance J+4</option>
            <option value="followup_2">Relance J+10</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-[11px] font-medium uppercase tracking-wider text-[#8FA69E] mb-1 block">
          Objet
        </label>
        <input
          name="subject"
          required
          placeholder="Ex: Opportunité de partenariat — {joueur} x {marque}"
          className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.045] px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#3EF2A0]/30 focus:outline-none"
        />
      </div>

      <div>
        <label className="text-[11px] font-medium uppercase tracking-wider text-[#8FA69E] mb-1 block">
          Corps
        </label>
        <textarea
          name="body"
          required
          rows={8}
          placeholder={"Bonjour {contact},\n\nJe me permets de vous contacter au sujet de {joueur}..."}
          className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.045] px-3 py-3 text-sm text-white placeholder-white/20 focus:border-[#3EF2A0]/30 focus:outline-none leading-relaxed resize-y"
        />
        <p className="mt-1 text-[10px] text-[#8FA69E]/55">
          Variables : {"{joueur}"}, {"{marque}"}, {"{rationnel}"}, {"{secteur}"}, {"{type_partenariat}"}, {"{contact}"}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-full bg-[#F8FAF7] px-4 py-2 text-sm font-semibold text-[#020403] hover:bg-[#2CFF93] transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Créer
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-lg bg-white/[0.06] px-4 py-2 text-sm text-white/50 hover:bg-white/[0.1] transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
