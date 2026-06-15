import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Bot,
  Building2,
  Check,
  ChevronRight,
  Lock,
  Mail,
  Menu,
  Network,
  Search,
  Send,
  Target,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Vectis Agency - Intelligence sponsoring IA",
  description:
    "Une plateforme IA premium pour identifier, qualifier et contacter les partenaires les plus pertinents pour sportifs de haut niveau.",
};

const navItems = [
  { label: "Vue d'ensemble", href: "#overview" },
  { label: "Technologie", href: "#technology" },
  { label: "Agents", href: "#agents" },
  { label: "Ressources", href: "#resources" },
];

const heroCards: Array<{ title: string; label: string; icon: LucideIcon }> = [
  { title: "Analyse profil", label: "Enrichissement", icon: Users },
  { title: "Graphe marques", label: "Recherche IA", icon: Network },
  { title: "Prospection sûre", label: "Domaine pro", icon: Lock },
];

const threats = [
  "Prospection générique sans angle sportif",
  "Marques incompatibles ou déjà verrouillées",
  "Contacts froids sans décideur identifié",
  "Messages trop longs ou peu crédibles",
  "Relances oubliées et pipeline dispersé",
  "Priorisation fondée sur l'intuition",
  "Conflits de catégorie non détectés",
  "Signaux d'actualité non exploités",
  "Manque de preuve commerciale",
  "Négociations lancées trop tôt",
];

const solutionPillars = [
  {
    title: "Intelligence profil",
    text: "Comprendre l'actualité, l'image, la communauté, le sport et le territoire avant de chercher les marques.",
  },
  {
    title: "Scoring sponsoring",
    text: "Prouver pourquoi une entreprise a une raison crédible de parler avec ce profil maintenant.",
    featured: true,
  },
  {
    title: "Contrôle de prospection",
    text: "Garder l'envoi, les relances, les statuts et les réponses dans un pipeline vérifiable.",
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
    role: "Recherche d'entreprises",
    icon: Search,
    text: "Cartographie des marques pertinentes par secteur, pays, budget probable, historique sponsoring et signaux d'opportunité.",
  },
  {
    name: "Matchmaker",
    role: "Scoring commercial",
    icon: Target,
    text: "Classe chaque piste selon la cohérence image, l'audience, l'accessibilité et la probabilité de conversion.",
  },
  {
    name: "Enrichisseur",
    role: "Contacts décideurs",
    icon: Building2,
    text: "Prépare les décideurs marketing, partenariat, communication ou fondateurs à contacter.",
  },
  {
    name: "Rédacteur",
    role: "Emails personnalisés",
    icon: Mail,
    text: "Transforme le rationnel de match en message court, spécifique et prêt à envoyer depuis votre domaine.",
  },
  {
    name: "Dispatcher",
    role: "Envoi & séquences",
    icon: Send,
    text: "Orchestre les premiers contacts, les relances et les statuts sans perdre le contexte commercial.",
  },
  {
    name: "Veilleur",
    role: "Réponses qualifiées",
    icon: Bot,
    text: "Surveille les retours, détecte les signaux chauds et remonte les opportunités au bon moment.",
  },
];

const workflow = [
  {
    number: "01",
    title: "Profil vérifié",
    text: "Le nom du sportif ou du club devient un profil commercial enrichi: sport, ville, niveau, audience, actualité, sponsors visibles.",
  },
  {
    number: "02",
    title: "Angles calculés",
    text: "L'IA construit des angles défendables: performance, lifestyle, diaspora, local, événementiel ou contenu social.",
  },
  {
    number: "03",
    title: "Marques scorées",
    text: "Chaque marque est justifiée, scorée et priorisée avant de devenir une opportunité dans le pipeline.",
  },
  {
    number: "04",
    title: "Prospection maîtrisée",
    text: "Les emails partent depuis votre boîte professionnelle avec suivi des relances, réponses et prochaines actions.",
  },
];

