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
  return name
    .normalize("NFKC")
    .replace(/[-‐‑‒–—―_./\\&+()'’"“”]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("fr-FR");
}

function areEquivalentBrandNames(left: string, right: string): boolean {
  if (left === right) return true;
  const [shorter, longer] = left.length <= right.length
    ? [left, right]
    : [right, left];

  return shorter.length >= 8 && longer.startsWith(`${shorter} `);
}

export function getExcludedBrandNames(rows: EvaluatedBrandRow[]): string[] {
  const seen: string[] = [];

  return rows.reduce<string[]>((names, row) => {
    const name = row.company.name.trim();
    const normalizedName = normalizeBrandName(name);

    if (
      normalizedName
      && !seen.some((existing) => areEquivalentBrandNames(existing, normalizedName))
    ) {
      seen.push(normalizedName);
      names.push(name);
    }

    return names;
  }, []);
}

export function filterAlreadyEvaluatedBrands<T extends Pick<ScoutBrand, "name">>(
  brands: T[],
  excludedBrands: string[]
): T[] {
  const excludedNames = excludedBrands.map(normalizeBrandName);

  return brands.filter(
    (brand) => !excludedNames.some((excludedName) =>
      areEquivalentBrandNames(excludedName, normalizeBrandName(brand.name))
    )
  );
}

export function deduplicateBrandCandidates<
  T extends Pick<ScoutBrand, "name">,
>(brands: T[]): T[] {
  const seen: string[] = [];

  return brands.filter((brand) => {
    const normalizedName = normalizeBrandName(brand.name);
    if (
      !normalizedName
      || seen.some((existing) => areEquivalentBrandNames(existing, normalizedName))
    ) return false;
    seen.push(normalizedName);
    return true;
  });
}
