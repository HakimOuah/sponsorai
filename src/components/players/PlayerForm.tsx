"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import type { Player } from "@prisma/client";

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
          : "Créer le joueur"}
    </button>
  );
}

interface PlayerFormProps {
  action: (formData: FormData) => void;
  player?: Player | null;
}

type PlayerFormValues = {
  firstName: string;
  lastName: string;
  age: string;
  nationality: string;
  club: string;
  league: string;
  position: string;
  city: string;
  languages: string;
  instagram: string;
  followersIG: string;
  tiktok: string;
  followersTK: string;
  twitter: string;
  followersX: string;
  engagementRate: string;
  positioning: string;
  targetPartnerships: string;
  notes: string;
};

type PlayerEnrichment = Partial<Record<keyof PlayerFormValues, string | number | null>> & {
  sources?: string[];
  confidence?: string;
};

export function PlayerForm({ action, player }: PlayerFormProps) {
  const isEdit = !!player;
  const [values, setValues] = useState<PlayerFormValues>(() => ({
    firstName: player?.firstName ?? "",
    lastName: player?.lastName ?? "",
    age: player?.age?.toString() ?? "",
    nationality: player?.nationality ?? "",
    club: player?.club ?? "",
    league: player?.league ?? "",
    position: player?.position ?? "",
    city: player?.city ?? "",
    languages: player?.languages ?? "",
    instagram: player?.instagram ?? "",
    followersIG: player?.followersIG?.toString() ?? "",
    tiktok: player?.tiktok ?? "",
    followersTK: player?.followersTK?.toString() ?? "",
    twitter: player?.twitter ?? "",
    followersX: player?.followersX?.toString() ?? "",
    engagementRate: player?.engagementRate?.toString() ?? "",
    positioning: player?.positioning ?? "",
    targetPartnerships: player?.targetPartnerships ?? "",
    notes: player?.notes ?? "",
  }));
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState("");
  const [enrichSuccess, setEnrichSuccess] = useState("");

  function updateField(name: keyof PlayerFormValues, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function enrichPlayer() {
    const playerName = `${values.firstName} ${values.lastName}`.trim();
    if (!playerName) {
      setEnrichError("Renseigne au moins le prénom ou le nom du joueur.");
      return;
    }

    setIsEnriching(true);
    setEnrichError("");
    setEnrichSuccess("");

    try {
      const response = await fetch("/api/players/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
        }),
      });

      if (!response.ok) {
        throw new Error("Enrichissement impossible");
      }

      const data = (await response.json()) as { enrichment?: PlayerEnrichment };
      const enrichment = data.enrichment;

      if (!enrichment) {
        throw new Error("Aucune donnée retournée");
      }

      setValues((prev) => {
        const next = { ...prev };
        (Object.keys(next) as Array<keyof PlayerFormValues>).forEach((key) => {
          const value = enrichment[key];
          if (value !== undefined && value !== null && value !== "") {
            next[key] = String(value);
          }
        });
        return next;
      });

      setEnrichSuccess(
        enrichment.confidence
          ? `Profil complété par IA — confiance ${enrichment.confidence}`
          : "Profil complété par IA"
      );
    } catch {
      setEnrichError("Impossible d'enrichir ce joueur pour le moment.");
    } finally {
      setIsEnriching(false);
    }
  }

  return (
    <form action={action} className="min-w-0 space-y-6 sm:space-y-8">
      {!isEdit && (
        <section className="relative overflow-hidden rounded-[22px] border border-[#3EF2A0]/15 bg-[#003F32]/45 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.18)] sm:rounded-[24px] sm:p-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(62,242,160,0.18),transparent_28%)]" />
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative">
              <h2 className="text-base font-semibold text-[#F8FAF7]">
                Complétion automatique
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-[#8FA69E]">
                Saisis un prénom et un nom, puis laisse l&apos;agent rechercher les informations publiques.
              </p>
            </div>
            <button
              type="button"
              onClick={enrichPlayer}
              disabled={isEnriching || !`${values.firstName} ${values.lastName}`.trim()}
              className="relative inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#F8FAF7] px-4 py-2.5 text-sm font-semibold text-[#020403] shadow-[0_14px_38px_rgba(62,242,160,0.16)] transition-all hover:-translate-y-0.5 hover:bg-white disabled:opacity-50 sm:w-auto sm:py-2"
            >
              {isEnriching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isEnriching ? "Recherche..." : "Compléter avec l'IA"}
            </button>
          </div>
          {enrichError && (
            <p className="mt-3 text-xs text-red-400">{enrichError}</p>
          )}
          {enrichSuccess && (
            <p className="relative mt-3 text-xs text-[#3EF2A0]">{enrichSuccess}</p>
          )}
        </section>
      )}

      {/* Identité */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#8FA69E]">
          Identité
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Prénom" name="firstName" value={values.firstName} onChange={updateField} required />
          <Field label="Nom" name="lastName" value={values.lastName} onChange={updateField} required />
          <Field label="Âge" name="age" type="number" value={values.age} onChange={updateField} />
          <Field label="Nationalité" name="nationality" value={values.nationality} onChange={updateField} />
          <Field label="Club" name="club" value={values.club} onChange={updateField} required />
          <Field label="Ligue" name="league" value={values.league} onChange={updateField} required />
          <Field label="Poste" name="position" value={values.position} onChange={updateField} />
          <Field label="Ville" name="city" value={values.city} onChange={updateField} />
          <Field label="Langues" name="languages" value={values.languages} onChange={updateField} placeholder="FR, EN, AR" />
        </div>
      </section>

      {/* Réseaux sociaux */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#8FA69E]">
          Réseaux sociaux
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Instagram" name="instagram" value={values.instagram} onChange={updateField} placeholder="@username" />
          <Field label="Followers IG" name="followersIG" type="number" value={values.followersIG} onChange={updateField} />
          <Field label="TikTok" name="tiktok" value={values.tiktok} onChange={updateField} placeholder="@username" />
          <Field label="Followers TK" name="followersTK" type="number" value={values.followersTK} onChange={updateField} />
          <Field label="Twitter / X" name="twitter" value={values.twitter} onChange={updateField} placeholder="@username" />
          <Field label="Followers X" name="followersX" type="number" value={values.followersX} onChange={updateField} />
          <Field label="Taux d'engagement (%)" name="engagementRate" type="number" value={values.engagementRate} onChange={updateField} step="0.1" />
        </div>
      </section>

      {/* Positionnement */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#8FA69E]">
          Positionnement
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TextArea
            label="Image & valeurs"
            name="positioning"
            value={values.positioning}
            onChange={updateField}
            placeholder="Style, image, valeurs portées..."
          />
          <TextArea
            label="Types de deals recherchés"
            name="targetPartnerships"
            value={values.targetPartnerships}
            onChange={updateField}
            placeholder="Ambassadeur, post IG, stories, events..."
          />
          <TextArea
            label="Notes"
            name="notes"
            value={values.notes}
            onChange={updateField}
            placeholder="Notes internes..."
            className="lg:col-span-2"
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col gap-3 border-t border-[#3EF2A0]/10 pt-6 sm:flex-row sm:items-center">
        <SubmitButton isEdit={isEdit} />
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  required,
  placeholder,
  step,
}: {
  label: string;
  name: keyof PlayerFormValues;
  type?: string;
  value: string;
  onChange: (name: keyof PlayerFormValues, value: string) => void;
  required?: boolean;
  placeholder?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/60 mb-1">
        {label}
        {required && <span className="text-[#3EF2A0] ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        required={required}
        placeholder={placeholder}
        step={step}
        className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.045] px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#3EF2A0]/50 focus:outline-none transition-colors"
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  name: keyof PlayerFormValues;
  value: string;
  onChange: (name: keyof PlayerFormValues, value: string) => void;
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
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.045] px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#3EF2A0]/50 focus:outline-none transition-colors resize-none"
      />
    </div>
  );
}
