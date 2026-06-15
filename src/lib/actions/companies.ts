"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isUsableEmailStatus } from "@/lib/agents/contact-quality";

export async function getCompanies(filters?: {
  sector?: string;
  country?: string;
  source?: string;
  search?: string;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.sector) where.sector = filters.sector;
  if (filters?.country) where.country = filters.country;
  if (filters?.source) where.source = filters.source;
  if (filters?.search) {
    where.name = { contains: filters.search, mode: "insensitive" };
  }

  return prisma.company.findMany({
    where,
    include: {
      _count: {
        select: {
          prospects: true,
          deals: true,
          emails: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCompany(id: string) {
  return prisma.company.findUnique({
    where: { id },
    include: {
      prospects: {
        include: {
          player: { select: { firstName: true, lastName: true, club: true } },
        },
        orderBy: { score: "desc" },
      },
      deals: {
        include: {
          player: { select: { firstName: true, lastName: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
      emails: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      _count: {
        select: { prospects: true, deals: true, emails: true },
      },
    },
  });
}

export async function createCompany(formData: FormData) {
  const data = extractCompanyData(formData);
  const company = await prisma.company.create({ data });
  revalidatePath("/companies");
  redirect(`/companies/${company.id}`);
}

export async function updateCompany(id: string, formData: FormData) {
  const data = extractCompanyData(formData);
  await prisma.company.update({ where: { id }, data });
  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
  redirect(`/companies/${id}`);
}

export async function deleteCompany(id: string) {
  await prisma.company.delete({ where: { id } });
  revalidatePath("/companies");
  redirect("/companies");
}

export async function getCompanyFilters() {
  const [sectors, countries] = await Promise.all([
    prisma.company.findMany({
      where: { sector: { not: null } },
      select: { sector: true },
      distinct: ["sector"],
      orderBy: { sector: "asc" },
    }),
    prisma.company.findMany({
      where: { country: { not: null } },
      select: { country: true },
      distinct: ["country"],
      orderBy: { country: "asc" },
    }),
  ]);

  return {
    sectors: sectors.map((s) => s.sector!),
    countries: countries.map((c) => c.country!),
  };
}

function extractCompanyData(formData: FormData) {
  const contactEmail = (formData.get("contactEmail") as string) || null;
  const contactVerificationStatus =
    (formData.get("contactVerificationStatus") as string) || null;
  const contactEmailStatus =
    (formData.get("contactEmailStatus") as string) || "missing";

  return {
    name: formData.get("name") as string,
    sector: (formData.get("sector") as string) || null,
    country: (formData.get("country") as string) || null,
    website: (formData.get("website") as string) || null,
    description: (formData.get("description") as string) || null,
    existingSportsSponsoring:
      (formData.get("existingSportsSponsoring") as string) || null,
    estimatedBudget: (formData.get("estimatedBudget") as string) || null,
    contactName: (formData.get("contactName") as string) || null,
    contactRole: (formData.get("contactRole") as string) || null,
    contactEmail,
    contactVerificationStatus,
    contactEmailStatus,
    outreachReady: Boolean(
      contactEmail &&
        contactVerificationStatus === "verified_current" &&
        isUsableEmailStatus(contactEmailStatus)
    ),
    contactLinkedin: (formData.get("contactLinkedin") as string) || null,
    contactPhone: (formData.get("contactPhone") as string) || null,
    notes: (formData.get("notes") as string) || null,
    source: (formData.get("source") as string) || "manual",
  };
}
