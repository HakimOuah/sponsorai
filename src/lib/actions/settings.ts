"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateProfile(
  userId: string,
  data: { name: string; email: string }
) {
  await prisma.user.update({
    where: { id: userId },
    data: { name: data.name, email: data.email },
  });
  revalidatePath("/settings");
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new Error("Mot de passe actuel incorrect");

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });
}

export async function exportPlayersCSV() {
  const players = await prisma.player.findMany({
    where: { active: true },
    orderBy: { lastName: "asc" },
  });

  const headers = [
    "Prénom",
    "Nom",
    "Club",
    "Ligue",
    "Poste",
    "Nationalité",
    "Âge",
    "Instagram",
    "Followers IG",
    "TikTok",
    "Followers TK",
    "Twitter",
    "Followers X",
    "Engagement",
  ];

  const rows = players.map((p) =>
    [
      p.firstName,
      p.lastName,
      p.club,
      p.league,
      p.position || "",
      p.nationality || "",
      p.age?.toString() || "",
      p.instagram || "",
      p.followersIG?.toString() || "",
      p.tiktok || "",
      p.followersTK?.toString() || "",
      p.twitter || "",
      p.followersX?.toString() || "",
      p.engagementRate?.toString() || "",
    ].join(";")
  );

  return [headers.join(";"), ...rows].join("\n");
}

export async function exportCompaniesCSV() {
  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
  });

  const headers = [
    "Nom",
    "Secteur",
    "Pays",
    "Website",
    "Contact",
    "Rôle",
    "Email",
    "Source",
  ];

  const rows = companies.map((c) =>
    [
      c.name,
      c.sector || "",
      c.country || "",
      c.website || "",
      c.contactName || "",
      c.contactRole || "",
      c.contactEmail || "",
      c.source || "",
    ].join(";")
  );

  return [headers.join(";"), ...rows].join("\n");
}

export async function exportProspectsCSV() {
  const prospects = await prisma.prospect.findMany({
    include: {
      player: { select: { firstName: true, lastName: true } },
      company: { select: { name: true, sector: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Joueur",
    "Marque",
    "Secteur",
    "Score",
    "Priorité",
    "Statut",
    "Type partenariat",
    "Valeur estimée",
  ];

  const rows = prospects.map((p) =>
    [
      `${p.player.firstName} ${p.player.lastName}`,
      p.company.name,
      p.company.sector || "",
      p.score?.toString() || "",
      p.priority || "",
      p.status,
      p.partnershipType || "",
      p.estimatedValue || "",
    ].join(";")
  );

  return [headers.join(";"), ...rows].join("\n");
}
