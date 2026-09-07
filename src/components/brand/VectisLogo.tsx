import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Marque Vectis : un V dont le bras droit monte plus haut que le gauche,
 * lecture triple (lettre, coche de validation, trajectoire). Le bout détaché
 * en orange est le seul point de couleur. Le trait principal suit
 * `currentColor` pour fonctionner sur fond clair comme sombre.
 */
export function VectisMark({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("h-6 w-6", className)}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M6 11 L14.5 25.5 L23.6 10.5"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M25.2 7.9 L27.6 4"
        stroke="#FF6B3D"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function VectisWordmark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: { word: "text-[15px]", sub: "text-[8px] tracking-[0.24em] mt-[3px]" },
    md: { word: "text-lg", sub: "text-[9px] tracking-[0.26em] mt-1" },
    lg: { word: "text-3xl", sub: "text-[11px] tracking-[0.28em] mt-1.5" },
  }[size];

  return (
    <span className={cn("flex flex-col leading-none", className)}>
      <span
        className={cn(
          "font-semibold tracking-[-0.045em] text-current",
          sizes.word,
        )}
      >
        Vectis
      </span>
      <span
        className={cn(
          "font-medium uppercase text-current opacity-55",
          sizes.sub,
        )}
      >
        Agency
      </span>
    </span>
  );
}

export function VectisLogo({
  href = "/",
  className,
  markClassName,
  size = "md",
}: {
  href?: string | null;
  className?: string;
  markClassName?: string;
  size?: "sm" | "md" | "lg";
}) {
  const markSize = { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-12 w-12" }[size];
  const content = (
    <>
      <VectisMark className={cn(markSize, "shrink-0", markClassName)} />
      <VectisWordmark size={size} />
    </>
  );
  const classes = cn("inline-flex items-center gap-3 text-current", className);

  if (!href) {
    return <span className={classes}>{content}</span>;
  }

  return (
    <Link
      href={href}
      aria-label="Vectis Agency — accueil"
      className={cn(
        classes,
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF6B3D]",
      )}
    >
      {content}
    </Link>
  );
}
