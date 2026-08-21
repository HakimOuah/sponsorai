import Link from "next/link";
import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { LandingMotionController } from "@/components/landing/LandingMotion";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CalendarCheck,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  FileText,
  GitBranch,
  Lock,
  Mail,
  Menu,
  MessageSquareReply,
  Network,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Vectis Agency - Sponsorship intelligence V2",
  description:
    "Une plateforme de sponsorship intelligence qui relie discovery, décideurs, outreach, deals et apprentissage à partir des campagnes réelles.",
};

const navItems = [
  { label: "Plateforme", href: "#overview" },
  { label: "Intelligence V2", href: "#technology" },
  { label: "Agents", href: "#agents" },
  { label: "Boucle fermée", href: "#resources" },
];

const heroCards: Array<{ title: string; label: string; icon: LucideIcon }> = [
  { title: "Analyse profil", label: "Enrichissement", icon: Users },
  { title: "Graphe marques", label: "Recherche IA", icon: Network },
  { title: "Prospection sûre", label: "Domaine pro", icon: Lock },
];

const dataBreaks = [
  "Le contexte d'une marque disparaît après le scan",
  "Le choix du décideur n'est pas relié au résultat",
  "Les réponses et meetings restent dispersés",
  "Les deals conclus hors plateforme deviennent invisibles",
  "Chaque nouvelle campagne repart presque de zéro",
  "Le taux de réponse masque les vrais outcomes business",
];

const solutionPillars = [
  {
    title: "Sponsorship Graph",
    text: "Une donnée structurée relie athlètes, marques, signaux, décideurs, preuves, conversations et deals.",
  },
  {
    title: "Learning Engine",
    text: "Les réponses, meetings et signatures renforcent progressivement les scores de marque, de rôle et de message.",
    featured: true,
  },
  {
    title: "Closed-loop",
    text: "Chaque opportunité reste visible du premier match jusqu'au WON ou LOST, même lorsque le meeting ou le contrat est externe.",
  },
];

const agents: Array<{
  name: string;
  role: string;
  icon: LucideIcon;
  text: string;
  command: string;
  result: string;
  capabilities: [string, string, string];
}> = [
  {
    name: "Scout",
    role: "Discovery",
    icon: Search,
    text: "Découvre des marques pertinentes et réutilise la connaissance déjà acquise au lieu d'exclure toute entreprise connue.",
    command:
      "Trouve 25 marques cohérentes avec ce profil, hors évidences du marché.",
    result: "25 marques sourcées, 18 nouvelles pistes prêtes à être scorées.",
    capabilities: [
      "Recherche web contextualisée",
      "Déduplication par athlète",
      "Sources conservées",
    ],
  },
  {
    name: "Matchmaker",
    role: "Brand score",
    icon: Target,
    text: "Versionne le scoring et combine cohérence de marque, audience, timing et signaux historiques contextualisés.",
    command:
      "Priorise les marques qui ont le meilleur potentiel de conversion réel.",
    result: "7 opportunités A détectées avec un rationnel exploitable.",
    capabilities: [
      "Scoring multi-critères",
      "Historique des outcomes",
      "Priorités A, B et C",
    ],
  },
  {
    name: "Enrichisseur",
    role: "Contact score",
    icon: Building2,
    text: "Identifie le bon rôle, vérifie l'emploi et la contactabilité, sans exposer les coordonnées brutes côté client.",
    command:
      "Identifie le décideur sponsoring actuel pour chaque marque prioritaire.",
    result:
      "5 décideurs actuels qualifiés, dont 3 contacts prêts pour validation.",
    capabilities: [
      "Rôles normalisés",
      "Emploi actuel vérifié",
      "Coordonnées protégées",
    ],
  },
  {
    name: "Rédacteur",
    role: "Message versionné",
    icon: Mail,
    text: "Génère un message contextualisé dont la version et l'angle restent associés aux résultats de la campagne.",
    command:
      "Rédige un premier contact crédible à partir du match et du profil.",
    result: "Un email personnalisé, relu et rattaché à son angle de campagne.",
    capabilities: [
      "Angles personnalisés",
      "Templates versionnés",
      "Validation humaine",
    ],
  },
  {
    name: "Dispatcher",
    role: "Sending identity",
    icon: Send,
    text: "Envoie depuis l'identité professionnelle connectée, orchestre les relances et conserve le fil de conversation.",
    command:
      "Envoie les messages approuvés et prépare les relances au bon moment.",
    result: "Séquence programmée, identité contrôlée et chronologie conservée.",
    capabilities: [
      "Identité professionnelle",
      "Relances orchestrées",
      "Traçabilité complète",
    ],
  },
  {
    name: "Veilleur",
    role: "Signals & replies",
    icon: Bot,
    text: "Détecte les réponses et nouveaux signaux utiles afin d'alimenter les opportunités, preuves et prochaines actions.",
    command:
      "Surveille les réponses et transforme chaque signal en action concrète.",
    result:
      "Réponse positive détectée, meeting proposé et pipeline mis à jour.",
    capabilities: [
      "Réponses catégorisées",
      "Signaux marché suivis",
      "Outcomes structurés",
    ],
  },
];