const proofPoints = [
  "Recherche hors équipementiers évidents",
  "Conflits de catégorie détectés",
  "Pipeline A/B/C expliqué",
  "Relances et réponses historisées",
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
    <header className="pointer-events-none fixed inset-x-0 top-5 z-50 px-5 md:px-10">
      <nav className="mx-auto flex max-w-[1540px] items-center justify-between">
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-3 text-[#F8FAF7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3EF2A0]"
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
      <div className="hero-shell relative mx-auto flex min-h-[880px] max-w-[1560px] overflow-hidden rounded-[32px] bg-[#020403] px-5 pb-12 pt-32 text-center text-[#F8FAF7] sm:rounded-[44px] sm:px-10 lg:min-h-[940px]">
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

        <div className="relative z-10 mx-auto flex w-full min-w-0 max-w-6xl flex-col items-center">
          <ChipVisual />

          <div className="landing-reveal mt-10">
            <p className="mx-auto mb-5 w-fit rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-2 text-sm font-semibold text-[#DDFBEA]/78 backdrop-blur-xl">
              Intelligence sponsoring IA
            </p>
            <h1 className="mx-auto max-w-[310px] text-[43px] font-semibold leading-[0.96] tracking-[-0.055em] text-[#F8FAF7] sm:max-w-5xl sm:text-[78px] lg:text-[112px]">
              Le bon <br className="sm:hidden" />
              Partenaire <br className="sm:hidden" />
              Qualifié
            </h1>
          </div>

          <p
            className="landing-reveal mx-auto mt-7 max-w-[260px] text-[15px] leading-8 text-[#D8DEDA]/78 sm:max-w-2xl sm:text-xl"
          >
            Vectis qualifie les profils sportifs, les marques et les contacts avant le
            premier email. Une prospection IA structurée pour ne transmettre à
            l&apos;agent que les leads prêts à avancer.
          </p>

          <div
            className="landing-reveal mt-8 flex flex-col items-center gap-4 sm:flex-row"
          >
            <Link
              href="mailto:contact@vectis.agency?subject=Démo%20Vectis%20Agency"
              className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#F8FAF7] px-6 py-4 text-base font-semibold text-[#020403] shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_22px_80px_rgba(62,242,160,0.16)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(62,242,160,0.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3EF2A0] active:scale-[0.98]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3EF2A0] text-[#003F32]">
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
              Réserver une démo
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.05] px-6 py-4 text-base font-semibold text-white/78 backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.09] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3EF2A0] active:scale-[0.98]"
            >
              Accéder à la plateforme
            </Link>
          </div>

          <p
            className="landing-reveal mt-16 max-w-[270px] text-sm font-medium leading-6 text-[#D8DEDA]/68 sm:mt-20 sm:max-w-none"
          >
            Bêta privée · Pensé pour agents sportifs et agences d&apos;image
          </p>

          <div className="landing-reveal mt-6 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
            {heroCards.map((card) => (
              <div
                key={card.title}
                className="group rounded-[22px] border border-white/[0.14] bg-white/[0.08] p-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition duration-200 hover:-translate-y-1 hover:border-[#3EF2A0]/40 hover:bg-white/[0.11]"
              >
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[#050A0D]/60">
                  <card.icon className="h-5 w-5 text-[#3EF2A0]" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold text-white">{card.title}</p>
                <p className="mt-1 text-xs text-[#8FA69E]">{card.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ChipVisual() {
  return (
    <div className="chip-wrap">
      <div className="chip-pins chip-pins-top" aria-hidden="true" />
      <div className="chip-pins chip-pins-bottom" aria-hidden="true" />
      <div className="chip-pins chip-pins-left" aria-hidden="true" />
      <div className="chip-pins chip-pins-right" aria-hidden="true" />
      <div className="chip-core">
        <div className="chip-grid" aria-hidden="true" />
        <span className="text-lg font-semibold tracking-[-0.04em] text-[#F8FAF7]">
          VCT
        </span>
      </div>
    </div>
  );
}

function ProblemSection() {
  return (
    <section className="bg-[#F8FAF7] px-5 py-24 sm:px-8 lg:py-36">
      <div className="mx-auto max-w-[1480px]">
        <SectionIntro
          badge="Le problème"
          title={
            <>
              Nouveaux usages IA,{" "}
              <span className="text-[#3EF2A0]">nouveaux risques</span>
            </>
          }
          text="Dans le sponsoring sportif, l'automatisation crée de la vitesse. Sans qualification, elle crée aussi du bruit, des messages faibles et des opportunités qui n'auraient jamais dû entrer dans le pipeline."
        />

        <div className="mt-16 grid overflow-hidden rounded-[32px] bg-[#DDFBEA] shadow-[0_28px_90px_rgba(0,63,50,0.12)] lg:grid-cols-[1fr_1fr] lg:rounded-[44px]">
          <div className="relative min-h-[360px] overflow-hidden bg-[#020403] p-8 text-white sm:min-h-[520px] sm:p-12">
            <div className="threat-visual-orb threat-visual-left" aria-hidden="true" />
            <div className="threat-visual-orb threat-visual-right" aria-hidden="true" />
            <div className="threat-float threat-float-one" aria-hidden="true" />
            <div className="threat-float threat-float-two" aria-hidden="true" />
            <div className="threat-float threat-float-three" aria-hidden="true" />
            <div className="relative z-10 flex h-full min-h-[300px] items-center justify-center">
              <div className="text-center">
                <p className="text-4xl font-semibold tracking-[-0.04em] text-[#F8FAF7] sm:text-6xl">
                  Nouveaux risques
                </p>
                <div className="mx-auto mt-4 h-px w-56 bg-gradient-to-r from-transparent via-[#DDFBEA] to-transparent" />
              </div>
            </div>
          </div>

          <div className="p-7 sm:p-12 lg:p-16">
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#003F32] sm:text-5xl">
              Le problème
            </h2>
            <div className="mt-10 grid gap-x-10 gap-y-5 sm:grid-cols-2">
              {threats.map((threat) => (
                <div
                  key={threat}
                  className="group flex items-start gap-3 text-[15px] font-semibold leading-6 text-[#004C3B] transition duration-200 hover:translate-x-1"
                >
                  <ChevronRight
                    className="mt-1 h-4 w-4 shrink-0 text-[#006B55] transition group-hover:text-[#2CFF93]"
                    aria-hidden="true"
                  />
                  <span>{threat}</span>
                </div>
              ))}
            </div>
            <Link
              href="#technology"
              className="mt-12 inline-flex items-center gap-3 rounded-full bg-[#006B55] px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#004C3B] hover:shadow-[0_20px_45px_rgba(0,76,59,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3EF2A0] active:scale-[0.98]"
            >
              Voir les solutions
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SolutionSection() {
  return (
    <section id="technology" className="relative overflow-hidden bg-[#F8FAF7] px-5 py-24 sm:px-8 lg:py-36">
      <DotField />
      <div className="relative z-10 mx-auto max-w-[1480px]">
        <SectionIntro
          badge="Solutions"
          title={
            <>
              Faire évoluer la confiance <br className="hidden sm:block" />
              <span className="text-[#3EF2A0]">IA avec Vectis</span>
            </>
          }
          text="Une architecture d'agents spécialisés qui transforme la recherche, le scoring et l'outreach en système contrôlé."
        />

        <div className="solution-panel mt-16 grid overflow-hidden rounded-[32px] bg-[#003F32] p-8 text-white shadow-[0_38px_120px_rgba(0,63,50,0.22)] sm:p-12 lg:grid-cols-[0.9fr_120px_1.2fr] lg:rounded-[44px] lg:p-24">
          <div className="flex items-center">
            <h3 className="solution-word text-5xl font-semibold tracking-[-0.055em] text-[#3EF2A0] sm:text-7xl lg:text-8xl">
              Verifiable
            </h3>
          </div>

          <div className="relative my-12 hidden justify-center lg:flex">
            <div className="solution-line" aria-hidden="true" />
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className={
                  dot === 1
                    ? "absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3EF2A0] shadow-[0_0_32px_rgba(62,242,160,0.55)]"
                    : "absolute left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-[#3EF2A0]/80 shadow-[0_0_22px_rgba(62,242,160,0.35)]"
                }
                style={{ top: dot === 0 ? "16%" : dot === 1 ? "50%" : "84%" }}
              />
            ))}
          </div>

          <div className="space-y-8">
            {solutionPillars.map((pillar) => (
              <article
                key={pillar.title}
                className={
                  pillar.featured
                    ? "rounded-[28px] border border-[#3EF2A0]/28 bg-white/[0.08] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                    : "p-2"
                }
              >
                <h4 className="text-2xl font-semibold tracking-[-0.04em] text-[#3EF2A0]">
                  {pillar.title}
                </h4>
                <p className="mt-3 max-w-xl text-base leading-7 text-[#D8DEDA]/78">
                  {pillar.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
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
              Six agents. Un pipeline maîtrisé.
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-[#8FA69E]">
            Chaque agent possède un rôle clair. Le résultat n&apos;est pas une
            liste de noms, mais une séquence commerciale qualifiée, traçable et
            prête à être activée.
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
              Système opérationnel
            </p>
            <h2 className="text-5xl font-semibold leading-[1.03] tracking-[-0.055em] text-[#003F32] md:text-7xl">
              Du signal sportif au deal qualifié.
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

        <div className="mt-14 grid gap-4 lg:grid-cols-4">
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

function FinalCTA() {
  return (
    <section className="bg-[#F8FAF7] p-3 sm:p-5">
      <div className="relative mx-auto overflow-hidden rounded-[32px] bg-[#020403] px-6 py-24 text-center text-white sm:rounded-[44px] lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(62,242,160,0.18),transparent_35%),linear-gradient(180deg,#020403,#050A0D)]" />
        <div className="relative z-10 mx-auto max-w-4xl">
          <p className="mx-auto mb-5 w-fit rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-2 text-sm font-semibold text-[#DDFBEA]/78">
            Bêta privée
          </p>
          <h2 className="text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-[#F8FAF7] md:text-7xl">
            Automatisez la recherche. Gardez la négociation.
          </h2>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#D8DEDA]/72">
            Vectis Agency aide les agents, managers et agences d&apos;image à
            industrialiser la recherche de partenaires sans perdre la qualité du
            jugement commercial.
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
