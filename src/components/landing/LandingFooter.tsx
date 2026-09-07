import Link from "next/link";
import { VectisLogo } from "@/components/brand/VectisLogo";

const columns: Array<{
  title: string;
  links: Array<{ label: string; href: string }>;
}> = [
  {
    title: "Plateforme",
    links: [
      { label: "Présentation", href: "/#overview" },
      { label: "Méthode", href: "/#technology" },
      { label: "Agents", href: "/#agents" },
      { label: "Comment ça marche", href: "/#resources" },
      { label: "Connexion", href: "/login" },
    ],
  },
  {
    title: "Contact",
    links: [
      { label: "contact@vectis.agency", href: "mailto:contact@vectis.agency" },
      {
        label: "Réserver une démo",
        href: "mailto:contact@vectis.agency?subject=Démo%20Vectis%20Agency",
      },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Mentions légales", href: "/legal/mentions-legales" },
      { label: "Politique de confidentialité", href: "/legal/confidentialite" },
      { label: "Conditions d'utilisation", href: "/legal/cgu" },
    ],
  },
];

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#080705] px-5 pb-8 pt-16 text-[#F6F4EF] sm:px-8">
      <div className="mx-auto max-w-[1480px] border-t border-white/[0.08] pt-12">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,0.8fr)]">
          <div className="max-w-sm">
            <VectisLogo size="md" />
            <p className="mt-5 text-sm leading-6 text-[#969BA8]">
              Prospection sponsoring pour les représentants de sportifs. Six
              agents IA trouvent les marques, identifient le décideur et suivent
              chaque opportunité jusqu&apos;au contrat. Vous validez chaque envoi.
            </p>
          </div>

          {columns.map((column) => (
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
          <p>© {year} Vectis Agency. Tous droits réservés.</p>
          <p>Coordonnées des décideurs jamais exposées. Validation humaine avant chaque envoi.</p>
        </div>
      </div>
    </footer>
  );
}
