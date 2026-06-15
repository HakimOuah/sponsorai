# Tâche 1 — Finition multi-sport — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ouvrir le CRM aux sportifs individuels (tout sport) et aux clubs amateurs comme profils de première classe, sans refonte du modèle `Player`.

**Architecture:** Approche pragmatique — on garde le modèle `Player` et la route `/players`. On relâche les contraintes « foot » (club/league optionnels), on ajoute des champs club optionnels, une taxonomie de sports partagée, on dé-footballise les prompts et on rend l'UI « type-aware » (sportif vs club) avec filtres.

**Tech Stack:** Next.js 14 (App Router, Server Actions), Prisma v5 (PostgreSQL), TypeScript, Tailwind v3, lucide-react.

**Spec de référence:** [docs/superpowers/specs/2026-06-15-multisport-finition-design.md](../specs/2026-06-15-multisport-finition-design.md)

**Note vérification:** Le projet n'a **aucun framework de test** (pas de jest/vitest). La vérification de chaque tâche se fait donc par **`npm run build`** (Next.js lance `tsc` + lint), `npx prisma generate`, et contrôles manuels. On n'introduit pas de harnais de test (hors périmètre / YAGNI).

---

### Task 0: Prérequis environnement (worktree)

Le worktree n'a ni `node_modules`, ni `.env`, et le client Prisma n'est pas généré. La DB Postgres n'est pas lancée.

**Files:** aucun (setup).

- [ ] **Step 1: Installer les dépendances** (cache npm dédié — cf. problème EACCES connu)

Run:
```bash
cd /Users/Hakim/sponsorai/.claude/worktrees/zealous-rubin
npm config set cache /tmp/npm-cache-sponsorai
npm install
```
Expected: install OK ; `postinstall` lance `prisma generate`.

- [ ] **Step 2: Fournir un `.env`** (réutiliser celui du repo principal)

Run:
```bash
cp /Users/Hakim/sponsorai/.env /Users/Hakim/sponsorai/.claude/worktrees/zealous-rubin/.env
```
Expected: `.env` présent (gitignored). Contient `DATABASE_URL`, `ANTHROPIC_API_KEY`, SMTP, etc.

- [ ] **Step 3: Vérifier que le build de base passe AVANT toute modif**

Run: `npm run build`
Expected: build OK (baseline verte). Si échec → résoudre l'environnement avant de continuer.

- [ ] **Step 4: (Best-effort) lancer la DB pour pouvoir migrer plus tard**

Run: `docker compose up -d db` (si Docker dispo)
Expected: Postgres up sur 5432. Si Docker indisponible, on documente : la migration sera appliquée par l'utilisateur quand la DB tournera (`npm run db:migrate`). Le code reste typecheckable sans DB grâce à `prisma generate`.

---

### Task 1: Schéma Prisma — champs optionnels + champs club

**Files:**
- Modify: `prisma/schema.prisma` (modèle `Player`)
- Generated: `prisma/migrations/*`, client Prisma

- [ ] **Step 1: Rendre `club`/`league` optionnels et ajouter les champs club**

Dans `model Player`, remplacer les lignes `club` et `league`, et ajouter deux champs après `position` :
```prisma
  club               String?
  league             String?
  position           String?
  members            Int?
  foundedYear        Int?
```
(Seul changement : `String` → `String?` sur `club` et `league` ; ajout de `members` et `foundedYear`.)

- [ ] **Step 2: Régénérer le client Prisma (offline, sans DB)**

Run: `npx prisma generate`
Expected: client régénéré ; `Player.club`/`league` deviennent `string | null`, `members`/`foundedYear` `number | null`.

- [ ] **Step 3: Créer + appliquer la migration (si DB up)**

