/**
 * Information légale à renseigner par Vectis avant mise en ligne.
 * Rendu volontairement visible pour qu'aucun placeholder ne passe en production.
 */
export function Todo({ children }: { children: string }) {
  return (
    <mark className="rounded bg-[#FF6B3D]/20 px-1.5 py-0.5 font-mono text-[0.85em] text-[#FFE4D8]">
      [à compléter : {children}]
    </mark>
  );
}

export const LEGAL_UPDATED_AT = "7 septembre 2026";
