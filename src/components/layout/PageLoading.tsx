"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { getNavigationPresentation } from "@/lib/navigation";
import { useNavigation } from "./NavigationProvider";

export function PageLoading() {
  const pathname = usePathname();
  const navigation = useNavigation();
  const registerLoading = navigation?.registerLoading;
  const { title, layout } = getNavigationPresentation(
    navigation?.pendingHref || pathname,
  );

  useEffect(() => registerLoading?.(), [registerLoading]);

  return (
    <section
      aria-label={`Chargement — ${title}`}
      aria-busy="true"
      data-page-loading
      className="min-w-0"
    >
      <div className="mb-6 flex min-h-12 items-center justify-between gap-3 sm:mb-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="app-title-icon">
            <LoaderCircle className="h-5 w-5 motion-safe:animate-spin" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-[-0.03em] text-[#F6F4EF] sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1 text-xs text-[#969BA8]">
              Préparation de votre espace…
            </p>
          </div>
        </div>
      </div>
      <div aria-hidden="true">
        {layout === "board" ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="app-soft-panel w-72 shrink-0 p-4">
                <Bone className="mb-6 h-4 w-24" />
                <div className="app-panel space-y-4 p-4">
                  <Bone className="h-4 w-36" />
                  <Bone className="h-3 w-full" />
                  <Bone className="h-3 w-20" />
                </div>
                <div className="mt-4 h-32 rounded-2xl border border-dashed border-white/[0.07]" />
              </div>
            ))}
          </div>
        ) : layout === "cards" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="app-panel space-y-5 p-5">
                <div className="flex items-center gap-4">
                  <Bone className="h-12 w-12 shrink-0 rounded-2xl" />
                  <div className="flex-1 space-y-3">
                    <Bone className="h-4 w-3/4" />
                    <Bone className="h-3 w-1/2" />
                  </div>
                </div>
                <Bone className="h-3 w-full" />
                <Bone className="h-3 w-2/3" />
                <div className="flex gap-3 border-t border-white/[0.06] pt-4">
                  <Bone className="h-5 w-20" />
                  <Bone className="h-5 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : layout === "detail" ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="app-panel space-y-5 p-5 lg:col-span-2">
              <Bone className="h-5 w-1/3" />
              <Bone className="h-3 w-2/3" />
              <Bone className="h-12 w-full" />
            </div>
            {[0, 1].map((i) => (
              <div key={i} className="app-panel space-y-5 p-5">
                <Bone className="h-4 w-1/3" />
                <Bone className="h-3 w-full" />
                <Bone className="h-3 w-5/6" />
                <Bone className="h-3 w-2/3" />
                <Bone className="h-24 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="app-panel space-y-4 p-4">
                  <Bone className="h-3 w-20" />
                  <Bone className="h-7 w-12" />
                </div>
              ))}
            </div>
            <div
              className={
                layout === "dashboard" ? "grid gap-6 lg:grid-cols-2" : ""
              }
            >
              <div className="app-panel divide-y divide-white/[0.05]">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="flex items-center gap-4 p-5">
                    <Bone className="h-9 w-9 shrink-0 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <Bone className="h-3 w-2/3" />
                      <Bone className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
              {layout === "dashboard" ? (
                <div className="app-panel space-y-6 p-5">
                  <Bone className="h-4 w-1/3" />
                  <Bone className="h-48 w-full" />
                  <Bone className="h-3 w-2/3" />
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Bone({ className }: { className: string }) {
  return <div className={`app-skeleton rounded-lg ${className}`} />;
}