Run: `npx prisma migrate dev --name multisport_optional_fields`
Expected: migration créée et appliquée. **Si la DB est down** : sauter cette étape, créer la migration plus tard ; le `prisma generate` du Step 2 suffit pour que le code compile. Documenter dans le commit.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): club/league optionnels + champs club (members, foundedYear)"
```

---

### Task 2: Taxonomie de sports partagée

**Files:**
- Create: `src/lib/sports.ts`

- [ ] **Step 1: Créer `src/lib/sports.ts`**

```ts
export const SPORTS = [
  "Football",
  "Basket-ball",
  "Rugby",
  "Tennis",
  "Handball",
  "Volley-ball",
  "Athlétisme",
  "Cyclisme",
  "Natation",
  "Boxe / MMA",
  "Judo / Arts martiaux",
  "Golf",
  "Padel",
  "Ski / Sports d'hiver",
  "Équitation",
  "Gymnastique",
  "Aviron",
  "Escrime",
  "Esport",
] as const;

export type KnownSport = (typeof SPORTS)[number];

export function isKnownSport(sport?: string | null): sport is KnownSport {
  return !!sport && (SPORTS as readonly string[]).includes(sport);
}

type SportMeta = { emoji: string; color: string };

const SPORT_META: Record<string, SportMeta> = {
  Football: { emoji: "⚽", color: "#3EF2A0" },
  "Basket-ball": { emoji: "🏀", color: "#f59e0b" },
  Rugby: { emoji: "🏉", color: "#8b5cf6" },
  Tennis: { emoji: "🎾", color: "#a3e635" },
  Handball: { emoji: "🤾", color: "#38bdf8" },
  "Volley-ball": { emoji: "🏐", color: "#fb923c" },
  Athlétisme: { emoji: "🏃", color: "#f43f5e" },
  Cyclisme: { emoji: "🚴", color: "#22d3ee" },
  Natation: { emoji: "🏊", color: "#3b82f6" },
  "Boxe / MMA": { emoji: "🥊", color: "#ef4444" },
  "Judo / Arts martiaux": { emoji: "🥋", color: "#e879f9" },
  Golf: { emoji: "⛳", color: "#84cc16" },
  Padel: { emoji: "🎾", color: "#2dd4bf" },
  "Ski / Sports d'hiver": { emoji: "🎿", color: "#60a5fa" },
  Équitation: { emoji: "🐎", color: "#d97706" },
  Gymnastique: { emoji: "🤸", color: "#f472b6" },
  Aviron: { emoji: "🚣", color: "#0ea5e9" },
  Escrime: { emoji: "🤺", color: "#c084fc" },
  Esport: { emoji: "🎮", color: "#a78bfa" },
};

const DEFAULT_META: SportMeta = { emoji: "🏅", color: "#8FA69E" };

