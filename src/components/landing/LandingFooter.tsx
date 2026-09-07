import Link from "next/link";
import { VectisLogo } from "@/components/brand/VectisLogo";
import {
  fill,
  getLandingContent,
  localePath,
  type Locale,
} from "@/lib/landing-content";

export function LandingFooter({ locale = "fr" }: { locale?: Locale }) {
  const year = String(new Date().getFullYear());
  const t = getLandingContent(locale).footer;

  return (
    <footer
      lang={locale}
      className="bg-[#080705] px-5 pb-8 pt-16 text-[#F6F4EF] sm:px-8"
    >
      <div className="mx-auto max-w-[1480px] border-t border-white/[0.08] pt-12">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,0.8fr)]">
          <div className="max-w-sm">
            <VectisLogo size="md" href={localePath[locale]} />
            <p className="mt-5 text-sm leading-6 text-[#969BA8]">{t.tagline}</p>
          </div>

          {t.columns.map((column) => (
            <div key={column.title}>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#FF6B3D]">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#D5D7DF]/72 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF6B3D]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/[0.08] pt-6 text-xs text-[#969BA8] sm:flex-row sm:items-center sm:justify-between">
          <p>{fill(t.rights, { year })}</p>
          <p>{t.note}</p>
        </div>
      </div>
    </footer>
  );
}
