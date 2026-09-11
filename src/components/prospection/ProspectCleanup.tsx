"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Loader2 } from "lucide-react";
import {
  cleanupProspects,
  getCleanupProspects,
} from "@/lib/actions/prospect-cleanup";

type Row = Awaited<ReturnType<typeof getCleanupProspects>>[number];
type Action = "archive" | "restore" | "delete";
const button =
  "min-h-11 rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C8CEFF]";

export function ProspectCleanup({
  playerId,
  playerName,
  isAdmin,
}: {
  playerId: string;
  playerName: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [archived, setArchived] = useState(false);
  const [scan, setScan] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<Action>("archive");
  const [deleteCompanies, setDeleteCompanies] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const visible = rows.filter(
    (row) =>
      row.archived === archived && (!scan || (row.scanId || "manual") === scan),
  );
  const chosen = visible.filter((row) => selected.has(row.id));
  const scans = Array.from(
    new Map(
      rows.filter((row) => row.scanId).map((row) => [row.scanId!, row.date]),
    ).entries(),
  );

  async function load() {
    setOpen(!open);
    if (open || pending) return;
    setPending(true);
    setMessage("");
    setSelected(new Set());
    try {
      setRows(await getCleanupProspects(playerId));
      setLoaded(true);
    } catch {
      setMessage("Impossible de charger la prospection. Réessayez.");
    } finally {
      setPending(false);
    }
  }
  function confirm(next: Action) {
    setAction(next);
    setConfirmation("");
    setDeleteCompanies(false);
    setMessage("");
    setModalOpen(true);
    dialog.current?.showModal();
  }
  async function submit() {
    if (
      pending ||
      !chosen.length ||
      (action === "delete" && confirmation !== "SUPPRIMER")
    )
      return;
    setPending(true);
    try {
      const result = await cleanupProspects({
        playerId,
        ids: chosen.map((row) => row.id),
        action,
        deleteOrphanCompanies: deleteCompanies,
      });
      setRows((current) =>
        action === "delete"
          ? current.filter((row) => !selected.has(row.id))
          : current.map((row) =>
              selected.has(row.id)
                ? { ...row, archived: action === "archive" }
                : row,
            ),
      );
      setSelected(new Set());
      setMessage(
        `${result.count} prospect(s) ${action === "archive" ? "archivé(s)" : action === "restore" ? "restauré(s)" : "supprimé(s)"}.${action === "delete" ? ` ${result.companiesDeleted} fiche(s) entreprise supprimée(s). Les autres restent conservées.` : ""}`,
      );
      dialog.current?.close();
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Opération impossible. Rechargez et réessayez.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <section
      className="app-panel mb-6 p-4 text-[#F6F4EF] sm:p-5"
      aria-label="Nettoyage de la prospection"
    >
      <button
        className={`${button} flex items-center gap-2`}
        onClick={load}
        aria-expanded={open}
        disabled={pending}
      >
        <Archive className="h-4 w-4" /> Gérer la prospection de {playerName}
      </button>
      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-[#969BA8]">
            Archivez les anciennes marques pour les retirer de la prospection
            active de cet athlète. Les fiches entreprises, emails et deals sont
            conservés. L’archivage n’annule pas les envois déjà programmés.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className={button}
              aria-pressed={!archived}
              disabled={pending}
              onClick={() => {
                setArchived(false);
                setSelected(new Set());
              }}
            >
              Actifs ({rows.filter((r) => !r.archived).length})
            </button>
            <button
              className={button}
              aria-pressed={archived}
              disabled={pending}
              onClick={() => {
                setArchived(true);
                setSelected(new Set());
              }}
            >
              Archives ({rows.filter((r) => r.archived).length})
            </button>
            <label className="flex items-center gap-2 text-sm">
              Scan
              <select
                className="min-h-11 max-w-full rounded-xl bg-[#141720] px-3"
                value={scan}
                disabled={pending}
                onChange={(e) => {
                  setScan(e.target.value);
                  setSelected(new Set());
                }}
              >
                <option value="">Tous les scans</option>
                <option value="manual">Sans scan</option>
                {scans.map(([id, date]) => (
                  <option key={id} value={id}>
                    {new Date(date).toLocaleString("fr-FR")}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {pending && !loaded ? (
            <p role="status">Chargement…</p>
          ) : (
            <>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  disabled={pending || !visible.length}
                  checked={
                    visible.length > 0 && chosen.length === visible.length
                  }
                  onChange={(e) =>
                    setSelected(
                      new Set(e.target.checked ? visible.map((r) => r.id) : []),
                    )
                  }
                />
                Tout sélectionner dans cette vue ({visible.length})
              </label>
              <div className="max-h-80 overflow-auto rounded-xl border border-white/10">
                {!visible.length && (
                  <p className="p-4 text-sm text-[#969BA8]">
                    Aucun prospect dans cette vue.
                  </p>
                )}
                {visible.map((row) => (
                  <label
                    key={row.id}
                    className="flex min-h-14 cursor-pointer items-start gap-3 border-b border-white/5 p-3 hover:bg-white/5"
                  >
                    <input
                      className="mt-1"
                      type="checkbox"
                      disabled={pending}
                      checked={selected.has(row.id)}
                      onChange={(e) =>
                        setSelected((current) => {
                          const next = new Set(current);
                          if (e.target.checked) next.add(row.id);
                          else next.delete(row.id);
                          return next;
                        })
                      }
                    />
                    <span className="min-w-0 text-sm">
                      <span className="block break-words">{row.name}</span>
                      <span className="text-xs text-[#969BA8]">
                        {new Date(row.date).toLocaleDateString("fr-FR")}
                        {row.protected
                          ? " · Historique protégé : archivage uniquement"
                          : ""}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm">{chosen.length} sélectionné(s)</span>
                <button
                  className={button}
                  disabled={pending || !chosen.length}
                  onClick={() => confirm(archived ? "restore" : "archive")}
                >
                  {archived ? "Restaurer" : "Archiver"}
                </button>
                {isAdmin && (
                  <button
                    className={`${button} text-red-300`}
                    disabled={
                      pending ||
                      !chosen.length ||
                      chosen.some((row) => row.protected)
                    }
                    onClick={() => confirm("delete")}
                  >
                    Supprimer définitivement
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
      {message && !modalOpen && (
        <p role="status" className="mt-3 text-sm text-[#C8CEFF]">
          {message}
        </p>
      )}
      <dialog
        ref={dialog}
        onClose={() => setModalOpen(false)}
        onCancel={(e) => {
          if (pending) e.preventDefault();
        }}
        className="w-[min(94vw,36rem)] rounded-2xl border border-white/15 bg-[#141720] p-6 text-[#F6F4EF] backdrop:bg-black/70"
        aria-labelledby="cleanup-title"
      >
        <h2 id="cleanup-title" className="text-xl font-semibold">
          {action === "delete"
            ? "Supprimer définitivement"
            : action === "archive"
              ? "Archiver"
              : "Restaurer"}{" "}
          {chosen.length} prospect(s) ?
        </h2>
        <p className="my-4 text-sm text-[#969BA8]">
          Athlète : {playerName}.{" "}
          {action === "delete"
            ? "Cette suppression est irréversible. Les prospects avec emails, conversations ou deals ne peuvent pas être supprimés."
            : "Action réversible depuis les archives. Les emails et deals existants ne sont pas modifiés."}
        </p>
        {action === "delete" && (
          <div className="space-y-4">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                disabled={pending}
                checked={deleteCompanies}
                onChange={(e) => setDeleteCompanies(e.target.checked)}
              />
              Supprimer aussi les fiches entreprises devenues inutilisées, sans
              contact ni historique. Les entreprises partagées restent
              conservées.
            </label>
            <label className="block text-sm">
              Tapez SUPPRIMER pour confirmer
              <input
                autoComplete="off"
                className="mt-2 block min-h-11 w-full rounded-lg border border-white/20 bg-black/20 px-3"
                value={confirmation}
                disabled={pending}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </label>
          </div>
        )}
        {message && (
          <p role="alert" className="mt-3 text-sm text-red-300">
            {message}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            className={button}
            disabled={pending}
            onClick={() => dialog.current?.close()}
          >
            Annuler
          </button>
          <button
            className={`${button} flex items-center gap-2 bg-[#FF6B3D] text-black`}
            disabled={
              pending ||
              !chosen.length ||
              (action === "delete" && confirmation !== "SUPPRIMER")
            }
            onClick={submit}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? "Traitement…" : "Confirmer"}
          </button>
        </div>
      </dialog>
    </section>
  );
}
