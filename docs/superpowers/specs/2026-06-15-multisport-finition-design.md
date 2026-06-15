# Tâche 1 — Finition multi-sport (sportifs & clubs amateurs)

- **Date** : 2026-06-15
- **Statut** : Design validé, prêt pour le plan d'implémentation
- **Branche** : `claude/zealous-rubin` (worktree synchronisé sur `main` @ `3dd9c2a`)
- **Périmètre** : 1ʳᵉ des 3 features. Suivantes : Table Contact (Tâche 2), Email/séquences (Tâche 3).

## 1. Contexte

SponsorAI / **Vectis Agency** est un CRM de sponsoring. Historiquement centré « footballeurs », il a déjà été ouvert au multi-sport à ~80 % lors de sessions précédentes :

- `Player.profileType` (`"athlete"` / `"club"`, défaut `athlete`) et `Player.sport` existent déjà.
- `buildPlayerProfile()` ([prompts.ts:553](../../../src/lib/agents/prompts.ts)) distingue déjà « Club / équipe » vs « Sportif individuel » et inclut le sport.
- Les prompts Scout / Matchmaker / Enrichisseur / enrich parlent déjà d'« athlètes, équipes et clubs amateurs ».
- UI déjà neutralisée : nav « Talents », page « Sportifs, équipes et clubs », `PlayerForm` avec sélecteur de type + labels dynamiques.

Cette tâche **finit** la migration : elle supprime les hypothèses « foot » résiduelles et pousse la finition UI/UX, sans refonte lourde.

## 2. Objectif & périmètre

**Objectif** : qu'un sportif individuel (tout sport) **et** un club amateur soient des profils de première classe, cohérents de bout en bout (données, agents IA, UI).

**Dans le périmètre**
- Rendre `club` / `league` optionnels (un coureur n'a pas de club ; un club n'a pas de « ligue » au sens joueur).
- Champs club optionnels : effectif/licenciés, année de création.
- Taxonomie de sports normalisée (liste + « Autre »).
- Généralisation des prompts (fin du vocabulaire 100 % foot).
- Finition UI : formulaire conditionnel, cartes & fiches type-aware, avatar club distinct, filtres sport/type sur la page Talents.

**Hors périmètre** (features suivantes)
- Table `Contact` multi-décideurs → **Tâche 2**.
- Recherche/vérification d'email, envoi traçable, séquences de relance auto → **Tâche 3**.
- Renommage interne `Player → Profile` / route `/talents` (churn sans valeur utilisateur — décision : on garde `Player`/`/players`).
- Correction du bug `web_search` manquant du Relanceur → **Tâche 3** (territoire relances).

## 3. Approche retenue

**A — Pragmatique / finition** (validée). On garde le modèle `Player` et la route `/players` en interne ; on relâche les contraintes foot et on polit l'UI. Faible risque, migration non destructive, libère l'énergie pour les Tâches 2 & 3 (cœur de valeur).

Rejeté : **B — Refonte propre** (`Player → Profile`, `/talents`, restructuration champs + migration/backfill) — gros diff (~30 fichiers) pour zéro changement visible utilisateur.

## 4. Design détaillé

### 4.1 Modèle de données (`prisma/schema.prisma`, modèle `Player`)

Migration **non destructive** (relâche de contraintes + colonnes nullables) :

```prisma
model Player {
  // ... inchangé ...
  club        String?   // ÉTAIT: String (requis) → optionnel
  league      String?   // ÉTAIT: String (requis) → optionnel
  // sport: String?  (inchangé — l'UI le contraint à une liste connue + "Autre")

  // NOUVEAUX champs club (optionnels, affichés seulement si profileType = "club")
  members      Int?     // effectif / nombre de licenciés
  foundedYear  Int?     // année de création
}
```

- **division** : pas de nouveau champ → on réutilise `league` (déjà relabellisé « Championnat / niveau / division » dans le form).
- Sécurité données : `NOT NULL → NULL` et ajout de colonnes nullables ne détruisent aucune donnée existante. Aucun backfill requis.
- Migration via `prisma migrate dev --name multisport_optional_fields` (Prisma v5).

### 4.2 Taxonomie de sports (`src/lib/sports.ts`, nouveau)

Constante partagée + helper d'affichage :

```ts
export const SPORTS = [
  "Football", "Basket-ball", "Rugby", "Tennis", "Handball", "Volley-ball",
  "Athlétisme", "Cyclisme", "Natation", "Boxe / MMA", "Judo / Arts martiaux",
  "Golf", "Padel", "Ski / Sports d'hiver", "Équitation", "Gymnastique",
  "Aviron", "Escrime", "Esport",
] as const;
// L'UI ajoute une option "Autre" → bascule sur une saisie libre.

export function getSportMeta(sport?: string | null): { emoji: string; color: string };
// renvoie emoji + couleur de badge par famille (ballon, raquette, combat, etc.),
// avec un fallback neutre pour les sports hors liste / "Autre".
```

