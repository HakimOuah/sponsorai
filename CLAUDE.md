# CLAUDE.md — SponsorAI

## Projet

SponsorAI est un CRM/backoffice SaaS vertical pour la gestion de sponsoring de footballeurs professionnels. L'outil permet à un agent sportif de gérer son portefeuille de joueurs, trouver automatiquement des marques partenaires via des agents IA, générer des mails de prospection personnalisés, envoyer et suivre les campagnes d'outreach, et piloter son pipeline de deals.

## Stack technique

- **Framework** : Next.js 14 (App Router)
- **Language** : TypeScript
- **Base de données** : PostgreSQL
- **ORM** : Prisma
- **UI** : Tailwind CSS + shadcn/ui
- **Auth** : NextAuth.js (credentials pour le MVP, extensible OAuth)
- **API IA** : Anthropic Claude API (claude-sonnet-4-20250514) avec web search
- **Email** : Nodemailer (SMTP configurable) ou Resend
- **Déploiement** : Docker + Docker Compose sur VPS
- **State management** : React Server Components + Server Actions (pas de Redux)

## Architecture fichiers

```
sponsorai/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Layout principal avec sidebar
│   │   ├── page.tsx                # Redirect vers /dashboard
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx            # KPIs, briefing du jour, actions requises
│   │   ├── players/
│   │   │   ├── page.tsx            # Liste joueurs
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Fiche joueur détaillée
│   │   ├── companies/
│   │   │   ├── page.tsx            # Liste entreprises/marques
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Fiche entreprise
│   │   ├── pipeline/
│   │   │   └── page.tsx            # Vue Kanban des deals
│   │   ├── prospection/
│   │   │   └── page.tsx            # Résultats agents + matching
│   │   ├── emails/
│   │   │   ├── page.tsx            # Inbox + envois + templates
│   │   │   └── templates/
│   │   │       └── page.tsx
│   │   ├── agents/
│   │   │   └── page.tsx            # Console agents IA
│   │   ├── analytics/
│   │   │   └── page.tsx            # Stats, taux de réponse, CA
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── api/
│   │       ├── agents/
│   │       │   ├── scout/route.ts
│   │       │   ├── matchmaker/route.ts
│   │       │   └── writer/route.ts
│   │       ├── emails/
│   │       │   ├── send/route.ts
│   │       │   └── check/route.ts
│   │       └── auth/[...nextauth]/route.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── BreadcrumbNav.tsx
│   │   ├── dashboard/
│   │   │   ├── KPICards.tsx
│   │   │   ├── DailyBriefing.tsx
│   │   │   ├── ActionsList.tsx
│   │   │   └── RecentActivity.tsx
│   │   ├── players/
│   │   │   ├── PlayerCard.tsx
│   │   │   ├── PlayerForm.tsx
│   │   │   └── PlayerStats.tsx
│   │   ├── companies/
│   │   │   ├── CompanyCard.tsx
│   │   │   └── CompanyForm.tsx
│   │   ├── pipeline/
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── KanbanColumn.tsx
│   │   │   └── DealCard.tsx
│   │   ├── prospection/
│   │   │   ├── BrandResultCard.tsx
│   │   │   └── ScoreRadar.tsx
│   │   ├── emails/
│   │   │   ├── EmailComposer.tsx
│   │   │   ├── EmailTimeline.tsx
│   │   │   └── TemplateEditor.tsx
│   │   ├── agents/
│   │   │   ├── AgentCard.tsx
│   │   │   └── ConsoleLog.tsx
│   │   └── ui/                     # shadcn components
│   ├── lib/
│   │   ├── prisma.ts               # Prisma client singleton
│   │   ├── claude.ts               # Claude API wrapper
│   │   ├── agents/
│   │   │   ├── scout.ts            # Agent Scout logic
│   │   │   ├── matchmaker.ts       # Agent Matchmaker logic
│   │   │   ├── writer.ts           # Agent Rédacteur logic
│   │   │   ├── enricher.ts         # Agent Enrichisseur logic
│   │   │   └── prompts.ts          # Tous les system prompts
│   │   ├── email/
│   │   │   ├── sender.ts           # Envoi SMTP
│   │   │   └── tracker.ts          # Suivi ouvertures/clics
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── public/
└── package.json
```

