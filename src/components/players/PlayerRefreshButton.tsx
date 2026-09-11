"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import {
  refreshFields,
  sanitizeRefresh,
  type RefreshField,
  type RefreshValues,
} from "@/lib/players/refresh";
import { savePlayerRefresh } from "@/lib/actions/player-refresh";

const button =
  "min-h-11 rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-40";

export function PlayerRefreshButton({
  playerId,
  playerName,
  version,
  current,
}: {
  playerId: string;
  playerName: string;
  version: string;
  current: RefreshValues;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<RefreshValues | null>(null);
  const [selected, setSelected] = useState<Set<RefreshField>>(new Set());
  const [sources, setSources] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function research() {
    if (busy || saving) return;
    dialog.current?.showModal();
    setBusy(true);
    setResult(null);
    setError("");
    setSuccess(false);
    setSources([]);
    setNotes("");
    try {
      const response = await fetch("/api/players/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
        signal: AbortSignal.timeout(115_000),
      });
      const data = await response.json();
      if (!response.ok || !data.enrichment)
        throw new Error(
          "La recherche n’a pas abouti. Aucune donnée n’a été modifiée ; vous pouvez réessayer.",
        );
      const evidence = Array.isArray(data.enrichment.sources)
        ? data.enrichment.sources
            .filter((s: unknown): s is string => {
              if (typeof s !== "string") return false;
              try {
                return ["https:", "http:"].includes(new URL(s).protocol);
              } catch {
                return false;
              }
            })
            .slice(0, 12)
        : [];
      const values = evidence.length ? sanitizeRefresh(data.enrichment) : {};
      const changes: RefreshValues = {};
      for (const field of Object.keys(values) as RefreshField[]) {
        if (values[field] !== current[field]) changes[field] = values[field];
      }
      setResult(changes);
      setSelected(new Set(Object.keys(changes) as RefreshField[]));
      setSources(evidence);
      setNotes(
        typeof data.enrichment.notes === "string"
          ? data.enrichment.notes.slice(0, 4000)
          : "",
      );
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "TimeoutError"
          ? e.message
          : "La recherche a dépassé le délai prévu. Votre profil reste inchangé.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (saving || !result || !selected.size) return;
    setSaving(true);
    setError("");
    try {
      const values = Object.fromEntries(
        Array.from(selected).map((field) => [field, result[field]]),
      );
      const response = await savePlayerRefresh(playerId, version, values);
      if (response.error) {
        setError(response.error);
        return;
      }
      setSuccess(true);
      setResult(null);
      router.refresh();
    } catch {
      setError(
        "Enregistrement impossible. Votre profil n’a pas été actualisé ; réessayez.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={`${button} flex items-center justify-center gap-2 text-[#C8CEFF]`}
        onClick={research}
        disabled={busy || saving}
      >
        <RefreshCw className="h-4 w-4" /> Actualiser le profil
      </button>
      <dialog
        ref={dialog}
        onCancel={(e) => {
          if (busy || saving) e.preventDefault();
        }}
        aria-labelledby="refresh-title"
        className="max-h-[90dvh] w-[min(94vw,48rem)] overflow-auto rounded-2xl border border-white/15 bg-[#141720] p-5 text-[#F6F4EF] backdrop:bg-black/75 sm:p-7"
      >
        <h2 id="refresh-title" className="text-xl font-semibold">
          Actualiser {playerName}
        </h2>
        <p className="my-3 text-sm text-[#969BA8]">
          Audience, réseaux sociaux et communication. Aucun scan de marques,
          aucun email envoyé. Les résultats web peuvent être incomplets :
          vérifiez les sources avant d’enregistrer.
        </p>
        {busy && (
          <div
            role="status"
            className="my-6 flex items-center gap-3 rounded-xl bg-white/5 p-5"
          >
            <Loader2 className="h-6 w-6 animate-spin text-[#FF6B3D]" />
            <span>
              Recherche des informations publiques actuelles… Cela peut prendre
              une à deux minutes.
            </span>
          </div>
        )}
        {success && (
          <p role="status" className="my-4 text-[#C8CEFF]">
            Profil actualisé. Les champs non sélectionnés et les données
            introuvables sont restés inchangés.
          </p>
        )}
        {result && (
          <>
            <h3 className="mt-5 font-medium">Modifications proposées</h3>
            <p className="mb-3 text-xs text-[#969BA8]">
              Décochez les informations que vous ne souhaitez pas remplacer. Les
              notes privées et vos préférences commerciales sont conservées.
            </p>
            {!Object.keys(result).length && (
              <p className="my-4">
                Aucune nouvelle information exploitable avec source. Les données
                existantes sont conservées.
              </p>
            )}
            {(Object.keys(result) as RefreshField[]).map((field) => (
              <label
                key={field}
                className="my-2 flex items-start gap-3 rounded-xl border border-white/10 p-3"
              >
                <input
                  className="mt-1"
                  type="checkbox"
                  checked={selected.has(field)}
                  disabled={saving}
                  onChange={(e) =>
                    setSelected((s) => {
                      const next = new Set(s);
                      if (e.target.checked) next.add(field);
                      else next.delete(field);
                      return next;
                    })
                  }
                />
                <span className="min-w-0 text-sm">
                  <strong>{refreshFields[field]}</strong>
                  <span className="mt-1 block break-words text-[#969BA8]">
                    Actuel : {current[field] ?? "Non renseigné"}
                  </span>
                  <span className="mt-1 block break-words text-[#C8CEFF]">
                    Proposé : {result[field]}
                  </span>
                </span>
              </label>
            ))}
            {notes && (
              <p className="mt-4 whitespace-pre-wrap text-sm text-[#969BA8]">
                {notes}
              </p>
            )}
            {!!sources.length && (
              <ul className="my-4 space-y-2 text-sm">
                {sources.map((url, i) => (
                  <li key={`${url}-${i}`}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-[#C8CEFF] underline"
                    >
                      Source {i + 1} — {new URL(url).hostname}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="my-4 text-sm text-red-300">
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className={button}
            disabled={busy || saving}
            onClick={() => dialog.current?.close()}
          >
            Fermer
          </button>
          {error && !result && (
            <button
              type="button"
              className={button}
              disabled={busy || saving}
              onClick={research}
            >
              Réessayer
            </button>
          )}
          {result && !!Object.keys(result).length && (
            <button
              type="button"
              className={`${button} bg-[#FF6B3D] text-black`}
              disabled={saving || !selected.size}
              onClick={save}
            >
              {saving
                ? "Enregistrement…"
                : `Enregistrer ${selected.size} modification(s)`}
            </button>
          )}
        </div>
      </dialog>
    </>
  );
}
