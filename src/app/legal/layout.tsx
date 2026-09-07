import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { VectisLogo } from "@/components/brand/VectisLogo";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="landing-theme min-h-screen bg-[#080705] text-[#F6F4EF]">
      <header className="px-5 pt-6 sm:px-8">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between">
          <VectisLogo size="md" />
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] px-4 py-2 text-sm font-medium text-white/[0.76] transition hover:bg-white/[0.07] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF6B3D]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour au site
          </Link>
        </div>
      </header>

      <main className="px-5 pb-24 pt-16 sm:px-8 lg:pt-24">
        <article className="mx-auto max-w-3xl [&_a]:text-[#FF6B3D] [&_a]:underline-offset-4 [&_a:hover]:underline [&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:tracking-[-0.05em] [&_h1]:sm:text-5xl [&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-[-0.04em] [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:leading-7 [&_li]:text-[#D5D7DF]/80 [&_p]:mt-4 [&_p]:leading-7 [&_p]:text-[#D5D7DF]/80 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
          {children}
        </article>
      </main>

      <LandingFooter />
    </div>
  );
}