## Schéma base de données (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Player {
  id                String   @id @default(cuid())
  firstName         String
  lastName          String
  age               Int?
  nationality       String?
  club              String
  league            String
  position          String?
  city              String?
  instagram         String?
  followersIG       Int?
  tiktok            String?
  followersTK       Int?
  twitter           String?
  followersX        Int?
  engagementRate    Float?
  positioning       String?  // valeurs, image
  targetPartnerships String? // types de deals recherchés
  languages         String?
  notes             String?
  imageUrl          String?
  active            Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  prospects   Prospect[]
  deals       Deal[]
  scans       Scan[]
}

model Company {
  id                    String   @id @default(cuid())
  name                  String
  sector                String?
  country               String?
  website               String?
  description           String?
  existingSportsSponsoring String?
  estimatedBudget       String?
  contactName           String?
  contactRole           String?
  contactEmail          String?
  contactLinkedin       String?
  contactPhone          String?
  notes                 String?
  source                String?  // "scout", "manual", "import"
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  prospects   Prospect[]
  deals       Deal[]
  emails      Email[]
}

model Prospect {
  id              String   @id @default(cuid())
  playerId        String
  companyId       String
  score           Int?     // 1-10
  scoreDetails    Json?    // {image_coherence, audience_fit, ...}
  rationale       String?
  recommendedApproach String?
  partnershipType String?
  estimatedValue  String?
  priority        String?  // A, B, C
  status          String   @default("new") // new, contacted, replied, meeting, offer, signed, lost
  scanId          String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  player    Player   @relation(fields: [playerId], references: [id], onDelete: Cascade)
  company   Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  scan      Scan?    @relation(fields: [scanId], references: [id])
  emails    Email[]
  deal      Deal?

  @@unique([playerId, companyId])
}

model Deal {
  id            String   @id @default(cuid())
  playerId      String
  companyId     String
  prospectId    String   @unique
  stage         String   @default("lead") // lead, contacted, meeting, negotiation, offer, signed, lost
  value         Float?
  currency      String   @default("EUR")
  dealType      String?  // ambassadeur, post IG, story, event, pack complet
  notes         String?
  nextAction    String?
  nextActionDate DateTime?
  closedAt      DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  player    Player   @relation(fields: [playerId], references: [id])
  company   Company  @relation(fields: [companyId], references: [id])
  prospect  Prospect @relation(fields: [prospectId], references: [id])
}

model Email {
  id          String   @id @default(cuid())
  prospectId  String?
  companyId   String
  type        String   // first_contact, followup_1, followup_2, reply, custom
  subject     String
  body        String
  status      String   @default("draft") // draft, sent, opened, replied, bounced
  sentAt      DateTime?
  openedAt    DateTime?
  repliedAt   DateTime?
  scheduledAt DateTime?
  messageId   String?  // ID SMTP pour tracking
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  prospect  Prospect? @relation(fields: [prospectId], references: [id])
  company   Company   @relation(fields: [companyId], references: [id])
}

