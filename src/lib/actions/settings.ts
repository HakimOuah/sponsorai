"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireOperationalAccess } from "@/lib/auth/access";

export async function updateProfile(
  userId: string,
  data: { name: string; email: string }
) {
  const access = await requireOperationalAccess();
  if (access.userId !== userId && !access.isAdmin) {
    throw new Error("FORBIDDEN");
  }
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
  const access = await requireOperationalAccess();
  if (access.userId !== userId && !access.isAdmin) {
    throw new Error("FORBIDDEN");
  }
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

export async function createSendingIdentity(formData: FormData) {
  await requireOperationalAccess();
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) throw new Error("Unauthorized");

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const displayName = String(formData.get("displayName") || "").trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Adresse email invalide");

  const smtpEmail = (process.env.SMTP_FROM || process.env.SMTP_USER || "").toLowerCase();
  const active = smtpEmail === email;
  await prisma.sendingIdentity.upsert({
    where: { email_purpose: { email, purpose: "outreach" } },
    update: {
      userId,
      displayName: displayName || null,
      provider: "smtp",
      credentialRef: active ? "env:SMTP" : null,
      status: active ? "active" : "pending",
      verifiedAt: active ? new Date() : null,
    },
    create: {
      userId,
      email,
      displayName: displayName || null,
      purpose: "outreach",
      provider: "smtp",
      credentialRef: active ? "env:SMTP" : null,
      status: active ? "active" : "pending",
      verifiedAt: active ? new Date() : null,
      isDefault: active,
    },
  });

  revalidatePath("/settings");
}

export async function setDefaultSendingIdentity(identityId: string) {
  await requireOperationalAccess();
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) throw new Error("Unauthorized");

  const identity = await prisma.sendingIdentity.findFirst({
    where: { id: identityId, userId, purpose: "outreach", status: "active" },
  });
  if (!identity) throw new Error("Identity is not active");

  await prisma.$transaction([
    prisma.sendingIdentity.updateMany({
      where: { userId, purpose: "outreach" },
      data: { isDefault: false },
    }),
    prisma.sendingIdentity.update({
      where: { id: identityId },
      data: { isDefault: true },
    }),
  ]);
  revalidatePath("/settings");
}

export async function exportPlayersCSV() {
  await requireOperationalAccess();
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
  await requireOperationalAccess();
  const companies = await prisma.company.findMany({
    select: {
      name: true,
      sector: true,
      country: true,
      website: true,
      source: true,
      companySizeBucket: true,
      contacts: {
        where: { active: true },
        orderBy: [{ contactScore: "desc" }, { relevanceScore: "desc" }],
        select: { roleRaw: true, contactability: true },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  const headers = [
    "Nom",
    "Secteur",
    "Pays",
    "Website",
    "Taille",
    "Rôle décideur",
    "Contactabilité",
    "Source",
  ];

  const rows = companies.map((c) =>
    [
      c.name,
      c.sector || "",
      c.country || "",
      c.website || "",
      c.companySizeBucket,
      c.contacts[0]?.roleRaw || "",
      c.contacts[0]?.contactability || "missing",
      c.source || "",
    ].join(";")
  );

  return [headers.join(";"), ...rows].join("\n");
}

export async function exportProspectsCSV() {
  await requireOperationalAccess();
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