export function getSportMeta(sport?: string | null): SportMeta {
  if (!sport) return DEFAULT_META;
  return SPORT_META[sport] ?? DEFAULT_META;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: pas d'erreur.

- [ ] **Step 3: Commit**

```bash
git add src/lib/sports.ts
git commit -m "feat(sports): taxonomie de sports partagée + getSportMeta"
```

---

### Task 3: Couche données profils (`players.ts`)

**Files:**
- Modify: `src/lib/actions/players.ts`

- [ ] **Step 1: `getPlayers` accepte des filtres**

Remplacer la fonction `getPlayers` (lignes ~7-21) par :
```ts
export async function getPlayers(filters?: {
  sport?: string;
  profileType?: string;
}) {
  return prisma.player.findMany({
    where: {
      active: true,
      ...(filters?.sport ? { sport: filters.sport } : {}),
      ...(filters?.profileType ? { profileType: filters.profileType } : {}),
    },
    include: {
      _count: { select: { deals: true, prospects: true, scans: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}
```

- [ ] **Step 2: Ajouter `getPlayerFilters`** (après `getPlayer`)

```ts
export async function getPlayerFilters() {
  const sports = await prisma.player.findMany({
    where: { active: true, sport: { not: null } },
    select: { sport: true },
    distinct: ["sport"],
    orderBy: { sport: "asc" },
  });
  return { sports: sports.map((s) => s.sport!).filter(Boolean) };
}
```

- [ ] **Step 3: `extractPlayerData` — null-safe club/league + champs club**

Dans `extractPlayerData`, remplacer les lignes `club` et `league` et ajouter `members`/`foundedYear` :
```ts
    club: ((formData.get("club") as string) || "").trim() || null,
    league: ((formData.get("league") as string) || "").trim() || null,
    members: formData.get("members")
      ? parseInt(formData.get("members") as string)
      : null,
    foundedYear: formData.get("foundedYear")
      ? parseInt(formData.get("foundedYear") as string)
      : null,
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: pas d'erreur (le client Prisma de Task 1 accepte `club: string | null` et les nouveaux champs).

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/players.ts
git commit -m "feat(players): filtres getPlayers + champs club, club/league null-safe"
```

---

### Task 4: Formulaire profil (`PlayerForm.tsx`)

**Files:**
- Modify: `src/components/players/PlayerForm.tsx`

- [ ] **Step 1: Importer la taxonomie**

En haut, après les imports existants :
```tsx
import { SPORTS, isKnownSport } from "@/lib/sports";
```

- [ ] **Step 2: Ajouter `members`/`foundedYear` au type et à l'état**

Dans `type PlayerFormValues`, ajouter après `position: string;` :
```tsx
  members: string;
  foundedYear: string;
```
Dans l'init `useState`, ajouter après `position: player?.position ?? "",` :
```tsx
    members: player?.members?.toString() ?? "",
    foundedYear: player?.foundedYear?.toString() ?? "",
```

- [ ] **Step 3: État du mode sport (liste vs Autre)**

Après la déclaration de `values`/`updateField`, ajouter :
```tsx
const [sportMode, setSportMode] = useState<"list" | "custom">(
  player?.sport && !isKnownSport(player.sport) ? "custom" : "list"
);
```

- [ ] **Step 4: Remplacer le champ Sport par un select + Autre**

Dans la section Identité, remplacer le `<Field ... name="sport" ... />` par ce bloc. Le `<input type="hidden" name="sport">` porte la valeur réellement soumise ; le select pilote seulement l'UI :
```tsx
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">Sport</label>
            <input type="hidden" name="sport" value={values.sport} />
            <select
              value={sportMode === "custom" ? "__other__" : values.sport}
              onChange={(e) => {
                if (e.target.value === "__other__") {
                  setSportMode("custom");
                  updateField("sport", "");
                } else {
                  setSportMode("list");
                  updateField("sport", e.target.value);
                }
              }}
              className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.045] px-3 py-2 text-sm text-white transition-colors focus:border-[#3EF2A0]/50 focus:outline-none"
            >
              <option value="" className="bg-[#020403]">—</option>
              {SPORTS.map((s) => (
                <option key={s} value={s} className="bg-[#020403]">{s}</option>
              ))}
              <option value="__other__" className="bg-[#020403]">Autre…</option>
            </select>
            {sportMode === "custom" && (
              <input
                value={values.sport}
                onChange={(e) => updateField("sport", e.target.value)}
                placeholder="Précise le sport"
                className="mt-2 w-full rounded-2xl border border-white/[0.10] bg-white/[0.045] px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#3EF2A0]/50 focus:outline-none transition-colors"
              />
            )}
          </div>
```

- [ ] **Step 5: Retirer `required` sur club et league**

Sur les deux `<Field ... name="club" ... required />` et `name="league" ... required` de la section Identité, supprimer l'attribut `required`.

- [ ] **Step 6: Champs club conditionnels**

Juste après le `<Field ... name="position" ... />` de la section Identité, ajouter :
```tsx
          {values.profileType === "club" && (
            <>
              <Field label="Effectif / licenciés" name="members" type="number" value={values.members} onChange={updateField} />
              <Field label="Année de création" name="foundedYear" type="number" value={values.foundedYear} onChange={updateField} />
            </>
          )}
```

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 8: Commit**

```bash
git add src/components/players/PlayerForm.tsx
git commit -m "feat(form): select sport + Autre, champs club conditionnels, club/league non requis"
```

---

### Task 5: Carte profil type-aware (`PlayerCard.tsx`)

**Files:**
- Modify: `src/components/players/PlayerCard.tsx`

- [ ] **Step 1: Imports**

Ajouter `Shield` à l'import lucide et importer la taxonomie :
```tsx
import { Camera, AtSign, Shield } from "lucide-react";
import { getSportMeta } from "@/lib/sports";
```

- [ ] **Step 2: Dérivés type-aware** (remplacer le calcul `initials`/`profileLabel`)

```tsx
  const isClub = player.profileType === "club";
  const initials = isClub
    ? player.firstName
        .trim()
        .split(/\s+/)
        .map((w) => w.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : (player.firstName.charAt(0) + player.lastName.charAt(0)).toUpperCase();
  const profileLabel = isClub ? "Club" : "Sportif";
  const sportMeta = getSportMeta(player.sport);
```

- [ ] **Step 3: Avatar distinct club**

Remplacer le `<div>` avatar (initiales) par :
```tsx
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-lg font-semibold shadow-[0_0_28px_rgba(62,242,160,0.08)] ${
            isClub
              ? "border-[#f59e0b]/25 bg-[#f59e0b]/10 text-[#f59e0b]"
              : "border-[#3EF2A0]/20 bg-[#3EF2A0]/10 text-[#3EF2A0]"
          }`}
        >
          {isClub ? <Shield className="h-5 w-5" /> : initials}
        </div>