model EmailTemplate {
  id        String   @id @default(cuid())
  name      String
  type      String   // first_contact, followup_1, followup_2
  subject   String
  body      String   // avec variables {joueur}, {marque}, {rationnel}, etc.
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Scan {
  id        String   @id @default(cuid())
  playerId  String
  status    String   @default("running") // running, completed, failed
  brandsFound Int?
  brandsScored Int?
  rawData   Json?    // résultats bruts du scout
  scoredData Json?   // résultats scorés du matchmaker
  logs      Json?    // console logs
  duration  Int?     // en secondes
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  player    Player     @relation(fields: [playerId], references: [id])
  prospects Prospect[]
}

model ActivityLog {
  id        String   @id @default(cuid())
  type      String   // scan_completed, email_sent, deal_updated, reply_received
  message   String
  metadata  Json?
  createdAt DateTime @default(now())
}
```

## Modules détaillés

### 1. Dashboard (`/dashboard`)
- **Briefing du jour** : résumé IA des actions de la veille, leads prioritaires, relances dues
- **KPI Cards** : joueurs actifs, marques en pipeline, taux de réponse, CA signé, CA en pipeline
- **Score journée** (0-100) basé sur : nouveaux leads, réponses reçues, deals avancés
- **Leads prioritaires** : top 5 prospects à traiter aujourd'hui (scorés par urgence × potentiel)
- **Actions requises** : relances dues, réponses à traiter, meetings à planifier
- **Activité récente** : timeline des dernières actions

### 2. Joueurs (`/players`)
- **Liste** : cards avec avatar initiales, club, stats sociales, nombre de deals en cours
- **Fiche joueur** (`/players/[id]`) : profil complet, historique des scans, prospects associés, deals, timeline d'activité
- **CRUD** : ajout, modification, archivage
- **Bouton "Scanner"** : lance le pipeline Scout → Matchmaker pour ce joueur

### 3. Entreprises / Marques (`/companies`)
- **Liste** : filtrable par secteur, pays, statut, source
- **Fiche entreprise** (`/companies/[id]`) : infos, contact, historique des interactions, emails envoyés, deals liés
- **CRUD** : ajout manuel + import automatique depuis les scans
- **Enrichissement** : bouton pour lancer l'Agent Enrichisseur sur une entreprise

### 4. Pipeline (`/pipeline`)
- **Vue Kanban** : colonnes = stages (Lead → Contacté → Répondu → Meeting → Négo → Offre → Signé / Perdu)
- **Drag & drop** entre colonnes
- **Deal cards** : joueur, marque, valeur estimée, prochaine action, date
- **Filtres** : par joueur, par priorité, par valeur
- **Vue liste** alternative

### 5. Prospection (`/prospection`)
- **Sélecteur joueur** en haut
- **Résultats par scan** : liste des marques scorées avec détail dépliable
- **Stats** : répartition A/B/C, pays couverts, secteurs représentés
- **Actions bulk** : "Créer des deals pour tous les A", "Générer les mails pour les B+"
- **Historique des scans** : relancer, comparer

### 6. Emails (`/emails`)
- **Inbox** : tous les emails envoyés/reçus, filtrable par statut
- **Composer** : éditeur de mail avec variables dynamiques ({joueur}, {marque}, {rationnel})
- **Templates** (`/emails/templates`) : gérer les templates de 1er contact, relance 1, relance 2
- **Séquences** : programmer relance auto J+4, J+10
- **Tracking** : ouvertures, clics, réponses
- **Bulk send** : envoyer à tous les prospects d'un joueur avec personnalisation

### 7. Agents IA (`/agents`)
- **Dashboard agents** : 6 cards avec statut (actif/inactif/bientôt)
- **Console** : logs en temps réel via Server-Sent Events
- **Historique** : tous les scans passés avec résultats
- **Config** : paramètres de chaque agent (score minimum, volume, délais relance)
- **Agents disponibles** :
  1. **Scout** : recherche de marques (web search + Claude)
  2. **Matchmaker** : scoring des marques
  3. **Rédacteur** : génération de mails personnalisés
  4. **Enrichisseur** : recherche de contacts (phase 2)
  5. **Dispatcher** : envoi automatique (phase 2)
  6. **Veilleur** : lecture des réponses (phase 2)

### 8. Analytics (`/analytics`)
- **Funnel** : visualisation du taux de conversion à chaque étape du pipeline
- **Taux de réponse** : par joueur, par secteur, par pays, par template
- **CA** : signé vs pipeline vs perdu, évolution mensuelle
- **Performance agents** : nombre de scans, marques trouvées, taux de conversion scan → deal
- **Heatmap** : meilleurs jours/heures pour l'envoi de mails

### 9. Paramètres (`/settings`)
- **Profil** : nom, email, mot de passe
- **SMTP** : configuration serveur mail (host, port, user, pass)
- **API Keys** : clé Anthropic, Apollo.io (futur), Hunter.io (futur)
- **Agents** : délais de relance, score minimum, volume par scan
- **Import/Export** : CSV des joueurs, des entreprises, des prospects

## Agents IA — Prompts et logique

### Agent Scout
- **Input** : profil joueur
- **Process** : 2 appels Claude — (1) web search en texte libre, (2) structuration JSON
- **Output** : liste de 25-30 marques avec sector, country, rationale, partnership_type
- **Règles** : INTERDICTION des marques évidentes (Nike, Adidas, etc.), chercher à l'international (USA, MENA, Asie), marques émergentes/D2C

### Agent Matchmaker
- **Input** : profil joueur + liste marques du Scout
- **Process** : 1 appel Claude — scoring sur 6 critères
- **Output** : marques scorées 1-10, priorité A/B/C, recommended_approach
- **Critères** : image_coherence, audience_fit, sponsoring_history, conversion_potential, accessibility, timing

### Agent Rédacteur
- **Input** : profil joueur + fiche marque + rationnel du match + template sélectionné
- **Process** : 1 appel Claude — génération mail personnalisé
- **Output** : sujet + corps du mail, prêt à envoyer
- **Templates** : 1er contact, relance J+4 (actualité joueur), relance J+10 (urgence)

### Parsing JSON robuste
Tous les agents utilisent une fonction `extractJSON` qui :
1. Nettoie les guillemets typographiques (charCode 8220, 8221, etc.)
2. Supprime les backticks markdown
3. Trouve le tableau JSON par indexOf/lastIndexOf
4. Si JSON tronqué : remonte au dernier objet complet et ferme le tableau
5. Retire les trailing commas

## Design system

- **Theme** : dark mode, inspiré du screenshot SWO fourni
- **Couleurs** : fond #07090f, panels #0c1019, accent #00d4aa (vert), secondary #0088ff (bleu), warning #f59e0b
- **Typo** : Outfit (headings/body), JetBrains Mono (données, console, badges)
- **Sidebar** : fixe à gauche, collapsible, avec sections groupées (Ventes, Croissance, Opérations, Système)
- **Cards** : border subtle, hover effects, badges de statut colorés
- **Animations** : transitions fluides, loading states avec shimmer

## Variables d'environnement (.env)

```
DATABASE_URL=postgresql://user:password@localhost:5432/sponsorai
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-xxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=xxx@gmail.com
SMTP_PASS=xxx
```

## Docker

```yaml
# docker-compose.yml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - db
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: sponsorai
      POSTGRES_PASSWORD: sponsorai
      POSTGRES_DB: sponsorai
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
volumes:
  pgdata:
```

## Ordre de build recommandé

1. **Setup** : Next.js + Prisma + PostgreSQL + Docker + Auth basique
2. **Layout** : Sidebar + TopBar + routing (toutes les pages vides)
3. **Joueurs** : CRUD complet + fiche détaillée
4. **Agents Scout + Matchmaker** : API routes + console temps réel (SSE)
5. **Entreprises** : CRUD + import auto depuis scans
6. **Prospection** : affichage résultats scans + actions bulk
7. **Pipeline** : Kanban drag & drop
8. **Agent Rédacteur** : génération mails
9. **Emails** : composer, envoyer, templates, tracking
10. **Dashboard** : KPIs, briefing IA, actions du jour
11. **Analytics** : funnel, taux de réponse, CA
12. **Paramètres** : config SMTP, API keys, agents
