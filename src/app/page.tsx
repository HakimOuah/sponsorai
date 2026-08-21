import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
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
}> = [
  {
    name: "Scout",
    role: "Discovery",
    icon: Search,
    text: "Découvre des marques pertinentes et réutilise la connaissance déjà acquise au lieu d'exclure toute entreprise connue.",
  },
  {
    name: "Matchmaker",
    role: "Brand score",
    icon: Target,
    text: "Versionne le scoring et combine cohérence de marque, audience, timing et signaux historiques contextualisés.",
  },
  {
    name: "Enrichisseur",
    role: "Contact score",
    icon: Building2,
    text: "Identifie le bon rôle, vérifie l'emploi et la contactabilité, sans exposer les coordonnées brutes côté client.",
  },
  {
    name: "Rédacteur",
    role: "Message versionné",
    icon: Mail,
    text: "Génère un message contextualisé dont la version et l'angle restent associés aux résultats de la campagne.",
  },
  {
    name: "Dispatcher",
    role: "Sending identity",
    icon: Send,
    text: "Envoie depuis l'identité professionnelle connectée, orchestre les relances et conserve le fil de conversation.",
  },
  {
    name: "Veilleur",
    role: "Signals & replies",
    icon: Bot,
    text: "Détecte les réponses et nouveaux signaux utiles afin d'alimenter les opportunités, preuves et prochaines actions.",
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
    <main className="min-h-screen overflow-x-hidden bg-[#F8FAF7] text-[#003F32]">
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
      <nav className="pointer-events-auto mx-auto flex max-w-[1540px] items-center justify-between rounded-[24px] border border-white/[0.10] bg-[rgba(5,8,7,0.94)] p-2 shadow-[0_18px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-3 px-1 text-[#F8FAF7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3EF2A0]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-xl">
            <Zap className="h-4 w-4 text-[#3EF2A0]" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold tracking-[-0.03em]">
            Vectis<span className="text-[#3EF2A0]">Agency</span>
          </span>
        </Link>

        <div className="pointer-events-auto hidden items-center gap-2 rounded-2xl border border-white/[0.12] bg-[rgba(15,18,20,0.58)] p-2 shadow-[0_18px_70px_rgba(0,0,0,0.26)] backdrop-blur-[18px] md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white/68 transition duration-200 hover:bg-white/[0.07] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3EF2A0]"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="pointer-events-auto hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-2xl border border-white/[0.12] bg-black/20 px-5 py-3 text-sm font-semibold text-white/76 backdrop-blur-xl transition duration-200 hover:bg-white/[0.08] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3EF2A0]"
          >
            Connexion
          </Link>
          <Link
            href="mailto:contact@vectis.agency?subject=Démo%20Vectis%20Agency"
            className="group inline-flex items-center gap-2 rounded-full bg-[#F8FAF7] px-5 py-3 text-sm font-semibold text-[#020403] shadow-[0_10px_34px_rgba(62,242,160,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(62,242,160,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3EF2A0] active:scale-[0.98]"
          >
            Démarrer
            <ArrowRight
              className="h-4 w-4 transition group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        <details className="pointer-events-auto group relative md:hidden">
          <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-2xl border border-white/[0.14] bg-black/30 text-white backdrop-blur-xl transition hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3EF2A0] [&::-webkit-details-marker]:hidden">
            <Menu className="h-5 w-5 group-open:hidden" aria-hidden="true" />
            <X className="hidden h-5 w-5 group-open:block" aria-hidden="true" />
            <span className="sr-only">Open menu</span>
          </summary>
          <div className="absolute right-0 mt-3 w-[280px] rounded-3xl border border-white/[0.12] bg-[#050A0D]/95 p-3 shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block rounded-2xl px-4 py-3 text-sm font-medium text-white/72 transition hover:bg-white/[0.07] hover:text-white"
              >
                {item.label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-1 gap-2 border-t border-white/10 pt-3">
              <Link
                href="/login"
                className="rounded-2xl border border-white/[0.12] px-4 py-3 text-center text-sm font-semibold text-white/80"
              >
                Connexion
              </Link>
              <Link
                href="mailto:contact@vectis.agency?subject=Démo%20Vectis%20Agency"
                className="rounded-full bg-[#F8FAF7] px-4 py-3 text-center text-sm font-semibold text-[#020403]"
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
    <section id="overview" className="bg-[#F8FAF7] p-3 sm:p-5">
      <div className="hero-shell relative mx-auto min-h-[880px] max-w-[1560px] overflow-hidden rounded-[32px] bg-[#020403] px-5 pb-8 pt-28 text-[#F8FAF7] sm:rounded-[44px] sm:px-10 sm:pt-32 lg:min-h-[920px] lg:px-16">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
        <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
        <div className="hero-circuit" aria-hidden="true">
          <span className="circuit-line circuit-line-top" />
          <span className="circuit-line circuit-line-mid" />
          <span className="circuit-line circuit-line-bottom" />
          <span className="circuit-dot circuit-dot-one" />
          <span className="circuit-dot circuit-dot-two" />
          <span className="circuit-dot circuit-dot-three" />
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-[1320px] items-center gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16">
          <div className="landing-reveal max-w-2xl text-center lg:text-left">
            <div className="mx-auto mb-7 flex w-fit items-center gap-2 rounded-full border border-[#3EF2A0]/25 bg-[#3EF2A0]/10 px-4 py-2 text-sm font-semibold text-[#DDFBEA] backdrop-blur-xl lg:mx-0">
              <Sparkles className="h-4 w-4 text-[#3EF2A0]" aria-hidden="true" />
              SponsorAI V2 · Sponsorship intelligence
            </div>
            <h1 className="text-[43px] font-semibold leading-[0.98] tracking-[-0.055em] text-[#F8FAF7] sm:text-[68px] lg:text-[78px]">
              Chaque campagne rend la suivante{" "}
              <span className="text-[#3EF2A0]">plus intelligente.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-[16px] leading-8 text-[#D8DEDA]/72 sm:text-lg lg:mx-0">
              Découvrez les bonnes marques, qualifiez le décideur, pilotez
              l&apos;outreach jusqu&apos;au deal et transformez chaque résultat en
              donnée propriétaire réutilisable.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="mailto:contact@vectis.agency?subject=Démo%20Vectis%20Agency"
                className="group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-[#3EF2A0] px-6 py-4 text-base font-semibold text-[#020403] shadow-[0_20px_70px_rgba(62,242,160,0.2)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#65F6B3] hover:shadow-[0_0_34px_rgba(62,242,160,0.32)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.98] sm:w-auto"
              >
                Réserver une démo
                <ArrowUpRight
                  className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-14 w-full items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.05] px-6 py-4 text-base font-semibold text-white/82 backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.09] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3EF2A0] active:scale-[0.98] sm:w-auto"
              >
                Accéder à la plateforme
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm text-[#D8DEDA]/62 lg:justify-start">
              {["Sponsorship Graph", "Boucle fermée", "Learning Engine"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#3EF2A0]" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <ProductPreview />
        </div>

        <div className="relative z-10 mx-auto mt-10 grid w-full max-w-[1320px] grid-cols-1 gap-3 sm:grid-cols-3 lg:mt-14">
          {heroCards.map((card) => (
            <div
              key={card.title}
              className="group flex items-center gap-4 rounded-[20px] border border-white/[0.11] bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-[#3EF2A0]/28 hover:bg-white/[0.08]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#050A0D]/60">
                <card.icon className="h-5 w-5 text-[#3EF2A0]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{card.title}</p>
                <p className="mt-0.5 text-xs text-[#8FA69E]">{card.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
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
    <div className="landing-reveal relative mx-auto w-full max-w-[680px]">
      <div
        className="absolute -inset-8 rounded-full bg-[#3EF2A0]/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-[28px] border border-white/[0.14] bg-[#F7F8F6] text-[#111713] shadow-[0_42px_140px_rgba(0,0,0,0.52),0_0_0_1px_rgba(62,242,160,0.05)]">
        <div className="flex items-center justify-between border-b border-black/[0.08] bg-white px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF6B5F]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#F8C34A]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#3EF2A0]" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#516058]">
            Aperçu SponsorAI V2
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-[#E4FAEE] px-2.5 py-1 text-[10px] font-semibold text-[#006B55]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00B878]" />
            Démo
          </span>
        </div>

        <div className="grid min-h-[460px] grid-cols-[64px_1fr] sm:grid-cols-[150px_1fr]">
          <div className="border-r border-white/10 bg-[#050807] p-3 text-white sm:p-4">
            <div className="mb-7 flex h-9 w-9 items-center justify-center rounded-xl bg-[#3EF2A0] text-[#020403]">
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
                      : "text-white/48")
                  }
                >
                  <item.icon
                    className={
                      "h-4 w-4 shrink-0 " +
                      (item.active ? "text-[#3EF2A0]" : "")
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
                <p className="text-xs font-medium text-[#647068]">
                  Bonjour Hakim,
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
                  Décisions prioritaires
                </h2>
              </div>
              <span className="hidden rounded-full bg-[#0A0D0B] px-4 py-2 text-xs font-semibold text-white sm:inline-flex">
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
                  <p className="mt-1 text-[9px] leading-4 text-[#6D756F] sm:text-[10px]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 overflow-hidden rounded-[20px] border border-black/[0.08] bg-white">
              <div className="flex items-center justify-between border-b border-black/[0.07] px-4 py-3">
                <span className="text-xs font-semibold">Recommandations V2</span>
                <span className="text-[10px] text-[#6D756F]">
                  Mis à jour maintenant
                </span>
              </div>
              {opportunities.map((item, index) => (
                <div
                  key={item.brand}
                  className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-3 last:border-0"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E4FAEE] text-xs font-bold text-[#006B55]">
                    {item.brand.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold sm:text-sm">
                      {item.brand}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-[#768079]">
                      {item.profile}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-[10px] font-medium text-[#006B55]">
                      {item.state}
                    </p>
                    <p className="mt-0.5 text-[9px] text-[#8A938D]">
                      Priorité {String.fromCharCode(65 + index)}
                    </p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#00B878]/20 bg-[#E4FAEE] font-mono text-xs font-bold text-[#006B55]">
                    {item.score}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#0A0D0B] px-4 py-3 text-white">
              <span className="flex min-w-0 items-center gap-2 text-[10px] text-white/68 sm:text-xs">
                <Clock3 className="h-4 w-4 shrink-0 text-[#3EF2A0]" />
                3 relances recommandées aujourd&apos;hui
              </span>
              <ArrowRight className="h-4 w-4 text-[#3EF2A0]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProblemSection() {
  return (
    <section className="bg-[#F8FAF7] px-5 py-24 sm:px-8 lg:py-36">
      <div className="mx-auto max-w-[1480px]">
        <SectionIntro
          badge="La rupture V2"
          title={
            <>
              Un CRM enregistre.{" "}
              <span className="text-[#3EF2A0]">SponsorAI apprend.</span>
            </>
          }
          text="La valeur ne vient pas seulement des marques trouvées. Elle vient du lien conservé entre une décision, son contexte et son outcome réel."
        />

        <div className="mt-16 grid items-center gap-10 rounded-[32px] bg-[#DDFBEA] p-6 shadow-[0_28px_90px_rgba(0,63,50,0.12)] sm:p-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16 lg:rounded-[44px] lg:p-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#006B55]">
              Les données qui se perdaient
            </p>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-[#003F32] sm:text-5xl">
              Fermer les angles morts du sponsoring.
            </h2>
            <div className="mt-9 grid gap-y-4">
              {dataBreaks.map((item) => (
                <div
                  key={item}
                  className="group flex items-start gap-3 text-[15px] font-semibold leading-6 text-[#004C3B]"
                >
                  <ChevronRight
                    className="mt-1 h-4 w-4 shrink-0 text-[#006B55]"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Link
              href="#technology"
              className="mt-10 inline-flex items-center gap-3 rounded-full bg-[#006B55] px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#004C3B] hover:shadow-[0_20px_45px_rgba(0,76,59,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3EF2A0] active:scale-[0.98]"
            >
              Découvrir le moteur V2
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <ContactIntelligencePreview />
        </div>
      </div>
    </section>
  );
}

function ContactIntelligencePreview() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#003F32]/10 bg-[#F7F8F6] shadow-[0_30px_90px_rgba(0,63,50,0.16)]">
      <div className="flex items-center justify-between border-b border-black/[0.07] bg-white px-5 py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#006B55]">
            Aperçu V2 · Contact intelligence
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#111713]">
            Décideur recommandé
          </h3>
        </div>
        <span className="rounded-full bg-[#E4FAEE] px-3 py-1.5 text-[10px] font-semibold text-[#006B55]">
          Validation requise
        </span>
      </div>

      <div className="p-5 sm:p-7">
        <div className="rounded-[22px] border border-black/[0.08] bg-white p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0A0D0B] text-[#3EF2A0]">
              <Users className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[#111713]">
                    Head of Sports Partnerships
                  </p>
                  <p className="mt-1 text-sm text-[#6D756F]">
                    Rôle normalisé · entreprise cible
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#00B878]/25 bg-[#E4FAEE] font-mono text-base font-bold text-[#006B55]">
                  96
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {[
                  ["Emploi actuel", "Vérifié"],
                  ["Contactabilité", "Vérifiée"],
                  ["Pertinence", "Très forte"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-[#F3F5F2] p-3">
                    <p className="text-[10px] text-[#778079]">{label}</p>
                    <p className="mt-1 text-xs font-semibold text-[#005F4A]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#006B55]/10 bg-[#EAF8F0] px-4 py-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-[#006B55]" />
            <p className="text-xs leading-5 text-[#365C50]">
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
                  ? "border-[#00B878]/25 bg-[#E4FAEE] text-[#006B55]"
                  : "border-black/[0.07] bg-white text-[#737D76]")
              }
            >
              {feedback}
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-[10px] text-[#6D756F]">
          Aperçu illustratif — le feedback humain devient une donnée SponsorAI.
        </p>
      </div>
    </div>
  );
}

function SolutionSection() {
  return (
    <section id="technology" className="relative overflow-hidden bg-[#F8FAF7] px-5 py-24 sm:px-8 lg:py-36">
      <DotField />
      <div className="relative z-10 mx-auto max-w-[1480px]">
        <SectionIntro
          badge="Sponsorship intelligence"
          title={
            <>
              Transformer les outcomes <br className="hidden sm:block" />
              <span className="text-[#3EF2A0]">en avantage propriétaire.</span>
            </>
          }
          text="Chaque contact sélectionné, email, réponse, meeting et deal conserve le contexte de la décision pour améliorer les recommandations futures."
        />

        <div className="solution-panel mt-16 grid items-center gap-10 overflow-hidden rounded-[32px] bg-[#003F32] p-6 text-white shadow-[0_38px_120px_rgba(0,63,50,0.22)] sm:p-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16 lg:rounded-[44px] lg:p-16">
          <div className="space-y-5">
            <div className="mb-8">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#3EF2A0]">
                Data moat V2
              </p>
              <h3 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#F8FAF7] sm:text-5xl">
                La mémoire est dans les données. Pas dans une vague mémoire LLM.
              </h3>
            </div>
            {solutionPillars.map((pillar) => (
              <article
                key={pillar.title}
                className={
                  pillar.featured
                    ? "rounded-[24px] border border-[#3EF2A0]/28 bg-white/[0.08] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                    : "rounded-[24px] border border-white/[0.08] p-5"
                }
              >
                <h4 className="text-xl font-semibold tracking-[-0.04em] text-[#3EF2A0]">
                  {pillar.title}
                </h4>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#D8DEDA]/72">
                  {pillar.text}
                </p>
              </article>
            ))}
          </div>

          <LearningEnginePreview />
        </div>
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
    <div className="overflow-hidden rounded-[28px] border border-white/[0.14] bg-[#F7F8F6] text-[#111713] shadow-[0_34px_110px_rgba(0,0,0,0.32)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.07] bg-white px-5 py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#006B55]">
            Aperçu V2 · Learning engine
          </p>
          <h3 className="mt-1 text-lg font-semibold">
            Performance contextualisée des rôles
          </h3>
        </div>
        <span className="rounded-full bg-[#E4FAEE] px-3 py-1.5 text-[10px] font-semibold text-[#006B55]">
          Score versionné
        </span>
      </div>

      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap gap-2">
          {["Sports partnerships", "Sportswear", "+5 000 salariés", "Football"].map(
            (filter) => (
              <span
                key={filter}
                className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[10px] font-medium text-[#536159]"
              >
                {filter}
              </span>
            )
          )}
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {events.map(([event, value, label]) => (
            <div
              key={event}
              className="rounded-[20px] border border-black/[0.07] bg-white p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[9px] text-[#647068]">{event}</p>
                <p className="font-mono text-lg font-bold text-[#006B55]">
                  {value}
                </p>
              </div>
              <p className="mt-3 text-[10px] text-[#788179]">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[22px] bg-[#0A0D0B] p-5 text-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-white/55">Utilité historique lissée</p>
              <p className="mt-1 text-lg font-semibold">
                Le volume protège contre les faux signaux
              </p>
            </div>
            <BrainCircuit className="h-7 w-7 shrink-0 text-[#3EF2A0]" />
          </div>
          <div className="mt-5 flex h-24 items-end gap-2" aria-hidden="true">
            {[28, 42, 36, 58, 51, 68, 62, 78, 73, 86].map((height, index) => (
              <span
                key={index}
                className="flex-1 rounded-t bg-gradient-to-t from-[#006B55] to-[#3EF2A0]"
                style={{ height: height + "%" }}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-white/55">
            <TrendingUp className="h-3.5 w-3.5 text-[#3EF2A0]" />
            Bayesian smoothing · scoring pondéré · versionnement
          </div>
        </div>

        <p className="mt-3 text-center text-[10px] text-[#6D756F]">
          Données illustratives — aucun résultat réel affiché.
        </p>
      </div>
    </div>
  );
}

function AgentsSection() {
  return (
    <section id="agents" className="bg-[#050A0D] px-5 py-24 text-white sm:px-8 lg:py-32">
      <div className="mx-auto max-w-[1480px]">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
          <div>
            <p className="mb-5 w-fit rounded-full border border-[#3EF2A0]/20 bg-[#3EF2A0]/10 px-4 py-2 text-sm font-semibold text-[#DDFBEA]">
              Équipe d&apos;agents
            </p>
            <h2 className="text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-[#F8FAF7] md:text-7xl">
              Six agents. Une intelligence partagée.
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-[#8FA69E]">
            Chaque agent garde un rôle clair, mais leurs décisions alimentent
            le même graphe, la même chronologie et le même historique
            d&apos;outcomes.
          </p>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <article
              key={agent.name}
              className="group rounded-[28px] border border-white/[0.08] bg-white/[0.045] p-6 transition duration-200 hover:-translate-y-1 hover:border-[#3EF2A0]/35 hover:bg-white/[0.065] hover:shadow-[0_28px_80px_rgba(0,0,0,0.25)]"
            >
              <div className="mb-8 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#020403]">
                  <agent.icon className="h-5 w-5 text-[#3EF2A0]" aria-hidden="true" />
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-[#8FA69E]">
                  {agent.role}
                </span>
              </div>
              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[#F8FAF7]">
                {agent.name}
              </h3>
              <p className="mt-4 text-base leading-7 text-[#8FA69E]">
                {agent.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section id="resources" className="bg-[#F8FAF7] px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto max-w-[1480px]">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="mb-5 w-fit rounded-full border border-[#8FA69E]/35 bg-white px-4 py-2 text-sm font-semibold text-[#004C3B] shadow-sm">
              Closed-loop V2
            </p>
            <h2 className="text-5xl font-semibold leading-[1.03] tracking-[-0.055em] text-[#003F32] md:text-7xl">
              Du premier signal au deal attribué.
            </h2>
          </div>
          <div className="rounded-[28px] bg-[#DDFBEA] p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {proofPoints.map((point) => (
                <div key={point} className="flex items-center gap-3 text-sm font-semibold text-[#004C3B]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#003F32]">
                    <Check className="h-4 w-4 text-[#3EF2A0]" aria-hidden="true" />
                  </span>
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>

        <ClosedLoopPreview />

        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {workflow.map((step) => (
            <article
              key={step.number}
              className="rounded-[28px] border border-[#003F32]/10 bg-white p-6 shadow-[0_22px_70px_rgba(0,63,50,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_26px_90px_rgba(0,63,50,0.12)]"
            >
              <p className="font-mono text-sm text-[#006B55]">{step.number}</p>
              <h3 className="mt-8 text-2xl font-semibold tracking-[-0.04em] text-[#003F32]">
                {step.title}
              </h3>
              <p className="mt-4 text-base leading-7 text-[#49675D]">
                {step.text}
              </p>
            </article>
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
    <div className="mt-14 overflow-hidden rounded-[32px] border border-[#003F32]/10 bg-[#0A0D0B] p-5 text-white shadow-[0_28px_90px_rgba(0,63,50,0.14)] sm:p-8 lg:rounded-[40px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#3EF2A0]">
            Aperçu V2 · Deal timeline
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
            Une opportunité, une chronologie complète
          </h3>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#3EF2A0]/20 bg-[#3EF2A0]/10 px-3 py-2 text-[10px] font-semibold text-[#DDFBEA]">
          <GitBranch className="h-3.5 w-3.5 text-[#3EF2A0]" />
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
                      ? "border-[#3EF2A0]/22 bg-[#3EF2A0]/10"
                      : "border-white/[0.09] bg-white/[0.035]")
                  }
                >
                  <stage.icon
                    className={
                      "h-5 w-5 " +
                      (stage.done ? "text-[#3EF2A0]" : "text-white/40")
                    }
                    aria-hidden="true"
                  />
                  <p className="mt-3 text-[10px] font-semibold">{stage.label}</p>
                  <p className="mt-1 font-mono text-[8px] text-white/38">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-black/25 p-4">
            <Database className="mt-0.5 h-5 w-5 shrink-0 text-[#3EF2A0]" />
            <p className="text-xs leading-6 text-white/58">
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
              <item.icon className="h-5 w-5 text-[#3EF2A0]" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold">{item.title}</p>
              <p className="mt-2 text-[11px] leading-5 text-white/48">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-center text-[10px] text-white/38">
        Aperçu illustratif de l&apos;architecture cible V2.
      </p>
    </div>
  );
}

function FinalCTA() {
  return (
    <section className="bg-[#F8FAF7] p-3 sm:p-5">
      <div className="relative mx-auto overflow-hidden rounded-[32px] bg-[#020403] px-6 py-24 text-center text-white sm:rounded-[44px] lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(62,242,160,0.18),transparent_35%),linear-gradient(180deg,#020403,#050A0D)]" />
        <div className="relative z-10 mx-auto max-w-4xl">
          <p className="mx-auto mb-5 w-fit rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-2 text-sm font-semibold text-[#DDFBEA]/78">
            V2 progressive · Bêta privée
          </p>
          <h2 className="text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-[#F8FAF7] md:text-7xl">
            Ne perdez plus ce que vos campagnes vous apprennent.
          </h2>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#D8DEDA]/72">
            Vectis transforme progressivement chaque marque, contact, réponse,
            meeting et deal en intelligence réutilisable — avec validation
            humaine avant le premier outreach.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="mailto:contact@vectis.agency?subject=Démo%20Vectis%20Agency"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#F8FAF7] px-6 py-4 text-base font-semibold text-[#020403] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(62,242,160,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3EF2A0] active:scale-[0.98]"
            >
              Réserver une démo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.05] px-6 py-4 text-base font-semibold text-white/78 transition duration-200 hover:bg-white/[0.09] hover:text-white"
            >
              Connexion
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
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
    <div className="mx-auto max-w-4xl text-center">
      <p className="mx-auto mb-6 w-fit rounded-full border border-[#8FA69E]/45 bg-white px-4 py-2 text-sm font-semibold text-[#004C3B] shadow-sm">
        {badge}
      </p>
      <h2 className="text-5xl font-semibold leading-[1.04] tracking-[-0.055em] text-[#003F32] md:text-7xl">
        {title}
      </h2>
      <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#6D817A]">
        {text}
      </p>
    </div>
  );
}

function DotField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, index) => (
        <span
          key={index}
          className={
            index % 4 === 0
              ? "absolute h-7 w-7 rounded-full bg-[#8FA69E]/40 blur-[1px]"
              : index % 3 === 0
                ? "absolute h-5 w-5 rounded-full bg-[#3EF2A0]/70 shadow-[0_0_26px_rgba(62,242,160,0.35)]"
                : "absolute h-2.5 w-2.5 rounded-full bg-[#004C3B]/35"
          }
          style={{
            left: `${8 + (index * 17) % 86}%`,
            top: `${6 + (index * 29) % 88}%`,
          }}
        />
      ))}
    </div>
  );
}
