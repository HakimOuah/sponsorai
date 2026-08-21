"use client";

import { useFormStatus } from "react-dom";

export interface EditableCompany {
  id: string;
  name: string;
  sector: string | null;
  country: string | null;
  website: string | null;
  description: string | null;
  existingSportsSponsoring: string | null;
  estimatedBudget: string | null;
  employeeCount: number | null;
  companySizeBucket: string;
  notes: string | null;
  source: string | null;
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-[#F8FAF7] px-6 py-2.5 text-sm font-semibold text-[#020403] transition-colors hover:bg-[#2CFF93] disabled:opacity-50 sm:w-auto"
    >
      {pending
        ? "Enregistrement..."
        : isEdit
          ? "Mettre à jour"
          : "Créer l'entreprise"}
    </button>
  );
}

interface CompanyFormProps {
  action: (formData: FormData) => void;
  company?: EditableCompany | null;
}

export function CompanyForm({ action, company }: CompanyFormProps) {
  const isEdit = !!company;

  return (
    <form action={action} className="min-w-0 space-y-6 sm:space-y-8">
      {/* Infos */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8FA69E] mb-4">
          Informations
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nom" name="name" defaultValue={company?.name} required />
          <Field label="Secteur" name="sector" defaultValue={company?.sector} placeholder="Tech, Fashion, F&B..." />
          <Field label="Pays" name="country" defaultValue={company?.country} />
          <Field label="Site web" name="website" defaultValue={company?.website} placeholder="https://..." />
          <Field label="Budget estimé" name="estimatedBudget" defaultValue={company?.estimatedBudget} placeholder="petit / moyen / gros" />
          <Field label="Effectif estimé" name="employeeCount" type="number" defaultValue={company?.employeeCount?.toString()} placeholder="5000" />
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">Taille entreprise</label>
            <select
              name="companySizeBucket"
              defaultValue={company?.companySizeBucket || "unknown"}
              className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.045] px-3 py-2 text-sm text-white focus:border-[#3EF2A0]/50 focus:outline-none transition-colors"
            >
              <option value="unknown">Non renseignée</option>
              <option value="1-10">1–10</option>
              <option value="11-50">11–50</option>
              <option value="51-200">51–200</option>
              <option value="201-1000">201–1 000</option>
              <option value="1001-5000">1 001–5 000</option>
              <option value="5001+">Plus de 5 000</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">Source</label>
            <select
              name="source"
              defaultValue={company?.source || "manual"}
              className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.045] px-3 py-2 text-sm text-white focus:border-[#3EF2A0]/50 focus:outline-none transition-colors"
            >
              <option value="manual">Manuel</option>
              <option value="scout">Scout IA</option>
              <option value="import">Import</option>
            </select>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TextArea label="Description" name="description" defaultValue={company?.description} />
          <TextArea label="Sponsoring sportif existant" name="existingSportsSponsoring" defaultValue={company?.existingSportsSponsoring} />
        </div>
      </section>

      <section className="rounded-2xl border border-[#3EF2A0]/10 bg-[#3EF2A0]/[0.03] p-4">
        <h2 className="text-sm font-semibold text-white">Contacts privés</h2>
        <p className="mt-1 text-xs leading-relaxed text-[#8FA69E]">
          Les décideurs sont gérés par l’Enrichisseur. Les emails, téléphones et liens directs restent côté serveur et ne sont pas exposés dans ce formulaire.
        </p>
      </section>

      {/* Notes */}
      <section>
        <TextArea label="Notes" name="notes" defaultValue={company?.notes} placeholder="Notes internes..." />
      </section>

      <div className="flex flex-col gap-3 border-t border-[#3EF2A0]/10 pt-6 sm:flex-row sm:items-center">
        <SubmitButton isEdit={isEdit} />
      </div>
    </form>
  );
}

function Field({
  label, name, type = "text", defaultValue, required, placeholder,
}: {
  label: string; name: string; type?: string; defaultValue?: string | null; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/60 mb-1">
        {label}{required && <span className="text-[#3EF2A0] ml-0.5">*</span>}
      </label>
      <input
        type={type} name={name} defaultValue={defaultValue ?? ""} required={required} placeholder={placeholder}
        className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.045] px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#3EF2A0]/50 focus:outline-none transition-colors"
      />
    </div>
  );
}

function TextArea({
  label, name, defaultValue, placeholder,
}: {
  label: string; name: string; defaultValue?: string | null; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/60 mb-1">{label}</label>
      <textarea
        name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} rows={3}
        className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.045] px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#3EF2A0]/50 focus:outline-none transition-colors resize-none"
      />
    </div>
  );
}
