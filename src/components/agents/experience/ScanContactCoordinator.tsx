"use client";

import { useEffect, useRef } from "react";
import { useAgentExperience } from "./AgentExperienceProvider";
import type { QualificationView } from "@/lib/contacts/scan-qualification";

const ENDPOINT = "/api/agents/scan/contacts";

/** Lives in AppShell: changing pages does not stop a qualification step. */
export function ScanContactCoordinator() {
  const experience = useAgentExperience();
  const experienceRef = useRef(experience);
  experienceRef.current = experience;

  useEffect(() => {
    let disposed = false;
    let busy = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    const known = new Set<string>();
    const versions = new Map<string, number>();
    const controller = new AbortController();

    const present = (job: QualificationView) => {
      const active = job.status === "pending" || job.status === "running";
      const api = experienceRef.current;
      const restored = api.missions.find((mission) => mission.id === job.id);
      if (!active && !known.has(job.id) && restored?.status !== "running") return;
      const ready = job.readyPeople + job.readyGeneric;
      const counts = `${job.processed}/${job.total} entreprises traitées · ${job.readyPeople} avec contact nominatif · ${job.readyGeneric} avec boîte générique vérifiée`;
      const budget = job.budget ? ` Monid : ${job.budget.reservedUsd.toFixed(2)} $ réservés sur ${job.budget.limitUsd.toFixed(2)} $ ; coût constaté ${job.budget.actualUsd === null ? "à confirmer" : `${job.budget.actualUsd.toFixed(3)} $`}.` : "";
      if (!known.has(job.id)) {
        known.add(job.id);
        if (!restored) api.startMission({ id: job.id, agentId: "enrichisseur", title: "Contacts des nouvelles opportunités", detail: "Vérification des meilleures pistes. Vous pouvez continuer à naviguer.", progress: 0 });
      }
      if (versions.get(job.id) === job.updatedAt) return;
      versions.set(job.id, job.updatedAt);
      if (active) {
        api.updateMission(job.id, {
          status: "running", detail: `${counts}. Recherche et vérification en cours.${budget}`,
          progress: job.total ? Math.round(job.processed / job.total * 100) : 0,
          actionHref: `/prospection?player=${encodeURIComponent(job.playerId)}`,
          actionLabel: "Voir les opportunités",
        });
      } else {
        const limit = job.budgetLimited ? " Plafond Monid atteint ; les autres pistes restent à compléter." : job.interrupted ? " Une étape a été interrompue ; aucun appel payant ambigu n’a été répété." : "";
        api.finishMission(job.id, `${counts}.${limit}${budget}${ready ? " Choisissez une opportunité pour préparer son message." : " Aucun contact prêt confirmé ; les pistes restent disponibles pour une recherche manuelle."}`, {
          status: "waiting", actionHref: `/prospection?player=${encodeURIComponent(job.playerId)}`,
          actionLabel: ready ? "Choisir une opportunité prête" : "Consulter les pistes à compléter",
          ...(ready ? { nextAgentId: "redacteur" as const } : {}),
        });
      }
      if (job.processed > 0) window.dispatchEvent(new Event("vectis:contacts-updated"));
    };

    const schedule = (ms: number) => {
      if (disposed) return;
      clearTimeout(timer);
      timer = setTimeout(() => { void tick(); }, ms);
    };
    const tick = async () => {
      if (disposed || busy) return;
      busy = true;
      let delay = 30_000;
      try {
        // Always reconcile persisted state before a POST, including after a lost response.
        const response = await fetch(ENDPOINT, { cache: "no-store", signal: controller.signal });
        if (response.status === 401 || response.status === 403) { disposed = true; return; }
        if (!response.ok) throw new Error("Status unavailable");
        const data = await response.json() as { jobs: QualificationView[] };
        if (disposed) return;
        for (const job of data.jobs) present(job);
        const job = [...data.jobs].reverse().find((item) => item.status === "pending" || item.status === "running");
        if (job) {
          if (job.retryAfterMs > 0) delay = Math.max(1500, Math.min(10_000, job.retryAfterMs));
          else {
            const step = await fetch(ENDPOINT, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: job.id }), signal: controller.signal,
            });
            if (!step.ok) throw new Error("Step needs reconciliation");
            const result = await step.json() as { job: QualificationView };
            if (disposed) return;
            present(result.job);
            delay = Math.max(750, result.job.retryAfterMs);
          }
        }
        failures = 0;
      } catch {
        if (!disposed) {
          failures++;
          delay = Math.min(60_000, 5000 * 2 ** Math.min(failures, 4));
          for (const id of Array.from(known)) {
            const mission = experienceRef.current.missions.find((item) => item.id === id);
            if (mission?.status === "running") experienceRef.current.updateMission(id, { detail: "Connexion au suivi interrompue. L’état enregistré sera relu avant de poursuivre, sans répéter l’appel payant." });
          }
        }
      } finally {
        busy = false;
        schedule(delay);
      }
    };
    const wake = () => { clearTimeout(timer); void tick(); };
    window.addEventListener("vectis:qualification-queued", wake);
    window.addEventListener("online", wake);
    // Let the mission provider hydrate its local display first.
    schedule(500);
    return () => {
      disposed = true;
      clearTimeout(timer);
      controller.abort();
      window.removeEventListener("vectis:qualification-queued", wake);
      window.removeEventListener("online", wake);
    };
  }, []);

  return null;
}
