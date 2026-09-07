import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { LandingMotionController } from "@/components/landing/LandingMotion";
import { agentAvatars } from "@/lib/agent-avatars";
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
  title: "Vectis Agency — Trouvez et signez des sponsors pour vos sportifs",
  description:
    "Vectis trouve les marques cohérentes avec chaque sportif, identifie le décideur, rédige le premier contact et suit chaque opportunité jusqu'au contrat. Six agents IA, validation humaine avant chaque envoi.",
};

const navItems = [
  { label: "Plateforme", href: "#overview" },
  { label: "Méthode", href: "#technology" },
  { label: "Agents", href: "#agents" },
  { label: "Comment ça marche", href: "#resources" },
];

const heroCards: Array<{ title: string; label: string; icon: LucideIcon }> = [
  { title: "Profil du sportif", label: "Analysé et enrichi", icon: Users },
  { title: "Marques scorées", label: "Recherche web + IA", icon: Network },
  { title: "Envoi depuis votre boîte", label: "Gmail, Outlook, SMTP", icon: Lock },
];

const dataBreaks = [
  "Les sponsors évidents sont saturés, les autres restent introuvables",
  "Le bon interlocuteur a changé de poste sans que vous le sachiez",
  "Les mails génériques finissent sans réponse",
  "Les relances dépendent de votre mémoire",
  "Réponses, rendez-vous et contrats sont éparpillés entre mails, LinkedIn et tableur",
  "Ce qui a marché la dernière fois n'est écrit nulle part",
];

const solutionPillars = [
  {
    title: "Une base qui relie tout",
    text: "Sportifs, marques, décideurs, échanges et contrats vivent dans une seule base, pas dans trois outils.",
  },
  {
    title: "Des scores qui s'améliorent",
    text: "Une réponse positive, un rendez-vous ou une signature renforce le score des marques, des rôles et des messages similaires.",
    featured: true,
  },
  {
    title: "Rien ne sort du radar",
    text: "Une opportunité reste suivie du premier contact jusqu'au contrat signé ou perdu, même quand le rendez-vous a lieu hors de la plateforme.",
  },
];

const agents: Array<{
  name: string;
  role: string;
  icon: LucideIcon;
  avatar: string;
  text: string;
  command: string;
  result: string;
  capabilities: [string, string, string];
}> = [
  {
    name: "Scout",
    role: "Recherche de marques",
    icon: Search,
    avatar: agentAvatars.scout,
    text: "Cherche sur le web les marques cohérentes avec le profil du sportif, en écartant les sponsors évidents que tout le monde sollicite déjà.",
    command:
      "Trouve 25 marques cohérentes avec ce profil, hors sponsors évidents.",
    result: "25 marques trouvées, 18 nouvelles pistes prêtes à être scorées.",
    capabilities: [
      "Recherche web ciblée",
      "Aucun doublon par sportif",
      "Sources conservées",
    ],
  },
  {
    name: "Matchmaker",
    role: "Scoring des marques",
    icon: Target,
    avatar: agentAvatars.matchmaker,
    text: "Note chaque marque sur la cohérence d'image, l'audience, l'historique sponsoring et le timing, puis classe les priorités A, B et C.",
    command:
      "Classe ces marques selon leur vraie probabilité de répondre.",
    result: "7 opportunités en priorité A, chacune avec son argumentaire.",
    capabilities: [
      "Score sur 6 critères",
      "Argumentaire par marque",
      "Priorités A, B et C",
    ],
  },
  {
    name: "Enrichisseur",
    role: "Identification du décideur",
    icon: Building2,
    avatar: agentAvatars.enrichisseur,
    text: "Trouve la personne en charge des partenariats, vérifie qu'elle est toujours en poste et que son email est valide, sans jamais exposer ses coordonnées.",
    command:
      "Identifie le responsable sponsoring actuel de chaque marque prioritaire.",
    result:
      "5 décideurs en poste identifiés, dont 3 prêts à contacter.",
    capabilities: [
      "Poste vérifié",
      "Email vérifié avant envoi",
      "Coordonnées protégées",
    ],
  },
  {
    name: "Rédacteur",
    role: "Premier contact",
    icon: Mail,
    avatar: agentAvatars.redacteur,
    text: "Rédige un premier mail en votre nom, fondé sur des faits vérifiables, qui ouvre la discussion sans vendre une prestation.",
    command:
      "Rédige un premier contact crédible à partir du profil et du match.",
    result: "Un mail personnalisé, prêt à relire et à envoyer.",
    capabilities: [
      "Votre ton, votre signature",
      "Relances J+4 et J+10",
      "Relecture avant envoi",
    ],
  },
  {
    name: "Dispatcher",
    role: "Envoi et relances",
    icon: Send,
    avatar: agentAvatars.dispatcher,
    text: "Envoie depuis votre Gmail, Outlook ou SMTP, programme les relances et garde tout le fil dans la fiche de l'opportunité.",
    command:
      "Envoie les mails validés et relance ceux qui n'ont pas répondu.",
    result: "Séquence programmée, fil de conversation conservé.",
    capabilities: [
      "Votre boîte mail, votre nom",
      "Relance uniquement sans réponse",
      "Historique complet",
    ],
  },
  {
    name: "Veilleur",
    role: "Réponses et signaux",
    icon: Bot,
    avatar: agentAvatars.veilleur,
    text: "Lit les réponses, les classe, met à jour le pipeline et repère les nouveaux signaux, comme un changement de sponsor chez une marque.",
    command:
      "Surveille les réponses et transforme chaque signal en action.",
    result:
      "Réponse positive détectée, rendez-vous proposé, pipeline mis à jour.",
    capabilities: [
      "Réponses classées automatiquement",
      "Alertes marché",
      "Prochaine action proposée",
    ],
  },
];

