"use client";

import { useState, useCallback } from "react";
import { Play, Loader2 } from "lucide-react";
import { ConsoleLog, type LogEntry } from "./ConsoleLog";

interface ScanLauncherProps {
  players: { id: string; firstName: string; lastName: string; club: string }[];
}

export function ScanLauncher({ players }: ScanLauncherProps) {
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<{
    scanId?: string;
    success: boolean;
    message: string;
  } | null>(null);

  const startScan = useCallback(async () => {
    if (!selectedPlayer || isRunning) return;

    setIsRunning(true);
    setLogs([]);
    setResult(null);

    const startTime = Date.now();

    try {
      const response = await fetch("/api/agents/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: selectedPlayer }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Erreur de connexion au serveur");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              setLogs((prev) => [
                ...prev,
                {
                  message: data.message,
                  type: data.type,
                  phase: data.phase,
                  timestamp: Date.now() - startTime,
                },
              ]);

              if (data.done) {
                setResult({
                  scanId: data.scanId,
                  success: data.type !== "error",
                  message: data.message,
                });
              }
            } catch {
              // Skip malformed events
            }
          }
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erreur inconnue";
      setLogs((prev) => [
        ...prev,
        {
          message: msg,
          type: "error",
          phase: "error",
          timestamp: Date.now() - startTime,
        },
      ]);
      setResult({ success: false, message: msg });
    } finally {
      setIsRunning(false);
    }
  }, [selectedPlayer, isRunning]);

  return (
    <div className="space-y-4">
      {/* Player selector + Launch */}
      <div className="flex items-center gap-3">
        <select
          value={selectedPlayer}
          onChange={(e) => setSelectedPlayer(e.target.value)}
          disabled={isRunning}
          className="flex-1 rounded-2xl border border-white/[0.10] bg-white/[0.045] px-3 py-2.5 text-sm text-white focus:border-[#3EF2A0]/50 focus:outline-none transition-colors disabled:opacity-50"
        >
          <option value="">Sélectionner un profil sportif...</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.firstName} {p.lastName} — {p.club}
            </option>
          ))}
        </select>

        <button
          onClick={startScan}
          disabled={!selectedPlayer || isRunning}
          className="flex items-center gap-2 rounded-full bg-[#F8FAF7] px-5 py-2.5 text-sm font-semibold text-[#020403] hover:bg-[#2CFF93] transition-colors disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scan en cours...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Lancer le scan
            </>
          )}
        </button>
      </div>

      {/* Result banner */}
      {result && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            result.success
              ? "border-[#3EF2A0]/20 bg-[#3EF2A0]/5 text-[#3EF2A0]"
              : "border-red-500/20 bg-red-500/5 text-red-400"
          }`}
        >
          {result.message}
        </div>
      )}

      {/* Console */}
      <ConsoleLog logs={logs} isRunning={isRunning} />
    </div>
  );
}
