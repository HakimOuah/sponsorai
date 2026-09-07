import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: "Vectis Agency — Trouvez et signez des sponsors pour vos sportifs",
  description:
    "Vectis trouve les marques cohérentes avec chaque sportif, identifie le décideur, rédige le premier contact et suit chaque opportunité jusqu'au contrat. Six agents IA, validation humaine avant chaque envoi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
