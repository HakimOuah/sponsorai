"use client";

import { CircleAlert, RotateCcw } from "lucide-react";
import Link from "@/components/layout/NavigationLink";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      className="app-panel mx-auto max-w-lg space-y-4 p-6 sm:p-8"
      role="alert"
    >
      <CircleAlert className="h-7 w-7 text-[#FF8A66]" />
      <h1 className="text-xl font-semibold text-[#F6F4EF]">
        Cette page n’a pas pu être chargée
      </h1>
      <p className="text-sm leading-relaxed text-[#969BA8]">
        Réessayez dans un instant. Vous pouvez aussi continuer à naviguer dans
        le menu.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full bg-[#FF6B3D] px-4 py-2.5 text-sm font-semibold text-[#0B0D12] hover:bg-[#FF865F]"
        >
          <RotateCcw className="h-4 w-4" /> Réessayer
        </button>
        <Link
          href="/dashboard"
          className="rounded-full border border-white/10 px-4 py-2.5 text-sm text-[#D5D7DF] hover:bg-white/5"
        >
          Revenir au dashboard
        </Link>
      </div>
    </section>
  );
}
