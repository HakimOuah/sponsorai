"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
    select: {
      id: true,
      name: true,
      sector: true,
      country: true,
      website: true,
      source: true,
      outreachReady: true,
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
      contacts: {
        where: { active: true },
        orderBy: [{ contactScore: "desc" }, { relevanceScore: "desc" }],
        select: {
          id: true,
          roleRaw: true,
          roleNormalized: true,
          employmentStatus: true,
          contactability: true,
          relevanceScore: true,
          contactScore: true,
          contactScoreVersion: true,
          source: true,
        },
      },
      sponsorships: {
        orderBy: { observedAt: "desc" },
        take: 10,
      },
      opportunitySignals: {
        orderBy: { detectedAt: "desc" },
        take: 10,
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
  const employeeCountValue = formData.get("employeeCount") as string | null;
  const employeeCount = employeeCountValue ? Number.parseInt(employeeCountValue, 10) : null;
  const allowedSizeBuckets = new Set([
    "unknown",
    "1-10",
    "11-50",
    "51-200",
    "201-1000",
    "1001-5000",
    "5001+",
  ]);
  const requestedSizeBucket = (formData.get("companySizeBucket") as string) || "unknown";

  return {
    name: formData.get("name") as string,
    sector: (formData.get("sector") as string) || null,
    country: (formData.get("country") as string) || null,
    website: (formData.get("website") as string) || null,
    description: (formData.get("description") as string) || null,
    existingSportsSponsoring:
      (formData.get("existingSportsSponsoring") as string) || null,
    estimatedBudget: (formData.get("estimatedBudget") as string) || null,
    employeeCount:
      employeeCount !== null && Number.isFinite(employeeCount) && employeeCount >= 0
        ? employeeCount
        : null,
    companySizeBucket: allowedSizeBuckets.has(requestedSizeBucket)
      ? requestedSizeBucket
      : "unknown",
    notes: (formData.get("notes") as string) || null,
    source: (formData.get("source") as string) || "manual",
  };
}
