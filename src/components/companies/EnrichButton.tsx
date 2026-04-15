"use client";

import { useState, useRef } from "react";
import { Database, Loader2, Check, User, Mail, Link2 } from "lucide-react";

interface EnrichContact {
  name: string;
  role: string;
  email: string | null;
  linkedin: string | null;
  confidence: string;
  source: string;
}

interface EnrichButtonProps {
  companyId: string;
  companyName: string;
}

export function EnrichButton({ companyId, companyName }: EnrichButtonProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [contacts, setContacts] = useState<EnrichContact[]>([]);
  const [insights, setInsights] = useState("");
  const [logs, setLogs] = useState<{ message: string; type: string }[]>([]);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const run = async () => {
    setLoading(true);
    setError("");
    setLogs([]);
    setContacts([]);
    setInsights("");
    setDone(false);
    setExpanded(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/agents/enrichisseur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Erreur ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "log") {
              setLogs((prev) => [
                ...prev,
                { message: data.message, type: data.logType },
              ]);
            } else if (data.type === "done") {
              setContacts(data.result.contacts);
              setInsights(data.result.insights);
              setDone(true);
            } else if (data.type === "error") {
              setError(data.message);
            }
          } catch {
            // skip parse errors
          }
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const confidenceColor: Record<string, string> = {
    high: "text-[#00d4aa]",
    medium: "text-[#f59e0b]",
    low: "text-white/30",
  };

  if (!expanded) {
    return (
      <button
        onClick={run}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-[#f59e0b]/20 bg-[#f59e0b]/5 px-3 py-2 text-sm text-[#f59e0b] hover:bg-[#f59e0b]/10 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Database className="h-4 w-4" />
        )}
        Enrichir les contacts
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0c1019] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-[#f59e0b]" />
          <h3 className="text-sm font-semibold text-white">
            Enrichisseur — {companyName}
          </h3>
        </div>
        <button
          onClick={() => setExpanded(false)}
          className="text-xs text-white/30 hover:text-white/60"
        >
          Réduire
        </button>
      </div>

      {/* Console logs */}
      {logs.length > 0 && (
        <div className="rounded-lg bg-[#07090f] p-3 font-mono text-xs max-h-32 overflow-y-auto space-y-1">
          {logs.map((l, i) => (
            <div
              key={i}
              className={
                l.type === "success"
                  ? "text-[#00d4aa]"
                  : l.type === "error"
                    ? "text-red-400"
                    : l.type === "data"
                      ? "text-[#0088ff]"
                      : "text-white/40"
              }
            >
              {l.message}
            </div>
          ))}
          {loading && (
            <div className="text-white/20 animate-pulse">En cours...</div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {/* Results */}
      {done && contacts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-[#00d4aa]" />
            <span className="text-sm text-[#00d4aa]">
              {contacts.length} contact{contacts.length > 1 ? "s" : ""} trouvé{contacts.length > 1 ? "s" : ""}
            </span>
          </div>

          {contacts.map((c, i) => (
            <div
              key={i}
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <User className="h-3.5 w-3.5 text-white/40" />
                <span className="text-sm font-medium text-white">{c.name}</span>
                <span className="text-xs text-white/40">— {c.role}</span>
                <span
                  className={`ml-auto font-mono text-[10px] ${confidenceColor[c.confidence] || "text-white/30"}`}
                >
                  {c.confidence}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {c.email && (
                  <span className="flex items-center gap-1 text-[#0088ff]">
                    <Mail className="h-3 w-3" />
                    {c.email}
                  </span>
                )}
                {c.linkedin && (
                  <a
                    href={c.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#0088ff] hover:underline"
                  >
                    <Link2 className="h-3 w-3" />
                    LinkedIn
                  </a>
                )}
                <span className="text-white/20 ml-auto">{c.source}</span>
              </div>
            </div>
          ))}

          {insights && (
            <p className="text-xs text-white/40 italic">{insights}</p>
          )}
        </div>
      )}

      {/* Run button */}
      {!loading && !done && (
        <button
          onClick={run}
          className="flex items-center gap-1.5 rounded-lg bg-[#f59e0b] px-4 py-2 text-sm font-semibold text-[#07090f] hover:bg-[#f59e0b]/80 transition-colors"
        >
          <Database className="h-4 w-4" />
          Lancer l&apos;enrichissement
        </button>
      )}

      {done && (
        <button
          onClick={run}
          className="text-xs text-white/30 hover:text-white/60"
        >
          Relancer
        </button>
      )}
    </div>
  );
}