const workflow = [
  {
    number: "01",
    title: "Discover & Match",
    text: "Le profil athlète et les signaux marché produisent une shortlist resserrée de marques expliquées et scorées.",
  },
  {
    number: "02",
    title: "Decision maker",
    text: "Le meilleur rôle est identifié, normalisé et qualifié avant toute validation humaine du premier outreach.",
  },
  {
    number: "03",
    title: "Close the loop",
    text: "Emails, réponses, meetings, propositions et contrats restent réunis dans la chronologie de l'opportunité.",
  },
  {
    number: "04",
    title: "Learn & improve",
    text: "Les outcomes structurés renforcent les statistiques et améliorent les futures recommandations contextualisées.",
  },
];

const proofPoints = [
  "Validation humaine avant outreach",
  "Coordonnées privées côté serveur",
  "Scores et templates versionnés",
  "Attribution conservée jusqu'au deal",
];

export default function LandingPage() {
  return (
    <main className="landing-theme min-h-screen overflow-x-hidden bg-[#080705] text-[#F6F4EF]">
      <LandingMotionController />
      <SiteNav />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <AgentsSection />
      <WorkflowSection />
      <FinalCTA />
    </main>
  );
}

function SiteNav() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-50 px-3 md:px-6">
      <nav className="pointer-events-auto mx-auto flex max-w-[1540px] items-center justify-between rounded-[24px] border border-white/[0.10] bg-[rgba(11,13,18,0.94)] p-2 shadow-[0_18px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-3 px-1 text-[#F6F4EF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF6B3D]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-xl">
            <Zap className="h-4 w-4 text-[#FF6B3D]" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold tracking-[-0.03em]">
            Vectis<span className="text-[#FF6B3D]">Agency</span>
          </span>
        </Link>

        <div className="pointer-events-auto hidden items-center gap-2 rounded-2xl border border-white/[0.12] bg-[rgba(20,23,32,0.58)] p-2 shadow-[0_18px_70px_rgba(0,0,0,0.26)] backdrop-blur-[18px] md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white/[0.68] transition duration-200 hover:bg-white/[0.07] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF6B3D]"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="pointer-events-auto hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-2xl border border-white/[0.12] bg-black/20 px-5 py-3 text-sm font-semibold text-white/[0.76] backdrop-blur-xl transition duration-200 hover:bg-white/[0.08] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF6B3D]"
          >
            Connexion
          </Link>
          <Link
            href="mailto:contact@vectis.agency?subject=Démo%20Vectis%20Agency"
            className="landing-primary-cta group inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[#0B0D12] transition duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF6B3D] active:scale-[0.98]"
          >
            Démarrer
            <ArrowRight
              className="h-4 w-4 transition group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        <details className="pointer-events-auto group relative md:hidden">
          <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-2xl border border-white/[0.14] bg-black/30 text-white backdrop-blur-xl transition hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF6B3D] [&::-webkit-details-marker]:hidden">
            <Menu className="h-5 w-5 group-open:hidden" aria-hidden="true" />
            <X className="hidden h-5 w-5 group-open:block" aria-hidden="true" />
            <span className="sr-only">Open menu</span>
          </summary>
          <div className="absolute right-0 mt-3 w-[280px] rounded-3xl border border-white/[0.12] bg-[#11141D]/95 p-3 shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block rounded-2xl px-4 py-3 text-sm font-medium text-white/[0.72] transition hover:bg-white/[0.07] hover:text-white"
              >
                {item.label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-1 gap-2 border-t border-white/10 pt-3">
              <Link
                href="/login"
                className="rounded-2xl border border-white/[0.12] px-4 py-3 text-center text-sm font-semibold text-white/[0.80]"
              >
                Connexion
              </Link>
              <Link
                href="mailto:contact@vectis.agency?subject=Démo%20Vectis%20Agency"
                className="landing-primary-cta rounded-full px-4 py-3 text-center text-sm font-semibold text-[#0B0D12]"
              >
                Démarrer
              </Link>
            </div>
          </div>
        </details>
      </nav>
    </header>
  );
}

