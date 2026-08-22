"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOperationalAccess } from "@/lib/auth/access";

export async function getPlayers() {
  return prisma.player.findMany({
    where: { active: true },
    include: {
      _count: {
        select: {
          deals: true,
          prospects: true,
          scans: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getPlayer(id: string) {
  return prisma.player.findUnique({
    where: { id },
    include: {
      deals: {
        include: { company: { select: { id: true, name: true } } },
        orderBy: { updatedAt: "desc" },
      },
      prospects: {
        include: { company: { select: { id: true, name: true } } },
        orderBy: { score: "desc" },
        take: 20,
      },
      scans: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      intelligenceSnapshots: {
        orderBy: { capturedAt: "desc" },
        take: 3,
      },
      traits: {
        where: { active: true },
        orderBy: { confidence: "desc" },
      },
      socialAccounts: {
        orderBy: { capturedAt: "desc" },
      },
      _count: {
        select: {
          deals: true,
          prospects: true,
          scans: true,
        },
      },
    },
  });
}

export async function createPlayer(formData: FormData) {
  await requireOperationalAccess();
  const data = extractPlayerData(formData);

  const player = await prisma.player.create({ data });

  revalidatePath("/players");
  redirect(`/players/${player.id}`);
}

export async function updatePlayer(id: string, formData: FormData) {
  await requireOperationalAccess();
  const data = extractPlayerData(formData);

  await prisma.player.update({
    where: { id },
    data,
  });

  revalidatePath("/players");
  revalidatePath(`/players/${id}`);
  redirect(`/players/${id}`);
}

export async function archivePlayer(id: string) {
  await requireOperationalAccess();
  await prisma.player.update({
    where: { id },
    data: { active: false },
  });

  revalidatePath("/players");
  redirect("/players");
}

function extractPlayerData(formData: FormData) {
  const profileType = (formData.get("profileType") as string) || "athlete";
  const firstName = ((formData.get("firstName") as string) || "").trim();
  const lastName = ((formData.get("lastName") as string) || "").trim();

  return {
    profileType,
    sport: ((formData.get("sport") as string) || "").trim() || null,
    firstName,
    lastName: lastName || (profileType === "club" ? "Club" : ""),
    club: formData.get("club") as string,
    league: formData.get("league") as string,
    position: (formData.get("position") as string) || null,
    age: formData.get("age") ? parseInt(formData.get("age") as string) : null,
    nationality: (formData.get("nationality") as string) || null,
    city: (formData.get("city") as string) || null,
    instagram: (formData.get("instagram") as string) || null,
    followersIG: formData.get("followersIG")
      ? parseInt(formData.get("followersIG") as string)
      : null,
    tiktok: (formData.get("tiktok") as string) || null,
    followersTK: formData.get("followersTK")
      ? parseInt(formData.get("followersTK") as string)
      : null,
    twitter: (formData.get("twitter") as string) || null,
    followersX: formData.get("followersX")
      ? parseInt(formData.get("followersX") as string)
      : null,
    engagementRate: formData.get("engagementRate")
      ? parseFloat(formData.get("engagementRate") as string)
      : null,
    positioning: (formData.get("positioning") as string) || null,
    targetPartnerships:
      (formData.get("targetPartnerships") as string) || null,
    languages: (formData.get("languages") as string) || null,
    notes: (formData.get("notes") as string) || null,
  };
}
