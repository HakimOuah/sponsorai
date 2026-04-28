import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: "Vectis Agency — Plateforme IA de sponsoring football",
  description:
    "Plateforme IA pour automatiser la prospection, la qualification et l'outreach sponsoring de sportifs de haut niveau.",
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