function HeroSection() {
  return (
    <section id="overview" className="bg-[#080705] p-3 sm:p-5">
      <div className="hero-shell relative mx-auto max-w-[1560px] overflow-hidden rounded-[32px] bg-[#0B0D12] px-5 pb-8 pt-28 text-[#F6F4EF] sm:rounded-[44px] sm:px-10 sm:pt-32 lg:px-16">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-signal-field" aria-hidden="true" />
        <div className="hero-glow hero-glow-one" aria-hidden="true" />
        <div className="hero-glow hero-glow-two" aria-hidden="true" />

        <div className="relative z-10 mx-auto w-full max-w-[1320px]">
          <div className="landing-reveal mx-auto max-w-5xl text-center">
            <div className="mx-auto mb-7 flex w-fit items-center gap-2 rounded-full border border-[#FF6B3D]/25 bg-[#FF6B3D]/10 px-4 py-2 text-sm font-semibold text-[#FFE4D8] backdrop-blur-xl">
              <Sparkles className="h-4 w-4 text-[#FF6B3D]" aria-hidden="true" />
              SponsorAI V2 · Sponsorship intelligence
            </div>
            <h1 className="text-balance text-[44px] font-semibold leading-[0.96] tracking-[-0.06em] text-[#F6F4EF] sm:text-[72px] lg:text-[92px]">
              Chaque campagne rend la suivante{" "}
              <span className="text-[#FF6B3D]">plus intelligente.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-[16px] leading-8 text-[#D5D7DF]/72 sm:text-lg">
              Découvrez les bonnes marques, qualifiez le décideur, pilotez
              l&apos;outreach jusqu&apos;au deal et transformez chaque résultat
              en donnée propriétaire réutilisable.
            </p>

            <HeroCommandBar />

            <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm text-[#D5D7DF]/62">
              {["Sponsorship Graph", "Boucle fermée", "Learning Engine"].map(
                (item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <CheckCircle2
                      className="h-4 w-4 text-[#FF6B3D]"
                      aria-hidden="true"
                    />
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>

          <ScrollParallax className="mx-auto mt-14 max-w-[980px]">
            <ProductPreview />
          </ScrollParallax>
        </div>

        <div className="relative z-10 mx-auto mt-10 grid w-full max-w-[1320px] grid-cols-1 gap-3 sm:grid-cols-3 lg:mt-14">
          {heroCards.map((card, index) => (
            <ScrollReveal key={card.title} delay={index * 90}>
              <div className="group landing-card-lift flex h-full items-center gap-4 rounded-[20px] border border-white/[0.11] bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#FF6B3D]/28 hover:bg-white/[0.08]">
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#11141D]/60">
                  <card.icon
                    className="h-5 w-5 text-[#FF6B3D]"
                    aria-hidden="true"
                  />
                </div>
                <div className="relative z-10">
                  <p className="text-sm font-semibold text-white">
                    {card.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[#969BA8]">{card.label}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroCommandBar() {
  return (
    <div className="hero-command-bar mx-auto mt-10 max-w-3xl rounded-[28px] border border-white/[0.12] bg-white/[0.065] p-3 text-left shadow-[0_28px_100px_rgba(0,0,0,0.34)] backdrop-blur-2xl sm:p-4">
      <div className="flex min-h-16 items-center gap-3 px-2 sm:px-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#FF6B3D]/20 bg-[#FF6B3D]/10">
          <Sparkles className="h-4 w-4 text-[#FF6B3D]" aria-hidden="true" />
        </span>
        <p className="text-sm font-medium text-white/[0.76] sm:text-base">
          Trouver les sponsors les plus pertinents pour mon portefeuille
        </p>
      </div>
      <div className="mt-2 flex flex-col gap-2 border-t border-white/[0.09] pt-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.10] bg-black/20 px-3 py-2 text-xs font-medium text-[#D5D7DF]/72">
          <Bot className="h-3.5 w-3.5 text-[#FF6B3D]" aria-hidden="true" />6
          agents coordonnés
        </span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="mailto:contact@vectis.agency?subject=Démo%20Vectis%20Agency"
            className="landing-primary-cta group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[#0B0D12] transition duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.98]"
          >
            Réserver une démo
            <ArrowRight
              className="h-4 w-4 transition group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.07] px-5 py-3 text-sm font-semibold text-white/[0.82] transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.11] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF6B3D] active:scale-[0.98]"
          >
            Voir la plateforme
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProductPreview() {
  const opportunities = [
    {
      brand: "Maison M",
      profile: "Attaquant · Ligue 1",
      score: 94,
      state: "Décideur vérifié",
    },
    {
      brand: "Atlas Mobility",
      profile: "Milieu · International",
      score: 88,
      state: "Email prêt",
    },
    {
      brand: "North Studio",
      profile: "Défenseur · Espoir",
      score: 82,
      state: "À qualifier",
    },
  ];

  return (
    <div className="landing-reveal relative mx-auto w-full max-w-[980px]">
      <div
        className="absolute -inset-8 rounded-full bg-[#FF6B3D]/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-[28px] border border-white/[0.14] bg-[#F7F5F1] text-[#171A21] shadow-[0_42px_140px_rgba(0,0,0,0.52),0_0_0_1px_rgba(255,107,61,0.05)]">
        <div className="flex items-center justify-between border-b border-black/[0.08] bg-white px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF6B5F]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#F8C34A]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#6577FF]" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#636876]">
            Aperçu SponsorAI V2
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-[#FFF0EA] px-2.5 py-1 text-[10px] font-semibold text-[#B23A20]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E85832]" />
            Démo
          </span>
        </div>

        <div className="grid min-h-[460px] grid-cols-[64px_1fr] sm:grid-cols-[150px_1fr]">
          <div className="border-r border-white/10 bg-[#11131A] p-3 text-white sm:p-4">
            <div className="mb-7 flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF6B3D] text-[#0B0D12]">
              <Zap className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              {[
                { icon: Activity, label: "Vue d'ensemble", active: true },
                { icon: Search, label: "Prospection" },
                { icon: Target, label: "Pipeline" },
                { icon: Mail, label: "Emails" },
              ].map((item) => (
                <div
                  key={item.label}
                  className={
                    "flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs " +
                    (item.active
                      ? "bg-white/[0.11] text-white"
                      : "text-white/[0.48]")
                  }
                >
                  <item.icon
                    className={
                      "h-4 w-4 shrink-0 " +
                      (item.active ? "text-[#FF6B3D]" : "")
                    }
                    aria-hidden="true"
                  />
                  <span className="hidden sm:inline">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0 p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#6A6F7C]">
                  Bonjour Hakim,
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
                  Décisions prioritaires
                </h2>
              </div>
              <span className="hidden rounded-full bg-[#141720] px-4 py-2 text-xs font-semibold text-white sm:inline-flex">
                Lancer un scan
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { value: "18", label: "Marques scorées" },
                { value: "7", label: "Contacts qualifiés" },
                { value: "4", label: "Actions dues" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-black/[0.07] bg-white p-3"
                >
                  <p className="font-mono text-lg font-semibold sm:text-xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[9px] leading-4 text-[#5F6570] sm:text-[10px]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 overflow-hidden rounded-[20px] border border-black/[0.08] bg-white">
              <div className="flex items-center justify-between border-b border-black/[0.07] px-4 py-3">
                <span className="text-xs font-semibold">
                  Recommandations V2
                </span>
                <span className="text-[10px] text-[#5F6570]">
                  Mis à jour maintenant
                </span>
              </div>
              {opportunities.map((item, index) => (
                <div
                  key={item.brand}
                  className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-3 last:border-0"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EA] text-xs font-bold text-[#B23A20]">
                    {item.brand.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold sm:text-sm">
                      {item.brand}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-[#787D89]">
                      {item.profile}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-[10px] font-medium text-[#B23A20]">
                      {item.state}
                    </p>
                    <p className="mt-0.5 text-[9px] text-[#8D929D]">
                      Priorité {String.fromCharCode(65 + index)}
                    </p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E85832]/20 bg-[#FFF0EA] font-mono text-xs font-bold text-[#B23A20]">
                    {item.score}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#141720] px-4 py-3 text-white">
              <span className="flex min-w-0 items-center gap-2 text-[10px] text-white/[0.68] sm:text-xs">
                <Clock3 className="h-4 w-4 shrink-0 text-[#FF6B3D]" />3 relances
                recommandées aujourd&apos;hui
              </span>
              <ArrowRight className="h-4 w-4 text-[#FF6B3D]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProblemSection() {
  return (
    <section className="relative overflow-hidden bg-[#080705] px-5 py-24 text-white sm:px-8 lg:py-36">
      <AmbientBackdrop dark />
      <div className="relative z-10 mx-auto max-w-[1480px]">
        <SectionIntro
          badge="La rupture V2"
          title={
            <>
              Un CRM enregistre.{" "}
              <span className="text-[#FF6B3D]">SponsorAI apprend.</span>
            </>
          }
          text="La valeur ne vient pas seulement des marques trouvées. Elle vient du lien conservé entre une décision, son contexte et son outcome réel."
        />

        <ScrollReveal direction="scale" className="mt-16">
          <div className="grid items-center gap-10 rounded-[32px] bg-[#FFE4D8] p-6 shadow-[0_28px_90px_rgba(23,26,35,0.12)] sm:p-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16 lg:rounded-[44px] lg:p-16">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#B23A20]">
                Les données qui se perdaient
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-[#171A23] sm:text-5xl">
                Fermer les angles morts du sponsoring.
              </h2>
              <div className="mt-9 grid gap-y-4">
                {dataBreaks.map((item) => (
                  <div
                    key={item}
                    className="group flex items-start gap-3 text-[15px] font-semibold leading-6 text-[#303543]"
                  >
                    <ChevronRight
                      className="mt-1 h-4 w-4 shrink-0 text-[#B23A20]"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="#technology"
                className="landing-primary-cta mt-10 inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold text-[#0B0D12] transition duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF6B3D] active:scale-[0.98]"
              >
                Découvrir le moteur V2
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <ScrollParallax>
              <ContactIntelligencePreview />
            </ScrollParallax>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function ContactIntelligencePreview() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#171A23]/10 bg-[#F7F5F1] shadow-[0_30px_90px_rgba(23,26,35,0.16)]">
      <div className="flex items-center justify-between border-b border-black/[0.07] bg-white px-5 py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#B23A20]">
            Aperçu V2 · Contact intelligence
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#171A21]">
            Décideur recommandé
          </h3>
        </div>
        <span className="rounded-full bg-[#FFF0EA] px-3 py-1.5 text-[10px] font-semibold text-[#B23A20]">
          Validation requise
        </span>
      </div>

      <div className="p-5 sm:p-7">
        <div className="rounded-[22px] border border-black/[0.08] bg-white p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#141720] text-[#FF6B3D]">
              <Users className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[#171A21]">
                    Head of Sports Partnerships
                  </p>
                  <p className="mt-1 text-sm text-[#5F6570]">
                    Rôle normalisé · entreprise cible
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#E85832]/25 bg-[#FFF0EA] font-mono text-base font-bold text-[#B23A20]">
                  96
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {[
                  ["Emploi actuel", "Vérifié"],
                  ["Contactabilité", "Vérifiée"],
                  ["Pertinence", "Très forte"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-[#F1F0ED] p-3">
                    <p className="text-[10px] text-[#5F6570]">{label}</p>
                    <p className="mt-1 text-xs font-semibold text-[#B64022]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#B23A20]/10 bg-[#FFF4EF] px-4 py-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-[#B23A20]" />
            <p className="text-xs leading-5 text-[#66514A]">
              Email, téléphone et URL directe restent privés côté serveur.
              L&apos;outreach est exécuté depuis SponsorAI.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {["Excellent", "Acceptable", "Mauvais"].map((feedback, index) => (
            <div
              key={feedback}
              className={
                "rounded-2xl border px-3 py-3 text-center text-[11px] font-semibold " +
                (index === 0
                  ? "border-[#E85832]/25 bg-[#FFF0EA] text-[#B23A20]"
                  : "border-black/[0.07] bg-white text-[#5F6570]")
              }
            >
              {feedback}
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-[10px] text-[#5F6570]">
          Aperçu illustratif — le feedback humain devient une donnée SponsorAI.
        </p>
      </div>
    </div>
  );
}

function SolutionSection() {
  return (
    <section
      id="technology"
      className="relative overflow-hidden bg-[#0D0A08] px-5 py-24 text-white sm:px-8 lg:py-36"
    >
      <DotField />
      <div className="relative z-10 mx-auto max-w-[1480px]">
        <SectionIntro
          badge="Sponsorship intelligence"
          title={
            <>
              Transformer les outcomes <br className="hidden sm:block" />
              <span className="text-[#FF6B3D]">en avantage propriétaire.</span>
            </>
          }
          text="Chaque contact sélectionné, email, réponse, meeting et deal conserve le contexte de la décision pour améliorer les recommandations futures."
        />

        <ScrollReveal direction="scale" className="mt-16">
          <div className="solution-panel grid items-center gap-10 overflow-hidden rounded-[32px] bg-[#171A23] p-6 text-white shadow-[0_38px_120px_rgba(23,26,35,0.22)] sm:p-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16 lg:rounded-[44px] lg:p-16">
            <div className="space-y-5">
              <div className="mb-8">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF6B3D]">
                  Data moat V2
                </p>
                <h3 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#F6F4EF] sm:text-5xl">
                  La mémoire est dans les données. Pas dans une vague mémoire
                  LLM.
                </h3>
              </div>
              {solutionPillars.map((pillar) => (
                <article
                  key={pillar.title}
                  className={
                    pillar.featured
                      ? "rounded-[24px] border border-[#FF6B3D]/28 bg-white/[0.08] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                      : "rounded-[24px] border border-white/[0.08] p-5"
                  }
                >
                  <h4 className="text-xl font-semibold tracking-[-0.04em] text-[#FF6B3D]">
                    {pillar.title}
                  </h4>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#D5D7DF]/72">
                    {pillar.text}
                  </p>
                </article>
              ))}
            </div>

            <ScrollParallax>
              <LearningEnginePreview />
            </ScrollParallax>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function LearningEnginePreview() {
  const events = [
    ["EMAIL_SENT", "184", "Contexte conservé"],
    ["POSITIVE_REPLY", "31", "Outcome qualifié"],
    ["MEETING_BOOKED", "14", "Signal business"],
    ["SIGNED", "5", "Valeur attribuée"],
  ];

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/[0.14] bg-[#F7F5F1] text-[#171A21] shadow-[0_34px_110px_rgba(0,0,0,0.32)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.07] bg-white px-5 py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#B23A20]">
            Aperçu V2 · Learning engine
          </p>
          <h3 className="mt-1 text-lg font-semibold">
            Performance contextualisée des rôles
          </h3>
        </div>
        <span className="rounded-full bg-[#FFF0EA] px-3 py-1.5 text-[10px] font-semibold text-[#B23A20]">
          Score versionné
        </span>
      </div>

      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap gap-2">
          {[
            "Sports partnerships",
            "Sportswear",
            "+5 000 salariés",
            "Football",
          ].map((filter) => (
            <span
              key={filter}
              className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[10px] font-medium text-[#5F6470]"
            >
              {filter}
            </span>
          ))}
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {events.map(([event, value, label]) => (
            <div
              key={event}
              className="rounded-[20px] border border-black/[0.07] bg-white p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[9px] text-[#6A6F7C]">{event}</p>
                <p className="font-mono text-lg font-bold text-[#B23A20]">
                  {value}
                </p>
              </div>
              <p className="mt-3 text-[10px] text-[#5F6570]">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[22px] bg-[#141720] p-5 text-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-white/[0.55]">
                Utilité historique lissée
              </p>
              <p className="mt-1 text-lg font-semibold">
                Le volume protège contre les faux signaux
              </p>
            </div>
            <BrainCircuit className="h-7 w-7 shrink-0 text-[#FF6B3D]" />
          </div>
          <div className="mt-5 flex h-24 items-end gap-2" aria-hidden="true">
            {[28, 42, 36, 58, 51, 68, 62, 78, 73, 86].map((height, index) => (
              <span
                key={index}
                className="flex-1 rounded-t bg-gradient-to-t from-[#B23A20] to-[#FF6B3D]"
                style={{ height: height + "%" }}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-white/[0.55]">
            <TrendingUp className="h-3.5 w-3.5 text-[#FF6B3D]" />
            Bayesian smoothing · scoring pondéré · versionnement
          </div>
        </div>

        <p className="mt-3 text-center text-[10px] text-[#5F6570]">
          Données illustratives — aucun résultat réel affiché.
        </p>
      </div>
    </div>
  );
}

function AgentsSection() {
  return (
    <section
      id="agents"
      className="relative overflow-hidden bg-[#080705] py-24 text-white lg:py-32"
    >
      <AmbientBackdrop dark />
      <div className="agent-signal-field" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-[1480px] px-5 sm:px-8">
        <ScrollReveal>
          <div className="mx-auto max-w-4xl text-center">
            <p className="mx-auto mb-5 w-fit rounded-full border border-[#FF6B3D]/20 bg-[#FF6B3D]/10 px-4 py-2 text-sm font-semibold text-[#FFE4D8]">
              Disponibles en continu · sous votre contrôle
            </p>
            <h2 className="text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-[#F6F4EF] md:text-7xl">
              Six agents spécialisés. Une seule intelligence.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#969BA8]">
              Chacun exécute une mission précise. Ensemble, ils conservent le
              contexte, les décisions et les outcomes de chaque campagne.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="mailto:contact@vectis.agency?subject=Démo%20Vectis%20Agency"
                className="landing-primary-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[#0B0D12] transition duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                Voir les agents en action
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white/[0.80] transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.10] hover:text-white active:scale-[0.98]"
              >
                Accéder à la plateforme
              </Link>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal className="mt-14">
          <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-2">
            {agents.map((agent) => (
              <a
                key={agent.name}
                href={`#agent-${agent.name.toLowerCase()}`}
                className="group inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.035] py-1.5 pl-1.5 pr-4 text-sm font-medium text-[#969BA8] transition duration-200 hover:border-[#FF6B3D]/30 hover:bg-white/[0.07] hover:text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.09] bg-[#15110E] transition group-hover:bg-[#FF6B3D]/12">
                  <agent.icon
                    className="h-3.5 w-3.5 text-[#FF6B3D]"
                    aria-hidden="true"
                  />
                </span>
                {agent.name}
              </a>
            ))}
          </div>
        </ScrollReveal>
      </div>

      <ScrollReveal direction="scale" className="mt-12">
        <div
          role="region"
          aria-label="Présentation des agents SponsorAI"
          tabIndex={0}
          className="agent-showcase-track flex snap-x snap-mandatory gap-4 overflow-x-auto px-[max(1.25rem,calc((100vw-1180px)/2))] pb-7 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF6B3D] sm:gap-6 sm:px-[max(2rem,calc((100vw-1180px)/2))]"
        >
          {agents.map((agent) => (
            <article
              id={`agent-${agent.name.toLowerCase()}`}
              key={agent.name}
              className="agent-showcase-card group w-[88vw] max-w-[980px] shrink-0 snap-center scroll-ml-5 scroll-mt-28 overflow-hidden rounded-[32px] border border-white/[0.10] bg-[#15120F]/95 shadow-[0_34px_110px_rgba(0,0,0,0.34)] backdrop-blur-2xl transition duration-300 hover:border-[#FF6B3D]/24 sm:w-[82vw] sm:scroll-ml-8 lg:w-[76vw]"
            >
              <div className="grid min-h-[520px] lg:grid-cols-[0.88fr_1.12fr]">
                <div className="agent-conversation relative flex flex-col justify-between overflow-hidden border-b border-white/[0.08] p-5 sm:p-8 lg:border-b-0 lg:border-r">
                  <div className="relative z-10">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#FF6B3D]">
                      Mission confiée
                    </p>
                    <div className="mt-5 rounded-[22px] border border-white/[0.10] bg-black/20 p-4 text-sm leading-6 text-white/[0.72]">
                      {agent.command}
                    </div>
                  </div>

                  <div className="relative z-10 mt-16">
                    <div className="ml-auto max-w-[92%] rounded-[22px] rounded-br-md border border-[#FF6B3D]/20 bg-[#FF6B3D]/10 p-4 text-sm leading-6 text-[#FFE4D8]">
                      {agent.result}
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#FF6B3D]/22 bg-[#FF6B3D]/10">
                        <agent.icon
                          className="h-4 w-4 text-[#FF6B3D]"
                          aria-hidden="true"
                        />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-white">
                          {agent.name} a terminé la mission
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#969BA8]">
                          Contexte enregistré dans SponsorAI
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col p-5 sm:p-8 lg:p-10">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-4">
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-[#FF6B3D]/22 bg-[#FF6B3D]/10 shadow-[0_0_36px_rgba(255,107,61,0.10)]">
                        <agent.icon
                          className="h-7 w-7 text-[#FF6B3D]"
                          aria-hidden="true"
                        />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-[#FF6B3D]">
                          {agent.role}
                        </p>
                        <h3 className="mt-1 text-3xl font-semibold tracking-[-0.045em] text-[#F6F4EF]">
                          Agent {agent.name}
                        </h3>
                      </div>
                    </div>
                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#FF6B3D]/18 bg-[#FF6B3D]/10 px-3 py-2 text-[10px] font-semibold text-[#FFE4D8]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B3D] shadow-[0_0_10px_rgba(255,107,61,0.75)]" />
                      Actif
                    </span>
                  </div>

                  <p className="mt-7 max-w-xl text-base leading-7 text-[#969BA8]">
                    {agent.text}
                  </p>

                  <div className="mt-auto space-y-3 pt-9">
                    {agent.capabilities.map((capability) => (
                      <div
                        key={capability}
                        className="flex items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.045] px-4 py-3 text-sm font-semibold text-[#D5D7DF]"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF6B3D]/12">
                          <Check
                            className="h-3.5 w-3.5 text-[#FF6B3D]"
                            aria-hidden="true"
                          />
                        </span>
                        {capability}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </ScrollReveal>

      <div className="relative z-10 mx-auto mt-2 flex max-w-[1480px] items-center justify-center gap-2 px-5 text-xs text-[#969BA8] sm:px-8">
        <ArrowRight className="h-4 w-4 text-[#FF6B3D]" aria-hidden="true" />
        Faites défiler pour découvrir chaque agent
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section
      id="resources"
      className="relative overflow-hidden bg-[#080705] px-5 py-24 text-white sm:px-8 lg:py-32"
    >
      <AmbientBackdrop dark />
      <div className="relative z-10 mx-auto max-w-[1480px]">
        <ScrollReveal>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="mb-5 w-fit rounded-full border border-[#969BA8]/35 bg-white px-4 py-2 text-sm font-semibold text-[#303543] shadow-sm">
                Closed-loop V2
              </p>
              <h2 className="text-5xl font-semibold leading-[1.03] tracking-[-0.055em] text-[#F6F4EF] md:text-7xl">
                Du premier signal au deal attribué.
              </h2>
            </div>
            <div className="rounded-[28px] border border-[#FF6B3D]/18 bg-[#FF6B3D]/[0.075] p-6 backdrop-blur-xl">
              <div className="grid gap-3 sm:grid-cols-2">
                {proofPoints.map((point) => (
                  <div
                    key={point}
                    className="flex items-center gap-3 text-sm font-semibold text-[#F6F4EF]"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF6B3D]/15">
                      <Check
                        className="h-4 w-4 text-[#FF6B3D]"
                        aria-hidden="true"
                      />
                    </span>
                    {point}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="scale">
          <ClosedLoopPreview />
        </ScrollReveal>

        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {workflow.map((step, index) => (
            <ScrollReveal key={step.number} delay={index * 80}>
              <article className="landing-card-lift h-full rounded-[28px] border border-white/[0.09] bg-white/[0.045] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#FF6B3D]/30 hover:bg-white/[0.065] hover:shadow-[0_26px_90px_rgba(0,0,0,0.28)]">
                <p className="relative z-10 font-mono text-sm text-[#FF6B3D]">
                  {step.number}
                </p>
                <h3 className="relative z-10 mt-8 text-2xl font-semibold tracking-[-0.04em] text-[#F6F4EF]">
                  {step.title}
                </h3>
                <p className="relative z-10 mt-4 text-base leading-7 text-[#969BA8]">
                  {step.text}
                </p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosedLoopPreview() {
  const stages = [
    { label: "Match", icon: Target, done: true },
    { label: "Contact", icon: Users, done: true },
    { label: "Outreach", icon: Send, done: true },
    { label: "Reply", icon: MessageSquareReply, done: true },
    { label: "Meeting", icon: CalendarCheck, done: true },
    { label: "Proposal", icon: FileText, done: true },
    { label: "Signed", icon: CheckCircle2, done: true },
    { label: "Learn", icon: RotateCcw, done: false },
  ];

  return (
    <div className="mt-14 overflow-hidden rounded-[32px] border border-[#171A23]/10 bg-[#141720] p-5 text-white shadow-[0_28px_90px_rgba(23,26,35,0.14)] sm:p-8 lg:rounded-[40px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#FF6B3D]">
            Aperçu V2 · Deal timeline
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
            Une opportunité, une chronologie complète
          </h3>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#FF6B3D]/20 bg-[#FF6B3D]/10 px-3 py-2 text-[10px] font-semibold text-[#FFE4D8]">
          <GitBranch className="h-3.5 w-3.5 text-[#FF6B3D]" />
          Attribution SponsorAI conservée
        </span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[24px] border border-white/[0.09] bg-white/[0.045] p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
            {stages.map((stage, index) => (
              <div key={stage.label} className="relative">
                <div
                  className={
                    "flex min-h-24 flex-col items-center justify-center rounded-2xl border px-2 text-center " +
                    (stage.done
                      ? "border-[#FF6B3D]/22 bg-[#FF6B3D]/10"
                      : "border-white/[0.09] bg-white/[0.035]")
                  }
                >
                  <stage.icon
                    className={
                      "h-5 w-5 " +
                      (stage.done ? "text-[#FF6B3D]" : "text-white/[0.40]")
                    }
                    aria-hidden="true"
                  />
                  <p className="mt-3 text-[10px] font-semibold">
                    {stage.label}
                  </p>
                  <p className="mt-1 font-mono text-[8px] text-white/[0.68]">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-black/25 p-4">
            <Database className="mt-0.5 h-5 w-5 shrink-0 text-[#FF6B3D]" />
            <p className="text-xs leading-6 text-white/[0.58]">
              À chaque étape, SponsorAI conserve le contexte au moment de la
              décision : athlète, marque, rôle, scores, versions et outcome.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {[
            {
              icon: CalendarCheck,
              title: "Meeting externe",
              text: "Outcome enregistré manuellement ou via une future intégration calendrier.",
            },
            {
              icon: FileText,
              title: "Contrat externe",
              text: "Le document peut venir de la marque sans rendre le deal invisible.",
            },
            {
              icon: ShieldCheck,
              title: "Attribution immutable",
              text: "L'origine de l'opportunité reste traçable jusqu'au WON ou LOST.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[22px] border border-white/[0.09] bg-white/[0.045] p-4"
            >
              <item.icon
                className="h-5 w-5 text-[#FF6B3D]"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-semibold">{item.title}</p>
              <p className="mt-2 text-[11px] leading-5 text-white/[0.48]">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-center text-[10px] text-white/[0.68]">
        Aperçu illustratif de l&apos;architecture cible V2.
      </p>
    </div>
  );
}

function FinalCTA() {
  return (
    <section className="bg-[#080705] p-3 sm:p-5">
      <div className="cta-signal-block relative mx-auto overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#0B0D12] px-6 py-24 text-center text-white sm:rounded-[44px] lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,107,61,0.18),transparent_35%),linear-gradient(180deg,#0B0D12,#11141D)]" />
        <AmbientBackdrop dark />
        <ScrollReveal
          className="relative z-10 mx-auto max-w-4xl"
          direction="scale"
        >
          <p className="mx-auto mb-5 w-fit rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-2 text-sm font-semibold text-[#FFE4D8]/78">
            V2 progressive · Bêta privée
          </p>
          <h2 className="text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-[#F6F4EF] md:text-7xl">
            Ne perdez plus ce que vos campagnes vous apprennent.
          </h2>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#D5D7DF]/72">
            Vectis transforme progressivement chaque marque, contact, réponse,
            meeting et deal en intelligence réutilisable — avec validation
            humaine avant le premier outreach.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="mailto:contact@vectis.agency?subject=Démo%20Vectis%20Agency"
              className="landing-primary-cta inline-flex min-h-14 items-center justify-center gap-3 rounded-full px-6 py-4 text-base font-semibold text-[#0B0D12] transition duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF6B3D] active:scale-[0.98]"
            >
              Réserver une démo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.05] px-6 py-4 text-base font-semibold text-white/[0.78] transition duration-200 hover:bg-white/[0.09] hover:text-white"
            >
              Connexion
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

type RevealDirection = "up" | "left" | "right" | "scale";

function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: RevealDirection;
}) {
  return (
    <div
      data-scroll-reveal
      className={`scroll-reveal scroll-reveal-${direction} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

function ScrollParallax({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`scroll-parallax ${className}`}>{children}</div>;
}

function SectionIntro({
  badge,
  title,
  text,
}: {
  badge: string;
  title: ReactNode;
  text: string;
}) {
  return (
    <ScrollReveal>
      <div className="mx-auto max-w-4xl text-center">
        <p className="mx-auto mb-6 w-fit rounded-full border border-[#FF6B3D]/22 bg-[#FF6B3D]/10 px-4 py-2 text-sm font-semibold text-[#FFE4D8] shadow-[0_0_32px_rgba(255,107,61,0.08)]">
          {badge}
        </p>
        <h2 className="text-balance text-5xl font-semibold leading-[1.04] tracking-[-0.055em] text-[#F6F4EF] md:text-7xl">
          {title}
        </h2>
        <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#969BA8]">
          {text}
        </p>
      </div>
    </ScrollReveal>
  );
}

function DotField() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {Array.from({ length: 18 }).map((_, index) => (
        <span
          key={index}
          className={
            index % 4 === 0
              ? "landing-dot absolute h-7 w-7 rounded-full bg-[#969BA8]/40 blur-[1px]"
              : index % 3 === 0
                ? "landing-dot absolute h-5 w-5 rounded-full bg-[#FF6B3D]/70 shadow-[0_0_26px_rgba(255,107,61,0.35)]"
                : "landing-dot absolute h-2.5 w-2.5 rounded-full bg-[#303543]/35"
          }
          style={{
            left: `${8 + ((index * 17) % 86)}%`,
            top: `${6 + ((index * 29) % 88)}%`,
            animationDelay: `${index * -0.48}s`,
          }}
        />
      ))}
    </div>
  );
}

function AmbientBackdrop({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`landing-ambient ${dark ? "landing-ambient-dark" : ""}`}
      aria-hidden="true"
    >
      <span className="landing-ambient-orb landing-ambient-orb-one" />
      <span className="landing-ambient-orb landing-ambient-orb-two" />
    </div>
  );
}