const workflow = [
  {
    number: "01",
    title: "Trouver et scorer",
    text: "Le profil du sportif et l'actualité des marques produisent une shortlist courte, notée et argumentée.",
  },
  {
    number: "02",
    title: "Identifier le décideur",
    text: "Le bon interlocuteur est trouvé, vérifié en poste et joignable. Vous validez avant tout envoi.",
  },
  {
    number: "03",
    title: "Contacter et relancer",
    text: "Mail, relances, réponses, rendez-vous et contrat restent dans la fiche de l'opportunité.",
  },
  {
    number: "04",
    title: "Apprendre",
    text: "Chaque résultat affine les prochaines shortlists, les rôles à cibler et les messages qui obtiennent des réponses.",
  },
];

const proofPoints = [
  "Vous validez chaque mail avant envoi",
  "Coordonnées jamais exposées",
  "Envoi depuis votre propre boîte mail",
  "Chaque deal garde son origine",
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
            Réserver une démo
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
            <span className="sr-only">Ouvrir le menu</span>
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
                Réserver une démo
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
              Bêta privée · Prospection sponsoring assistée par IA
            </div>
            <h1 className="text-balance text-[44px] font-semibold leading-[0.96] tracking-[-0.06em] text-[#F6F4EF] sm:text-[72px] lg:text-[92px]">
              Signez plus de sponsors,{" "}
              <span className="text-[#FF6B3D]">sans prospecter à l&apos;aveugle.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-[16px] leading-8 text-[#D5D7DF]/72 sm:text-lg">
              Vectis trouve les marques cohérentes avec chaque sportif, identifie
              le décideur, rédige le premier contact et suit l&apos;opportunité
              jusqu&apos;à la signature. Vous gardez la main sur chaque envoi.
            </p>

            <HeroCommandBar />

            <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm text-[#D5D7DF]/62">
              {["Marques hors évidences", "Décideurs vérifiés", "Suivi jusqu'à la signature"].map(
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
          Trouve des marques prêtes à sponsoriser une nageuse de niveau national, hors sponsors évidents
        </p>
      </div>
      <div className="mt-2 flex flex-col gap-2 border-t border-white/[0.09] pt-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.10] bg-black/20 px-3 py-2 text-xs font-medium text-[#D5D7DF]/72">
          <Bot className="h-3.5 w-3.5 text-[#FF6B3D]" aria-hidden="true" />
          Six agents IA · vous validez chaque envoi
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
            href="#resources"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.07] px-5 py-3 text-sm font-semibold text-white/[0.82] transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.11] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF6B3D] active:scale-[0.98]"
          >
            Comment ça marche
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
      profile: "Attaquant · Ligue 2",
      score: 94,
      state: "Décideur vérifié",
    },
    {
      brand: "Atlas Mobility",
      profile: "Judokate · Équipe de France",
      score: 88,
      state: "Mail à valider",
    },
    {
      brand: "North Studio",
      profile: "Club de handball · Nationale 1",
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
            Aperçu de la plateforme
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-[#FFF0EA] px-2.5 py-1 text-[10px] font-semibold text-[#B23A20]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E85832]" />
            Exemple
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
                  Bonjour Camille,
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
                  Vos priorités du jour
                </h2>
              </div>
              <span className="hidden rounded-full bg-[#141720] px-4 py-2 text-xs font-semibold text-white sm:inline-flex">
                Lancer un scan
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { value: "18", label: "Marques scorées" },
                { value: "7", label: "Décideurs vérifiés" },
                { value: "4", label: "Relances à faire" },
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
                  Opportunités recommandées
                </span>
                <span className="text-[10px] text-[#5F6570]">
                  À l&apos;instant
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
                à envoyer aujourd&apos;hui
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
          badge="Le problème"
          title={
            <>
              La prospection sponsoring se fait{" "}
              <span className="text-[#FF6B3D]">encore à la main.</span>
            </>
          }
          text="Recherche de marques sur Google, contacts LinkedIn au hasard, mails sans réponse, tableur jamais à jour. Des semaines de travail pour quelques contrats."
        />

        <ScrollReveal direction="scale" className="mt-16">
          <div className="grid items-center gap-10 rounded-[32px] bg-[#FFE4D8] p-6 shadow-[0_28px_90px_rgba(23,26,35,0.12)] sm:p-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16 lg:rounded-[44px] lg:p-16">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#B23A20]">
                Ce que ça vous coûte
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-[#171A23] sm:text-5xl">
                Chaque campagne repart de zéro.
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
                Voir comment Vectis s&apos;y prend
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
            Aperçu · Décideur identifié
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#171A21]">
            Interlocuteur recommandé
          </h3>
        </div>
        <span className="rounded-full bg-[#FFF0EA] px-3 py-1.5 text-[10px] font-semibold text-[#B23A20]">
          À valider avant envoi
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
                    Responsable partenariats · marque cible
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#E85832]/25 bg-[#FFF0EA] font-mono text-base font-bold text-[#B23A20]">
                  96
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {[
                  ["En poste", "Vérifié"],
                  ["Email", "Vérifié"],
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
              Email et téléphone restent privés sur nos serveurs. Le mail part
              de votre boîte pro, après votre validation.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {["Bon contact", "Moyen", "Hors cible"].map((feedback, index) => (
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
          Votre avis sur chaque contact affine les prochaines recommandations.
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
          badge="La méthode Vectis"
          title={
            <>
              Un CRM enregistre. <br className="hidden sm:block" />
              <span className="text-[#FF6B3D]">Vectis apprend.</span>
            </>
          }
          text="Chaque marque contactée, chaque réponse, chaque rendez-vous et chaque contrat signé améliore les recommandations suivantes. Plus vous l'utilisez, plus les shortlists sont justes."
        />

        <ScrollReveal direction="scale" className="mt-16">
          <div className="solution-panel grid items-center gap-10 overflow-hidden rounded-[32px] bg-[#171A23] p-6 text-white shadow-[0_38px_120px_rgba(23,26,35,0.22)] sm:p-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16 lg:rounded-[44px] lg:p-16">
            <div className="space-y-5">
              <div className="mb-8">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF6B3D]">
                  Ce qui nous distingue
                </p>
                <h3 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#F6F4EF] sm:text-5xl">
                  Vos campagnes deviennent votre avantage.
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
    ["Mails envoyés", "184", "Avec leur contexte"],
    ["Réponses positives", "31", "Classées à la lecture"],
    ["Rendez-vous obtenus", "14", "Enregistrés dans la fiche"],
    ["Contrats signés", "5", "Rattachés à leur origine"],
  ];

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/[0.14] bg-[#F7F5F1] text-[#171A21] shadow-[0_34px_110px_rgba(0,0,0,0.32)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.07] bg-white px-5 py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#B23A20]">
            Aperçu · Ce que la plateforme apprend
          </p>
          <h3 className="mt-1 text-lg font-semibold">
            Quels interlocuteurs répondent, par secteur
          </h3>
        </div>
        <span className="rounded-full bg-[#FFF0EA] px-3 py-1.5 text-[10px] font-semibold text-[#B23A20]">
          Mis à jour à chaque campagne
        </span>
      </div>

      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap gap-2">
          {[
            "Partenariats sportifs",
            "Équipementiers",
            "+5 000 salariés",
            "Tous sports",
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
                Taux de réponse par rôle
              </p>
              <p className="mt-1 text-lg font-semibold">
                Les bons interlocuteurs ressortent avec le volume
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
            Pondéré par l&apos;historique · aucune boîte noire
          </div>
        </div>

        <p className="mt-3 text-center text-[10px] text-[#5F6570]">
          Chiffres d&apos;exemple.
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
              Six agents IA · vous gardez la main
            </p>
            <h2 className="text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-[#F6F4EF] md:text-7xl">
              Six agents. Un seul objectif : signer.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#969BA8]">
              Chaque agent a une mission précise. Ensemble, ils couvrent toute
              la chaîne, de la recherche de marques au suivi des réponses.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="mailto:contact@vectis.agency?subject=Démo%20Vectis%20Agency"
                className="landing-primary-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[#0B0D12] transition duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                Réserver une démo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="#resources"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white/[0.80] transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.10] hover:text-white active:scale-[0.98]"
              >
                Voir le parcours complet
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
                <span className="relative h-8 w-8 overflow-hidden rounded-full border border-white/[0.12] bg-[#15110E] transition group-hover:border-[#FF6B3D]/35">
                  <Image
                    src={agent.avatar}
                    alt=""
                    fill
                    sizes="32px"
                    className="object-cover object-top transition duration-300 group-hover:scale-110"
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
          aria-label="Présentation des agents Vectis"
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
                      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-2xl border border-[#FF6B3D]/22 bg-[#0B0908] shadow-[0_0_24px_rgba(255,107,61,0.12)]">
                        <Image
                          src={agent.avatar}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover object-top"
                          aria-hidden="true"
                        />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-white">
                          {agent.name} a terminé la mission
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#969BA8]">
                          Résultat enregistré dans la fiche
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col p-5 sm:p-8 lg:p-10">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-4 sm:gap-5">
                      <span className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[24px] border border-[#FF6B3D]/22 bg-[#0B0908] shadow-[0_18px_48px_rgba(0,0,0,0.28),0_0_42px_rgba(255,107,61,0.10)] sm:h-32 sm:w-32 sm:rounded-[30px]">
                        <Image
                          src={agent.avatar}
                          alt={`Portrait 3D de l'agent ${agent.name}`}
                          fill
                          sizes="(min-width: 640px) 128px, 96px"
                          className="object-cover object-top transition duration-500 group-hover:scale-[1.035]"
                        />
                        <span className="absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.12] bg-black/55 backdrop-blur-md sm:bottom-3 sm:left-3">
                          <agent.icon
                            className="h-4 w-4 text-[#FF6B3D]"
                            aria-hidden="true"
                          />
                        </span>
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
                Comment ça marche
              </p>
              <h2 className="text-5xl font-semibold leading-[1.03] tracking-[-0.055em] text-[#F6F4EF] md:text-7xl">
                Du premier contact au contrat signé.
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
    { label: "Décideur", icon: Users, done: true },
    { label: "Contact", icon: Send, done: true },
    { label: "Réponse", icon: MessageSquareReply, done: true },
    { label: "Rendez-vous", icon: CalendarCheck, done: true },
    { label: "Proposition", icon: FileText, done: true },
    { label: "Signature", icon: CheckCircle2, done: true },
    { label: "Apprentissage", icon: RotateCcw, done: false },
  ];

  return (
    <div className="mt-14 overflow-hidden rounded-[32px] border border-[#171A23]/10 bg-[#141720] p-5 text-white shadow-[0_28px_90px_rgba(23,26,35,0.14)] sm:p-8 lg:rounded-[40px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#FF6B3D]">
            Aperçu · Suivi d&apos;une opportunité
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
            Une opportunité, tout son historique
          </h3>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#FF6B3D]/20 bg-[#FF6B3D]/10 px-3 py-2 text-[10px] font-semibold text-[#FFE4D8]">
          <GitBranch className="h-3.5 w-3.5 text-[#FF6B3D]" />
          Origine conservée
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
              À chaque étape, Vectis garde ce qui a été décidé : sportif,
              marque, interlocuteur, score, message envoyé et résultat.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {[
            {
              icon: CalendarCheck,
              title: "Rendez-vous hors plateforme",
              text: "Notez le résultat en un clic, le suivi continue.",
            },
            {
              icon: FileText,
              title: "Contrat envoyé par la marque",
              text: "Ajoutez le document, le deal reste dans le pipeline.",
            },
            {
              icon: ShieldCheck,
              title: "Origine conservée",
              text: "On sait toujours quelle recherche a mené à quelle signature.",
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
            Bêta privée · Sur invitation
          </p>
          <h2 className="text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-[#F6F4EF] md:text-7xl">
            Vos sportifs méritent mieux que des mails sans réponse.
          </h2>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#D5D7DF]/72">
            Réservez une démo : on vous montre la plateforme sur le profil
            d&apos;un de vos sportifs, de la shortlist de marques au premier mail.
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
