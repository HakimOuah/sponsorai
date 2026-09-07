import type { Metadata } from "next";
import { LandingPage, buildLandingMetadata } from "@/components/landing/LandingPage";

export const metadata: Metadata = buildLandingMetadata("en");

export default function EnglishHomePage() {
  return <LandingPage locale="en" />;
}
