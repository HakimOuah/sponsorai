import type { Metadata } from "next";
import { LandingPage, buildLandingMetadata } from "@/components/landing/LandingPage";

export const metadata: Metadata = buildLandingMetadata("fr");

export default function HomePage() {
  return <LandingPage locale="fr" />;
}
