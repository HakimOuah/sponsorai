"use client";

import { useFormStatus } from "react-dom";
import type { Company } from "@prisma/client";

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-[#00d4aa] px-6 py-2.5 text-sm font-semibold text-[#07090f] hover:bg-[#00e4ba] transition-colors disabled:opacity-50"
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
  company?: Company | null;
}

export function CompanyForm({ action, company }: CompanyFormProps) {
  const isEdit = !!company;

  return (
    <form action={action} className="space-y-8">
      {/* Infos */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/30 mb-4">
          Informations
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nom" name="name" defaultValue={company?.name} required />
          <Field label="Secteur" name="sector" defaultValue={company?.sector} placeholder="Tech, Fashion, F&B..." />
          <Field label="Pays" name="country" defaultValue={company?.country} />
          <Field label="Site web" name="website" defaultValue={company?.website} placeholder="https://..." />
          <Field label="Budget estimé" name="estimatedBudget" defaultValue={company?.estimatedBudget} placeholder="petit / moyen / gros" />
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">Source</label>
            <select
              name="source"
              defaultValue={company?.source || "manual"}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white focus:border-[#00d4aa]/50 focus:outline-none transition-colors"
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

      {/* Contact */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/30 mb-4">
          Contact
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nom du contact" name="contactName" defaultValue={company?.contactName} />
          <Field label="Rôle" name="contactRole" defaultValue={company?.contactRole} placeholder="CMO, Head of Partnerships..." />
          <Field label="Email" name="contactEmail" type="email" defaultValue={company?.contactEmail} />
          <Field label="LinkedIn" name="contactLinkedin" defaultValue={company?.contactLinkedin} placeholder="https://linkedin.com/in/..." />
          <Field label="Téléphone" name="contactPhone" defaultValue={company?.contactPhone} />
        </div>
      </section>

      {/* Notes */}
      <section>
        <TextArea label="Notes" name="notes" defaultValue={company?.notes} placeholder="Notes internes..." />
      </section>

      <div className="flex items-center gap-3 border-t border-white/[0.06] pt-6">
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
        {label}{required && <span className="text-[#00d4aa] ml-0.5">*</span>}
      </label>
      <input
        type={type} name={name} defaultValue={defaultValue ?? ""} required={required} placeholder={placeholder}
        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#00d4aa]/50 focus:outline-none transition-colors"
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
        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#00d4aa]/50 focus:outline-none transition-colors resize-none"
      />
    </div>
  );
}
