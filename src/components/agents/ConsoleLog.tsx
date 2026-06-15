"use client";

import { useRef, useEffect } from "react";
import { Terminal } from "lucide-react";

export interface LogEntry {
  message: string;
  type: "info" | "success" | "error" | "data";
  phase?: string;
  timestamp: number;
}

interface ConsoleLogProps {
  logs: LogEntry[];
  isRunning: boolean;
}

export function ConsoleLog({ logs, isRunning }: ConsoleLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const typeColors: Record<string, string> = {
    info: "text-[#DDFBEA]",
    success: "text-[#3EF2A0]",
    error: "text-red-400",
    data: "text-white/50",
  };

  const phaseLabels: Record<string, string> = {
    init: "INIT",
    scout: "SCOUT",
    matchmaker: "MATCH",
    save: "SAVE",
    done: "DONE",
    error: "ERR",
  };

  return (
    <div className="rounded-xl border border-[#3EF2A0]/10 bg-[#080b12] overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[#3EF2A0]/10 px-4 py-2.5">
        <Terminal className="h-4 w-4 text-[#8FA69E]" />
        <span className="font-mono text-xs text-[#8FA69E]">Console</span>
        {isRunning && (
          <span className="ml-auto flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#3EF2A0] animate-pulse" />
            <span className="font-mono text-[11px] text-[#3EF2A0]">
              Running
            </span>
          </span>
        )}
      </div>
      <div className="h-80 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
        {logs.length === 0 && !isRunning && (
          <p className="text-[#8FA69E]/55">
            Sélectionnez un profil sportif et lancez un scan pour voir les logs ici.
          </p>
        )}
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2 mb-0.5">
            <span className="text-[#8FA69E]/55 shrink-0 w-16 text-right">
              {formatTime(log.timestamp)}
            </span>
            {log.phase && (
              <span className="text-[#8FA69E]/55 shrink-0 w-12">
                [{phaseLabels[log.phase] || log.phase}]
              </span>
            )}
            <span className={typeColors[log.type] || "text-white/60"}>
              {log.message}
            </span>
          </div>
        ))}
        {isRunning && (
          <div className="flex gap-2 mb-0.5">
            <span className="text-[#8FA69E]/55 shrink-0 w-16" />
            <span className="text-[#3EF2A0] animate-pulse">▊</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