```

- [ ] **Step 4: Badge sport dans la rangée de badges**

Dans la `Stats row`, juste avant le badge `league`, ajouter un badge sport (couleur dynamique). Remplacer l'ouverture du bloc badges par :
```tsx
      <div className="mt-4 flex items-center gap-3">
        {player.sport && (
          <span
            className="rounded-full border px-2.5 py-1 font-mono text-[11px]"
            style={{
              borderColor: `${sportMeta.color}40`,
              backgroundColor: `${sportMeta.color}1a`,
              color: sportMeta.color,
            }}
          >
            {sportMeta.emoji} {player.sport}
          </span>
        )}
```
(le reste de la rangée — badges `league`, `profileLabel`, `nationality` — reste tel quel, et `{player.league && ...}` gère déjà l'absence de ligue.)

- [ ] **Step 5: Badge effectif (club)**

Juste après le badge `nationality`, ajouter :
```tsx
        {isClub && player.members ? (
          <span className="rounded-full border border-white/[0.10] bg-white/[0.045] px-2.5 py-1 font-mono text-[11px] text-[#D8DEDA]/70">
            {player.members} licenciés
          </span>
        ) : null}
```

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 7: Commit**

```bash
git add src/components/players/PlayerCard.tsx
git commit -m "feat(card): badge sport, avatar club distinct, effectif"
```

---

### Task 6: Filtres + page Talents

**Files:**
- Create: `src/components/players/PlayerFilters.tsx`
- Modify: `src/app/(app)/players/page.tsx`

- [ ] **Step 1: Créer `PlayerFilters.tsx`** (calqué sur `CompanyFilters`)

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface PlayerFiltersProps {
  sports: string[];
}

export function PlayerFilters({ sports }: PlayerFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/players?${params.toString()}`);
  }

  return (
    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex xl:items-center">
      <select
        defaultValue={searchParams.get("profileType") || ""}
        onChange={(e) => update("profileType", e.target.value)}
        className="w-full rounded-full border border-white/[0.10] bg-white/[0.045] px-3 py-2.5 text-sm text-white focus:border-[#3EF2A0]/50 focus:outline-none transition-colors xl:w-auto xl:py-2"
      >
        <option value="">Tous types</option>
        <option value="athlete">Sportifs</option>
        <option value="club">Clubs</option>
      </select>

      <select
        defaultValue={searchParams.get("sport") || ""}
        onChange={(e) => update("sport", e.target.value)}
        className="w-full rounded-full border border-white/[0.10] bg-white/[0.045] px-3 py-2.5 text-sm text-white focus:border-[#3EF2A0]/50 focus:outline-none transition-colors xl:w-auto xl:py-2"
      >
        <option value="">Tous sports</option>
        {sports.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 2: Câbler la page Talents**

Dans `src/app/(app)/players/page.tsx` : importer les filtres + `getPlayerFilters`, lire `searchParams`, passer les filtres à `getPlayers`, rendre `<PlayerFilters>`.

Remplacer les imports + signature + récupération de données :
```tsx
import { getPlayers, getPlayerFilters } from "@/lib/actions/players";
import { PlayerCard } from "@/components/players/PlayerCard";
import { PlayerFilters } from "@/components/players/PlayerFilters";

export const dynamic = "force-dynamic";

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: { sport?: string; profileType?: string };
}) {
  const [players, filters] = await Promise.all([
    getPlayers({ sport: searchParams.sport, profileType: searchParams.profileType }),
    getPlayerFilters(),
  ]);
```
Puis, juste avant la grille (`players.length === 0 ? ...`), insérer le rendu des filtres (uniquement s'il y a des profils ou un filtre actif) :
```tsx
      {(filters.sports.length > 0 || players.length > 0) && (
        <PlayerFilters sports={filters.sports} />
      )}
```
(Conserver `Users`/`Plus` et le reste du JSX existant.)

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 4: Commit**

```bash
git add src/components/players/PlayerFilters.tsx "src/app/(app)/players/page.tsx"
git commit -m "feat(talents): filtres sport + type sur la liste"
```

---

### Task 7: Fiche détaillée type-aware

**Files:**
- Modify: `src/app/(app)/players/[id]/page.tsx`

- [ ] **Step 1: Imports**

Ajouter `Shield` à l'import lucide existant et importer la taxonomie :
```tsx
import { Pencil, ArrowLeft, Globe, MapPin, ScanLine, Shield } from "lucide-react";
import { getSportMeta } from "@/lib/sports";
```

- [ ] **Step 2: Dérivés type-aware** (après `const initials = ...`, remplacer le calcul d'initiales par une version club-aware)

Remplacer `const initials = player.firstName.charAt(0) + player.lastName.charAt(0);` par :
```tsx
  const isClub = player.profileType === "club";
  const initials = isClub
    ? player.firstName.trim().split(/\s+/).map((w) => w.charAt(0)).slice(0, 2).join("").toUpperCase()
    : (player.firstName.charAt(0) + player.lastName.charAt(0)).toUpperCase();
  const sportMeta = getSportMeta(player.sport);
```

- [ ] **Step 3: Avatar du header club-aware**

Dans le header, remplacer le `<div>` avatar par :
```tsx
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold sm:h-16 sm:w-16 sm:text-2xl ${
              isClub ? "bg-[#f59e0b]/10 text-[#f59e0b]" : "bg-[#3EF2A0]/10 text-[#3EF2A0]"
            }`}
          >
            {isClub ? <Shield className="h-6 w-6 sm:h-7 sm:w-7" /> : initials}
          </div>
```

- [ ] **Step 4: Sous-titre type-aware avec sport**

Dans la ligne d'infos du header, remplacer le premier `<span>{player.position && ...}{player.club}</span>` par un span qui inclut le sport et tolère les champs nuls :
```tsx
              <span>
                {player.sport && `${sportMeta.emoji} ${player.sport}`}
                {player.position && ` · ${player.position}`}
                {player.club && ` · ${player.club}`}
              </span>
```

- [ ] **Step 5: Bloc infos club** (effectif / création)

Dans la grille « Info sections », juste après le panneau « Positionnement », ajouter un panneau conditionnel :
```tsx
        {isClub && (player.members || player.foundedYear) && (
          <div className="app-panel p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8FA69E] mb-3">
              Le club
            </h2>
            <div className="space-y-3">
              {player.members && (
                <div>
                  <p className="text-xs text-[#8FA69E] mb-1">Effectif / licenciés</p>
                  <p className="text-sm text-white/70">{player.members}</p>
                </div>
              )}
              {player.foundedYear && (
                <div>
                  <p className="text-xs text-[#8FA69E] mb-1">Année de création</p>
                  <p className="text-sm text-white/70">{player.foundedYear}</p>
                </div>
              )}
            </div>
          </div>
        )}
```

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(app)/players/[id]/page.tsx"
git commit -m "feat(fiche): header type-aware + bloc infos club"
```

---

### Task 8: Généralisation des prompts (dé-footballisation)

**Files:**
- Modify: `src/lib/agents/prompts.ts`

- [ ] **Step 1: `RELANCEUR_PROMPT` — exemples sport-agnostiques**

Dans `RELANCEUR_PROMPT`, remplacer la liste d'exemples 100 % foot par une version pilotée par le sport. Remplacer le bloc :
```
- Performance en match (buts, passes, clean sheets, stats)
- Posts viraux sur les réseaux sociaux
- Sélection nationale, convocation
- Interview, apparition médiatique
- Collaboration ou événement
- Buzz, trending topics
```
par :
```
- Performance ou résultat récent ADAPTÉ AU SPORT du profil (victoire, podium, classement, record, stat clé, titre, montée)
- Sélection / convocation / qualification, ou pour un club : résultat d'équipe, événement, tournoi
- Posts viraux ou forte interaction sur les réseaux sociaux
- Interview, apparition médiatique, reportage
- Collaboration, partenariat ou événement récent
- Buzz, trending topics, temps fort de la communauté locale
```

- [ ] **Step 2: `buildPlayerProfile` — inclure les champs club**

Dans `buildPlayerProfile`, étendre la signature (ajouter `members`/`foundedYear` au type du paramètre) et ajouter deux lignes dans le tableau `lines` après la ligne `position` :
```ts
    player.members ? `Effectif / licenciés : ${player.members}` : null,
    player.foundedYear ? `Année de création : ${player.foundedYear}` : null,
```
Et dans le type inline du paramètre, ajouter :
```ts
  members?: number | null;
  foundedYear?: number | null;
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: pas d'erreur (les appelants passent un `Player` complet qui contient déjà ces champs).

- [ ] **Step 4: Commit**

```bash
git add src/lib/agents/prompts.ts
git commit -m "feat(prompts): relances sport-agnostiques + champs club dans le profil agent"
```

---

### Task 9: Vérification finale + merge sur main

**Files:** aucun (intégration).

- [ ] **Step 1: Build complet**

Run: `npm run build`
Expected: build OK, zéro erreur de type/lint.

- [ ] **Step 2: Checklist manuelle** (si DB up + `npm run dev`)

- Créer un profil **sportif individuel** sans club (ex. Tennis) → formulaire accepte club/league vides ; sélecteur de sport + « Autre » fonctionnent.
- Créer un profil **club** avec effectif + année → carte montre l'avatar bouclier + badge sport + « N licenciés » ; fiche montre le bloc « Le club ».
- Page Talents : filtrer par sport et par type → la liste se met à jour.
- (Optionnel) Lancer un scan sur un club → logs sans vocabulaire foot.

- [ ] **Step 3: Appliquer la migration si pas encore fait** (DB up)

Run: `npm run db:migrate`
Expected: migration `multisport_optional_fields` appliquée.

- [ ] **Step 4: Merge sur `main` + push**

```bash
cd /Users/Hakim/sponsorai
git checkout main
git merge --no-ff claude/zealous-rubin -m "feat: finition multi-sport (sportifs & clubs amateurs)"
git push origin main
```
Expected: `main` contient la Tâche 1 ; push OK sur `origin/main`.

---

## Self-Review

**Spec coverage** (chaque exigence de la spec → tâche) :
- club/league optionnels → Task 1 ✅
- members/foundedYear → Task 1 (schéma), 3 (extract), 4 (form), 5/7 (affichage) ✅
- division = réutilise league → respecté (pas de champ ajouté) ✅
- Taxonomie sports + getSportMeta → Task 2 ✅
- Prompts dé-footballisés + sport injecté → Task 8 ✅
- Form select sport + Autre + champs club conditionnels + club/league non requis → Task 4 ✅
- Carte : badge sport, avatar club, ligne type-aware, effectif → Task 5 ✅
- Fiche : header type-aware + bloc club → Task 7 ✅
- Filtres sport + type sur Talents → Task 6 ✅
- Merge sur main → Task 9 ✅

**Placeholder scan :** aucun TODO/TBD ; tout le code est fourni.

**Type consistency :** `getSportMeta`/`isKnownSport`/`SPORTS` (Task 2) utilisés identiquement en 4/5/7 ; `getPlayers(filters)` & `getPlayerFilters` (Task 3) consommés en 6 ; champs `members`/`foundedYear` cohérents schéma↔extract↔form↔affichage↔prompt.

**Risque connu :** migration DB non applicable tant que Postgres est down → Task 1 Step 3 / Task 9 Step 3 documentent l'application différée ; le code reste typecheckable via `prisma generate`.
