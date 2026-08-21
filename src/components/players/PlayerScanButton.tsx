"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, RotateCcw, ScanLine, X } from "lucide-react";
import { ScanProgress } from "@/components/agents/ScanProgress";
import { useScanRunner } from "@/components/agents/useScanRunner";

interface PlayerScanButtonProps {
  playerId: string;
  playerName: string;
}

export function PlayerScanButton({
  playerId,
  playerName,
}: PlayerScanButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onSuccess = useCallback(() => router.refresh(), [router]);
  const scan = useScanRunner({ onSuccess });
  const startScan = scan.startScan;

  const launchScan = useCallback(() => {
    setIsOpen(true);
    startScan(playerId);
  }, [playerId, startScan]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={scan.isRunning ? () => setIsOpen(true) : launchScan}
        className="flex items-center justify-center gap-2 rounded-full bg-[#FF6B3D] px-3 py-2 text-sm font-semibold text-[#0B0D12] transition-all hover:bg-[#FF865F] hover:shadow-[0_0_24px_rgba(255,107,61,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A66] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D12]"
      >
        {scan.isRunning ? (
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ScanLine className="h-3.5 w-3.5" />
        )}
        {scan.isRunning ? "Voir la progression" : "Scanner"}
      </button>

      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050609]/80 p-3 backdrop-blur-md sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="player-scan-title"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setIsOpen(false);
            }}
          >
            <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/[0.10] bg-[#080A0F] p-2 shadow-[0_28px_100px_rgba(0,0,0,0.6)] sm:p-3">
              <div className="mb-2 flex items-center justify-between gap-4 px-2 py-1.5">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#969BA8]">
                    Scan intelligent
                  </p>
                  <p
                    id="player-scan-title"
                    className="mt-0.5 text-sm text-white/65"
                  >
                    Scout recherche les meilleures opportunités pour{" "}
                    {playerName}
                  </p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A66]"
                  aria-label={
                    scan.isRunning ? "Réduire la progression" : "Fermer"
                  }
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <ScanProgress
                playerName={playerName}
                phase={scan.phase}
                progress={scan.progress}
                isRunning={scan.isRunning}
                result={scan.result}
                elapsedSeconds={scan.elapsedSeconds}
              />

              <div className="flex flex-col-reverse gap-2 px-2 pb-1 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-white/[0.10] px-4 py-2.5 text-sm font-medium text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white"
                >
                  {scan.isRunning ? "Réduire" : "Fermer"}
                </button>

                {scan.result?.success && (
                  <Link
                    href={`/prospection?player=${playerId}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF6B3D] px-4 py-2.5 text-sm font-semibold text-[#0B0D12] transition-colors hover:bg-[#FF865F]"
                  >
                    Voir les opportunités
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}

                {scan.result && !scan.result.success && (
                  <button
                    type="button"
                    onClick={launchScan}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF6B3D] px-4 py-2.5 text-sm font-semibold text-[#0B0D12] transition-colors hover:bg-[#FF865F]"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Réessayer
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
