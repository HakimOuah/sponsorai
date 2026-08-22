"use client";

import Image from "next/image";
import {
  Check,
  Circle,
  LoaderCircle,
  Radar,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import { agentAvatars } from "@/lib/agent-avatars";
import type { ScanPhase, ScanResult } from "./useScanRunner";

const STEPS = [
  {
    phase: "research" as const,
    label: "Compréhension du profil",
    description: "Image, audience et actualité du profil",
    icon: Radar,
  },
  {
    phase: "scout" as const,
    label: "Détection des marques",
    description: "Recherche de partenaires cohérents et accessibles",
    icon: Search,
  },
  {
    phase: "matchmaker" as const,
    label: "Scoring des opportunités",
    description: "Classement selon le potentiel commercial",
    icon: Target,
  },
  {
    phase: "save" as const,
    label: "Création des opportunités",
    description: "Ajout des meilleurs matchs au pipeline",
    icon: Sparkles,
  },
];

const PHASE_INDEX: Record<ScanPhase, number> = {
  idle: -1,
  init: 0,
  research: 0,
  scout: 1,
  matchmaker: 2,
  save: 3,
  done: 4,
  error: -1,
};

const PHASE_COPY: Record<ScanPhase, string> = {
  idle: "Prêt à rechercher de nouvelles opportunités.",
  init: "Scout prépare son plan de recherche.",
  research: "Scout rassemble les signaux publics du profil.",
  scout: "Scout explore les marques les plus pertinentes.",
  matchmaker: "Matchmaker évalue et priorise chaque correspondance.",
  save: "Les meilleures opportunités sont ajoutées à la fiche.",
  done: "Les nouvelles opportunités sont prêtes à être consultées.",
  error: "Le scan n’a pas pu aller jusqu’au bout.",
};

interface ScanProgressProps {
  playerName: string;
  phase: ScanPhase;
  progress: number;
  isRunning: boolean;
  result: ScanResult | null;
  elapsedSeconds: number;
}

export function ScanProgress({
  playerName,
  phase,
  progress,
  isRunning,
  result,
  elapsedSeconds,
}: ScanProgressProps) {
  const currentStep = PHASE_INDEX[phase];
  const hasError = phase === "error" || result?.success === false;
  const isMatchmaker =
    phase === "matchmaker" || phase === "save" || phase === "done";
  const activeAgent = isMatchmaker
    ? { name: "Matchmaker", avatar: agentAvatars.matchmaker }
    : { name: "Scout", avatar: agentAvatars.scout };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0A0C11]">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[#FF6B3D]/15 blur-3xl" />
        <div className="absolute -right-20 top-12 h-56 w-56 rounded-full bg-[#C8CEFF]/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
      </div>

      <div className="relative p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-[#FF6B3D]/25 blur-xl" />
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-[#FF6B3D]/25 bg-[#11141B] sm:h-20 sm:w-20">
              <Image
                src={activeAgent.avatar}
                alt={`Avatar de l’agent ${activeAgent.name}`}
                fill
                sizes="80px"
                className="object-cover"
                priority
              />
            </div>
            <span
              className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-[#0A0C11] ${
                hasError
                  ? "bg-red-400"
                  : phase === "done"
                    ? "bg-emerald-400"
                    : "animate-pulse bg-[#FF6B3D]"
              }`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#FF6B3D]/20 bg-[#FF6B3D]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#FF9A7A]">
                Agent {activeAgent.name}
              </span>
              <span className="font-mono text-[11px] text-white/35">
                {formatElapsed(elapsedSeconds)}
              </span>
            </div>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#F6F4EF] sm:text-2xl">
              {hasError
                ? "Scan interrompu"
                : phase === "done"
                  ? "Opportunités détectées"
                  : isMatchmaker
                    ? "Classement des opportunités"
                    : `Analyse de ${playerName}`}
            </h2>
            <p
              className="mt-1.5 text-sm leading-relaxed text-[#969BA8]"
              aria-live="polite"
            >
              {PHASE_COPY[phase]}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-white/50">
              {phase === "done"
                ? "Analyse terminée"
                : hasError
                  ? "Analyse interrompue"
                  : "Analyse en cours"}
            </span>
            <span className="font-mono text-xs font-semibold text-[#FF8A66]">
              {Math.round(progress)}%
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-white/[0.06]"
            role="progressbar"
            aria-label="Progression du scan"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <div
              className={`relative h-full rounded-full transition-[width] duration-700 ease-out ${
                hasError
                  ? "bg-red-400"
                  : "bg-gradient-to-r from-[#FF6B3D] via-[#FF8A66] to-[#C8CEFF]"
              }`}
              style={{ width: `${progress}%` }}
            >
              {isRunning && (
                <span className="absolute inset-0 animate-[scan-shimmer_1.5s_linear_infinite] bg-gradient-to-r from-transparent via-white/45 to-transparent" />
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {STEPS.map((step, index) => {
            const isComplete = phase === "done" || index < currentStep;
            const isCurrent = isRunning && index === currentStep;
            const Icon = step.icon;

            return (
              <div
                key={step.phase}
                className={`flex items-start gap-3 rounded-2xl border px-3.5 py-3 transition-colors ${
                  isCurrent
                    ? "border-[#FF6B3D]/25 bg-[#FF6B3D]/[0.07]"
                    : isComplete
                      ? "border-emerald-400/15 bg-emerald-400/[0.04]"
                      : "border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    isCurrent
                      ? "bg-[#FF6B3D]/15 text-[#FF8A66]"
                      : isComplete
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-white/[0.04] text-white/25"
                  }`}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" />
                  ) : isCurrent ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      isCurrent || isComplete ? "text-white/80" : "text-white/35"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#969BA8]/60">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {result && (
          <div
            className={`mt-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
              result.success
                ? "border-emerald-400/15 bg-emerald-400/[0.05] text-emerald-100/80"
                : "border-red-400/20 bg-red-400/[0.05] text-red-200/80"
            }`}
            aria-live="polite"
          >
            {result.success ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
            )}
            <p className="leading-relaxed">{result.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatElapsed(totalSeconds: number) {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}
