"use client";

import { useFormStatus } from "react-dom";
import type { Player } from "@prisma/client";

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
          : "Créer le joueur"}
    </button>
  );
}

interface PlayerFormProps {
  action: (formData: FormData) => void;
  player?: Player | null;
}

export function PlayerForm({ action, player }: PlayerFormProps) {
  const isEdit = !!player;

  return (
    <form action={action} className="space-y-8">
      {/* Identité */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/30 mb-4">
          Identité
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Prénom" name="firstName" defaultValue={player?.firstName} required />
          <Field label="Nom" name="lastName" defaultValue={player?.lastName} required />
          <Field label="Âge" name="age" type="number" defaultValue={player?.age} />
          <Field label="Nationalité" name="nationality" defaultValue={player?.nationality} />
          <Field label="Club" name="club" defaultValue={player?.club} required />
          <Field label="Ligue" name="league" defaultValue={player?.league} required />
          <Field label="Poste" name="position" defaultValue={player?.position} />
          <Field label="Ville" name="city" defaultValue={player?.city} />
          <Field label="Langues" name="languages" defaultValue={player?.languages} placeholder="FR, EN, AR" />
        </div>
      </section>

      {/* Réseaux sociaux */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/30 mb-4">
          Réseaux sociaux
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Instagram" name="instagram" defaultValue={player?.instagram} placeholder="@username" />
          <Field label="Followers IG" name="followersIG" type="number" defaultValue={player?.followersIG} />
          <Field label="TikTok" name="tiktok" defaultValue={player?.tiktok} placeholder="@username" />
          <Field label="Followers TK" name="followersTK" type="number" defaultValue={player?.followersTK} />
          <Field label="Twitter / X" name="twitter" defaultValue={player?.twitter} placeholder="@username" />
          <Field label="Followers X" name="followersX" type="number" defaultValue={player?.followersX} />
          <Field label="Taux d'engagement (%)" name="engagementRate" type="number" defaultValue={player?.engagementRate} step="0.1" />
        </div>
      </section>

      {/* Positionnement */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/30 mb-4">
          Positionnement
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TextArea
            label="Image & valeurs"
            name="positioning"
            defaultValue={player?.positioning}
            placeholder="Style, image, valeurs portées..."
          />
          <TextArea
            label="Types de deals recherchés"
            name="targetPartnerships"
            defaultValue={player?.targetPartnerships}
            placeholder="Ambassadeur, post IG, stories, events..."
          />
          <TextArea
            label="Notes"
            name="notes"
            defaultValue={player?.notes}
            placeholder="Notes internes..."
            className="lg:col-span-2"
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3 border-t border-white/[0.06] pt-6">
        <SubmitButton isEdit={isEdit} />
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  placeholder?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/60 mb-1">
        {label}
        {required && <span className="text-[#00d4aa] ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        step={step}
        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#00d4aa]/50 focus:outline-none transition-colors"
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  placeholder,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-white/60 mb-1">
        {label}
      </label>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#00d4aa]/50 focus:outline-none transition-colors resize-none"
      />
    </div>
  );
}
