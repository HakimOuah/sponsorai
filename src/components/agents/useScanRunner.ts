"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAgentExperience } from "./experience/AgentExperienceProvider";

export type ScanPhase =
  | "idle"
  | "init"
  | "research"
  | "scout"
  | "matchmaker"
  | "save"
  | "done"
  | "error";

export type ScanResult = {
  scanId?: string;
  resumable?: boolean;
  success: boolean;
  message: string;
};

const PHASE_PROGRESS: Record<
  Exclude<ScanPhase, "idle" | "done" | "error">,
  { start: number; cap: number }
> = {
  init: { start: 6, cap: 14 },
  research: { start: 18, cap: 40 },
  scout: { start: 46, cap: 70 },
  matchmaker: { start: 76, cap: 90 },
  save: { start: 94, cap: 98 },
};

function isActivePhase(
  phase: ScanPhase,
): phase is Exclude<ScanPhase, "idle" | "done" | "error"> {
  return phase in PHASE_PROGRESS;
}

export function useScanRunner(options?: { onSuccess?: () => void }) {
  const { startMission, updateMission, finishMission, failMission } =
    useAgentExperience();
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const runningRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const missionIdRef = useRef<string | null>(null);
  const retryRef = useRef<{ playerId: string; scanId: string } | null>(null);
  const onSuccessRef = useRef(options?.onSuccess);

  useEffect(() => {
    onSuccessRef.current = options?.onSuccess;
  }, [options?.onSuccess]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      if (startedAtRef.current) {
        setElapsedSeconds(
          Math.floor((Date.now() - startedAtRef.current) / 1000),
        );
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning]);

  const reset = useCallback(() => {
    if (runningRef.current) return;
    setPhase("idle");
    setProgress(0);
    setResult(null);
    setElapsedSeconds(0);
    startedAtRef.current = null;
    retryRef.current = null;
  }, []);

  const startScan = useCallback(
    async (playerId: string, playerName?: string, savedScanId?: string) => {
      if (!playerId || runningRef.current) return;
      const resumeScanId =
        savedScanId ??
        (retryRef.current?.playerId === playerId
          ? retryRef.current.scanId
          : undefined);
      retryRef.current = null;

      runningRef.current = true;
      startedAtRef.current = Date.now();
      setIsRunning(true);
      setPhase("init");
      setProgress(PHASE_PROGRESS.init.start);
      setResult(null);
      setElapsedSeconds(0);
      const missionId = startMission({
        agentId: "scout",
        title: `Analyse de ${playerName || "un talent"}`,
        detail: resumeScanId
          ? "Matchmaker reprend les marques déjà trouvées."
          : "Scout prépare la recherche de partenaires.",
        progress: PHASE_PROGRESS.init.start,
      });
      missionIdRef.current = missionId;

      try {
        const response = await fetch("/api/agents/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId, resumeScanId }),
        });

        if (!response.ok || !response.body) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || "Impossible de démarrer le scan");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let receivedTerminalEvent = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const event of events) {
            if (!event.startsWith("data: ")) continue;

            try {
              const data = JSON.parse(event.slice(6)) as {
                message?: string;
                type?: string;
                phase?: ScanPhase;
                done?: boolean;
                scanId?: string;
                resumable?: boolean;
              };

              if (data.phase && isActivePhase(data.phase)) {
                setPhase(data.phase);
                const target = PHASE_PROGRESS[data.phase];
                setProgress((current) =>
                  current < target.start
                    ? target.start
                    : Math.min(current + 2, target.cap),
                );
                const missionAgent =
                  data.phase === "matchmaker" || data.phase === "save"
                    ? "matchmaker"
                    : "scout";
                updateMission(missionId, {
                  agentId: missionAgent,
                  progress: target.start,
                  detail: getMissionDetail(data.phase),
                });
              }

              if (data.done) {
                receivedTerminalEvent = true;
                const success = data.type !== "error";
                if (!success && data.resumable && data.scanId) {
                  retryRef.current = { playerId, scanId: data.scanId };
                }
                setPhase(success ? "done" : "error");
                if (success) setProgress(100);
                setResult({
                  scanId: data.scanId,
                  resumable: data.resumable,
                  success,
                  message:
                    data.message ||
                    (success
                      ? "Scan terminé"
                      : "Le scan a rencontré une erreur"),
                });

                if (success) onSuccessRef.current?.();
                if (success) {
                  finishMission(
                    missionId,
                    data.message ||
                      "Les opportunités sont prêtes à être consultées.",
                    {
                      status: "waiting",
                      nextAgentId: "enrichisseur",
                      actionLabel: "Choisir les opportunités",
                      actionHref: `/prospection?player=${playerId}`,
                    },
                  );
                } else {
                  failMission(
                    missionId,
                    data.message || "Le scan a rencontré une erreur.",
                  );
                }
              }
            } catch {
              // Ignore malformed SSE events while keeping the scan alive.
            }
          }
        }

        if (!receivedTerminalEvent) {
          throw new Error(
            "Le scan a été interrompu avant la fin. Vous pouvez le relancer.",
          );
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erreur inconnue";
        setPhase("error");
        setResult({ success: false, message });
        if (missionIdRef.current) failMission(missionIdRef.current, message);
      } finally {
        runningRef.current = false;
        setIsRunning(false);
      }
    },
    [failMission, finishMission, startMission, updateMission],
  );

  return {
    isRunning,
    phase,
    progress,
    result,
    elapsedSeconds,
    startScan,
    reset,
  };
}

function getMissionDetail(
  phase: Exclude<ScanPhase, "idle" | "done" | "error">,
) {
  const details = {
    init: "Scout prépare la recherche de partenaires.",
    research: "Scout rassemble les signaux publics du profil.",
    scout: "Scout détecte et vérifie de nouvelles marques.",
    matchmaker: "Matchmaker compare les opportunités sur huit critères.",
    save: "Matchmaker consolide le classement et crée les opportunités.",
  } satisfies Record<Exclude<ScanPhase, "idle" | "done" | "error">, string>;
  return details[phase];
}
