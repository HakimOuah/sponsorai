"use client";

import { useState, useTransition } from "react";
import {
  Handshake,
  CheckSquare,
  Square,
  MailCheck,
  Search,
  LockKeyhole,
} from "lucide-react";
import { BrandResultCard } from "./BrandResultCard";
import { BulkEmailGenerator } from "@/components/emails/BulkEmailGenerator";
import { bulkCreateDeals } from "@/lib/actions/prospection";
import type { ProspectionProspect, ProspectionView } from "./types";

interface ProspectListProps {
  prospects: ProspectionProspect[];
  canOperate: boolean;
}

const views: Array<{ value: ProspectionView; label: string }> = [
  { value: "ready", label: "Prêtes à contacter" },
  { value: "incomplete", label: "À compléter" },
  { value: "all", label: "Toutes" },
];

export function ProspectList({ prospects, canOperate }: ProspectListProps) {
  const [view, setView] = useState<ProspectionView>("ready");
  const [priority, setPriority] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const priorityProspects = prospects.filter(
    (prospect) => priority === "all" || (prospect.priority || "C") === priority,
  );
  const ready = priorityProspects.filter(
    (prospect) => prospect.company.readiness.status !== "incomplete",
  );
  const incomplete = priorityProspects.filter(
    (prospect) => prospect.company.readiness.status === "incomplete",
  );
  const visible =
    view === "ready"
      ? ready
      : view === "incomplete"
        ? incomplete
        : priorityProspects;
  const counts = {
    ready: ready.length,
    incomplete: incomplete.length,
    all: priorityProspects.length,
  };
  const selectedProspects = visible.filter((prospect) =>
    selected.has(prospect.id),
  );
  const selectedReady = selectedProspects.filter(
    (prospect) => prospect.company.readiness.bestContactId,
  );
  const selectedCount = selectedProspects.length;
  const readyPersonCount = ready.filter(
    (prospect) => prospect.company.readiness.status === "ready_person",
  ).length;
  const genericCount = ready.length - readyPersonCount;

  const toggle = (id: string) => {
    if (!canOperate) return;
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectPriority = (includeB: boolean) => {
    setSelected(
      new Set(
        visible
          .filter(
            (prospect) =>
              !prospect.deal &&
              (prospect.priority === "A" ||
                (includeB && prospect.priority === "B")),
          )
          .map((prospect) => prospect.id),
      ),
    );
  };

  const handleBulkDeals = () => {
    if (!canOperate || selectedCount === 0) return;
    startTransition(async () => {
      try {
        const created = await bulkCreateDeals(
          selectedProspects.map((prospect) => prospect.id),
        );
        setMessage(
          `${created} deal${created > 1 ? "s" : ""} créé${created > 1 ? "s" : ""}.`,
        );
        setSelected(new Set());
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Impossible de créer les deals. Réessayez.",
        );
      }
    });
  };

  return (
    <section className="min-w-0" aria-labelledby="prospection-results-title">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="prospection-results-title"
            className="text-lg font-semibold text-[#F6F4EF]"
          >
            De la bonne marque au bon contact
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#969BA8]">
            Les contacts vérifiés sont prêts pour Rédacteur. Les autres
            opportunités restent disponibles, sans être écartées.
          </p>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-xs text-[#969BA8]">
          Priorité
          <select
            value={priority}
            onChange={(event) => {
              setPriority(event.target.value);
              setSelected(new Set());
            }}
            className="min-h-11 rounded-xl border border-white/[0.10] bg-[#141720] px-3 text-sm text-[#F6F4EF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C8CEFF]"
          >
            <option value="all">Toutes les priorités</option>
            {["A", "B", "C"].map((value) => (
              <option key={value} value={value}>
                {value} ·{" "}
                {
                  prospects.filter(
                    (prospect) => (prospect.priority || "C") === value,
                  ).length
                }
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3"
        role="group"
        aria-label="État des contacts"
      >
        {views.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={view === item.value}
            onClick={() => {
              setView(item.value);
              setSelected(new Set());
            }}
            className={`flex min-h-12 items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8CEFF] ${view === item.value ? "border-[#C8CEFF]/35 bg-[#C8CEFF]/10 text-[#D9DDFF]" : "border-white/[0.08] bg-white/[0.025] text-[#969BA8] hover:bg-white/[0.06] hover:text-white"}`}
          >
            <span>{item.label}</span>
            <span className="rounded-full bg-white/[0.07] px-2.5 py-0.5 font-mono text-xs">
              {counts[item.value]}
            </span>
          </button>
        ))}
      </div>

      <p
        className="mb-5 text-xs leading-relaxed text-[#969BA8]"
        role="status"
        aria-live="polite"
      >
        {view === "ready"
          ? `${readyPersonCount} avec un contact nominatif · ${genericCount} avec une boîte générique de secours. Email vérifié depuis moins de 30 jours ; aucun envoi automatique.`
          : view === "incomplete"
            ? "Contact absent, email non vérifié ou vérification trop ancienne : ces marques restent à compléter. Un email public n’est pas une garantie de délivrabilité."
            : "Toutes les opportunités sont conservées. Leur pertinence sportive et la disponibilité d’un contact sont évaluées séparément."}
      </p>

      {!canOperate ? (
        <p className="mb-4 flex items-start gap-2 rounded-xl border border-white/[0.08] px-4 py-3 text-sm text-[#969BA8]">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" /> Mode découverte :
          vous pouvez consulter les opportunités, sans lancer d’agent ni créer
          de deal.
        </p>
      ) : visible.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => selectPriority(false)}
            className="flex min-h-11 items-center gap-1.5 rounded-full border border-white/[0.10] px-3 text-xs text-white/65 hover:bg-white/[0.06]"
          >
            <CheckSquare className="h-3.5 w-3.5" /> Sélectionner les A
          </button>
          <button
            type="button"
            onClick={() => selectPriority(true)}
            className="flex min-h-11 items-center gap-1.5 rounded-full border border-white/[0.10] px-3 text-xs text-white/65 hover:bg-white/[0.06]"
          >
            <CheckSquare className="h-3.5 w-3.5" /> A + B
          </button>
          {selectedCount > 0 ? (
            <>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="flex min-h-11 items-center gap-1.5 rounded-full border border-white/[0.10] px-3 text-xs text-[#969BA8] hover:bg-white/[0.06]"
              >
                <Square className="h-3.5 w-3.5" /> Désélectionner
              </button>
              <span className="text-xs text-[#969BA8]">
                {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
              </span>
              {selectedReady.length > 0 ? (
                <BulkEmailGenerator
                  prospectIds={selectedReady.map((prospect) => prospect.id)}
                  contactIds={Object.fromEntries(
                    selectedReady.map((prospect) => [
                      prospect.id,
                      prospect.company.readiness.bestContactId!,
                    ]),
                  )}
                  onDone={() => setSelected(new Set())}
                />
              ) : null}
              <button
                type="button"
                onClick={handleBulkDeals}
                disabled={isPending}
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-[#FF6B3D] px-3 text-xs font-semibold text-[#0B0D12] hover:bg-[#FF865F] disabled:opacity-50 sm:ml-auto"
              >
                <Handshake className="h-3.5 w-3.5" />{" "}
                {isPending
                  ? "Création…"
                  : `Créer ${selectedCount} deal${selectedCount > 1 ? "s" : ""}`}
              </button>
              {selectedReady.length < selectedCount ? (
                <p className="w-full text-xs text-[#969BA8]">
                  Seules les {selectedReady.length} opportunités avec un contact
                  vérifié seront transmises à Rédacteur.
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <p
          role="status"
          className="mb-4 rounded-xl border border-[#FF6B3D]/20 bg-[#FF6B3D]/5 px-4 py-3 text-sm text-[#FF865F]"
        >
          {message}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <div className="app-panel px-5 py-10 text-center">
          {view === "ready" ? (
            <MailCheck className="mx-auto mb-3 h-8 w-8 text-[#C8CEFF]/60" />
          ) : (
            <Search className="mx-auto mb-3 h-8 w-8 text-[#C8CEFF]/60" />
          )}
          <h3 className="text-base font-medium text-[#F6F4EF]">
            {view === "ready"
              ? "Aucune opportunité prête pour le moment"
              : "Aucune opportunité dans cette vue"}
          </h3>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[#969BA8]">
            {view === "ready" && incomplete.length > 0
              ? `${incomplete.length} marque${incomplete.length > 1 ? "s restent" : " reste"} à compléter. Les contacts trouvés pendant le scan apparaîtront ici après vérification. Vous pouvez aussi consulter les marques et solliciter l’Enrichisseur.`
              : "Les filtres n’excluent aucune marque définitivement. Changez de vue ou de priorité pour retrouver les autres opportunités."}
          </p>
          <button
            type="button"
            onClick={() => {
              setView(
                view === "ready" && incomplete.length ? "incomplete" : "all",
              );
              setPriority("all");
            }}
            className="mt-5 min-h-11 rounded-full border border-[#C8CEFF]/25 bg-[#C8CEFF]/10 px-5 text-sm font-medium text-[#D9DDFF] hover:bg-[#C8CEFF]/15"
          >
            {view === "ready" && incomplete.length
              ? "Voir les marques à compléter"
              : "Voir toutes les opportunités"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((prospect) => (
            <BrandResultCard
              key={prospect.id}
              prospect={prospect}
              selected={selected.has(prospect.id)}
              onToggle={toggle}
              canOperate={canOperate}
            />
          ))}
        </div>
      )}
    </section>
  );
}
