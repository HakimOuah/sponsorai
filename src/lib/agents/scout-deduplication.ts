import type { ScoutBrand } from "@/types";

export interface EvaluatedBrandRow {
  company: {
    name: string;
  };
}

export function buildEvaluatedBrandsQuery(playerId: string) {
  return {
    where: { playerId },
    select: {
      company: {
        select: { name: true },
      },
    },
  } as const;
}

export function normalizeBrandName(name: string): string {
  return name.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("fr-FR");
}

export function getExcludedBrandNames(rows: EvaluatedBrandRow[]): string[] {
  const seen = new Set<string>();

  return rows.reduce<string[]>((names, row) => {
    const name = row.company.name.trim();
    const normalizedName = normalizeBrandName(name);

    if (normalizedName && !seen.has(normalizedName)) {
      seen.add(normalizedName);
      names.push(name);
    }

    return names;
  }, []);
}

export function filterAlreadyEvaluatedBrands<T extends Pick<ScoutBrand, "name">>(
  brands: T[],
  excludedBrands: string[]
): T[] {
  const excludedNames = new Set(excludedBrands.map(normalizeBrandName));

  return brands.filter(
    (brand) => !excludedNames.has(normalizeBrandName(brand.name))
  );
}
