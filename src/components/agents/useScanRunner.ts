"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  phase: ScanPhase
): phase is Exclude<ScanPhase, "idle" | "done" | "error"> {
  return phase in PHASE_PROGRESS;
}

export function useScanRunner(options?: { onSuccess?: () => void }) {
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const runningRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const onSuccessRef = useRef(options?.onSuccess);

  useEffect(() => {
    onSuccessRef.current = options?.onSuccess;
  }, [options?.onSuccess]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      if (startedAtRef.current) {
        setElapsedSeconds(
          Math.floor((Date.now() - startedAtRef.current) / 1000)
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
  }, []);

  const startScan = useCallback(async (playerId: string) => {
    if (!playerId || runningRef.current) return;

    runningRef.current = true;
    startedAtRef.current = Date.now();
    setIsRunning(true);
    setPhase("init");
    setProgress(PHASE_PROGRESS.init.start);
    setResult(null);
    setElapsedSeconds(0);

    try {
      const response = await fetch("/api/agents/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Impossible de démarrer le scan");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
            };

            if (data.phase && isActivePhase(data.phase)) {
              setPhase(data.phase);
              const target = PHASE_PROGRESS[data.phase];
              setProgress((current) =>
                current < target.start
                  ? target.start
                  : Math.min(current + 2, target.cap)
              );
            }

            if (data.done) {
              const success = data.type !== "error";
              setPhase(success ? "done" : "error");
              if (success) setProgress(100);
              setResult({
                scanId: data.scanId,
                success,
                message:
                  data.message ||
                  (success ? "Scan terminé" : "Le scan a rencontré une erreur"),
              });

              if (success) onSuccessRef.current?.();
            }
          } catch {
            // Ignore malformed SSE events while keeping the scan alive.
          }
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      setPhase("error");
      setResult({ success: false, message });
    } finally {
      runningRef.current = false;
      setIsRunning(false);
    }
  }, []);

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