Stockage : on stocke le **libellé** (string) dans `Player.sport`, pas un enum DB (souplesse + « Autre »).

### 4.3 Agents IA / prompts (`src/lib/agents/prompts.ts`)

- **`RELANCEUR_PROMPT`** : remplacer les exemples 100 % foot (« buts, passes, clean sheets », « Sélection nationale, convocation ») par du sport-agnostique piloté par le profil : « résultat ou performance récente selon le sport, classement, statistique clé, événement/compétition, sélection, post viral, collaboration ». Le sport est déjà injecté via `buildPlayerProfile`.
- **Passe de vérification** sur `SCOUT_*`, `MATCHMAKER_PROMPT`, `ENRICHISSEUR_PROMPT`, `VEILLE_CONCURRENCE_PROMPT`, `VEILLEUR_PROMPT` : déjà génériques — confirmer qu'aucune ne suppose le football et qu'elles exploitent bien type de profil + sport.
- `buildPlayerProfile` : déjà OK (type + sport). Ajouter au profil les nouveaux champs club (`members`, `foundedYear`) quand présents, pour enrichir le contexte des agents.

### 4.4 UI / UX

**Formulaire** (`src/components/players/PlayerForm.tsx`)
- `sport` : `<select>` alimenté par `SPORTS` + option « Autre » → affiche un champ texte libre si « Autre ».
- Champs `members` / `foundedYear` : rendus **uniquement** si `profileType === "club"`.
- `club` / `league` : retirer l'attribut `required` (cohérent avec le schéma optionnel).

**Couche données** (`src/lib/actions/players.ts`)
- `extractPlayerData` : `club`/`league` → `(... as string) || null` ; parser `members`/`foundedYear` en `Int?` (comme `age`).
- `getPlayers(filters?: { sport?: string; profileType?: string })` : filtrer la requête `where` (en gardant `active: true`).
- Nouveau `getPlayerFilters()` : sports distincts présents en base (pour peupler le `<select>` de filtre), sur le modèle de `getCompanyFilters()`.

**Carte profil** (`src/components/players/PlayerCard.tsx`)
- Badge **sport** coloré (via `getSportMeta`).
- **Avatar club distinct** : si `profileType === "club"`, icône (bouclier) + initiales dérivées du nom de club (`firstName`) ; sinon initiales prénom+nom actuelles.
- Ligne secondaire type-aware : club → `sport · niveau · ville` ; sportif → `sport · poste · club`.
- Afficher l'effectif (`members`) comme badge quand club et présent.

**Fiche détaillée** (`src/app/(app)/players/[id]/page.tsx`)
- Header type-aware (avatar club, sous-titre adapté).
- Bloc d'infos club (effectif, année de création) affiché quand `profileType === "club"`.

**Page Talents** (`src/app/(app)/players/page.tsx` + nouveau `src/components/players/PlayerFilters.tsx`)
- Barre de filtres calquée sur `CompanyFilters` : `<select>` sport + `<select>` type (Tous / Sportifs / Clubs), pilotée par `useSearchParams` + `router.push`.
- La page lit `searchParams` et les passe à `getPlayers(filters)`.

## 5. Fichiers touchés (récap)

| Fichier | Nature |
|---|---|
| `prisma/schema.prisma` | club/league nullable + `members`,`foundedYear` |
| `prisma/migrations/*` | migration générée |
| `src/lib/sports.ts` | **nouveau** : taxonomie + `getSportMeta` |
| `src/lib/agents/prompts.ts` | généralisation RELANCEUR + buildPlayerProfile (champs club) |
| `src/lib/actions/players.ts` | extract null-safe, `getPlayers(filters)`, `getPlayerFilters` |
| `src/components/players/PlayerForm.tsx` | select sport + champs club conditionnels |
| `src/components/players/PlayerCard.tsx` | badge sport, avatar club, ligne type-aware |
| `src/components/players/PlayerFilters.tsx` | **nouveau** : filtres sport + type |
| `src/app/(app)/players/page.tsx` | searchParams → filtres + rendu PlayerFilters |
| `src/app/(app)/players/[id]/page.tsx` | header + bloc infos club |

## 6. Vérification

- `npx prisma migrate dev` passe ; `npx prisma generate` régénère le client avec `members`/`foundedYear` et club/league nullables.
- `npm run build` (ou `tsc --noEmit`) sans erreur de type (notamment `Player` côté composants).
- Manuel : créer un profil **sportif individuel** (ex. tennis, sans club) et un **club** (avec effectif) → cartes/fiches cohérentes, filtres fonctionnels, sélecteur de sport + « Autre ».
- Lancer un scan sur un club amateur → vérifier que les prompts ne produisent rien de foot-spécifique et que les sponsors locaux remontent.

## 7. Dépendances & suite

- **Pré-requis** : worktree synchronisé sur `main` ✅ (fait).
- **Tâche 2 (Contact)** dépend de la fin de la Tâche 1.
- **Tâche 3 (Email)** dépend de la Tâche 2.
