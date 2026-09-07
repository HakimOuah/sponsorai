import Link from "next/link";
import { cn } from "@/lib/utils";
import { localePath, type Locale } from "@/lib/landing-content";

function FlagFR({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
      <rect width="8" height="16" fill="#0055A4" />
      <rect x="8" width="8" height="16" fill="#FFFFFF" />
      <rect x="16" width="8" height="16" fill="#EF4135" />
    </svg>
  );
}

function FlagUS({ className }: { className?: string }) {
  const stripe = 16 / 13;
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
      <rect width="24" height="16" fill="#FFFFFF" />
      {Array.from({ length: 7 }).map((_, index) => (
        <rect
          key={index}
          y={index * 2 * stripe}
          width="24"
          height={stripe}
          fill="#B22234"
        />
      ))}
      <rect width="10.4" height={stripe * 7} fill="#3C3B6E" />
      {Array.from({ length: 12 }).map((_, index) => (
        <circle
          key={index}
          cx={1.5 + (index % 4) * 2.45}
          cy={1.4 + Math.floor(index / 4) * 2.5}
          r="0.55"
          fill="#FFFFFF"
        />
      ))}
    </svg>
  );
}

const options: Array<{
  locale: Locale;
  label: string;
  short: string;
  Flag: typeof FlagFR;
}> = [
  { locale: "fr", label: "Français", short: "FR", Flag: FlagFR },
  { locale: "en", label: "English", short: "EN", Flag: FlagUS },
];

export function LocaleSwitch({
  current,
  label,
  className,
}: {
  current: Locale;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-white/[0.12] bg-black/20 p-1 backdrop-blur-xl",
        className,
      )}
    >
      {options.map(({ locale, label: optionLabel, short, Flag }) => {
        const active = locale === current;
        return (
          <Link
            key={locale}
            href={localePath[locale]}
            hrefLang={locale}
            lang={locale}
            aria-label={optionLabel}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF6B3D]",
              active
                ? "bg-white/[0.12] text-white"
                : "text-white/[0.55] hover:bg-white/[0.07] hover:text-white",
            )}
          >
            <Flag className="h-3.5 w-[21px] rounded-[3px] shadow-[0_0_0_1px_rgba(255,255,255,0.14)]" />
            {short}
          </Link>
        );
      })}
    </div>
  );
}
