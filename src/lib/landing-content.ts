export type Locale = "fr" | "en";

export const LOCALES: Locale[] = ["fr", "en"];

export const localePath: Record<Locale, string> = { fr: "/", en: "/en" };

type AgentAvatarKey =
  | "scout"
  | "matchmaker"
  | "enrichisseur"
  | "redacteur"
  | "dispatcher"
  | "veilleur";

export type LandingAgent = {
  avatarKey: AgentAvatarKey;
  name: string;
  role: string;
  text: string;
  command: string;
  result: string;
  capabilities: [string, string, string];
};

export type LandingContent = {
  meta: { title: string; description: string };
  demoMailto: string;
  nav: {
    items: Array<{ label: string; href: string }>;
    login: string;
    demo: string;
    openMenu: string;
    languageLabel: string;
  };
  hero: {
    badge: string;
    titleStart: string;
    titleAccent: string;
    subtitle: string;
    command: string;
    chip: string;
    demoCta: string;
    howCta: string;
    checks: string[];
    cards: Array<{ title: string; label: string }>;
  };
  preview: {
    label: string;
    badge: string;
    sidebar: [string, string, string, string];
    greeting: string;
    heading: string;
    scanCta: string;
    stats: Array<{ value: string; label: string }>;
    listTitle: string;
    updated: string;
    opportunities: Array<{
      brand: string;
      profile: string;
      score: number;
      state: string;
    }>;
    priority: string;
    followups: string;
  };
  problem: {
    badge: string;
    titleStart: string;
    titleAccent: string;
    text: string;
    eyebrow: string;
    heading: string;
    items: string[];
    cta: string;
  };
  contactPreview: {
    eyebrow: string;
    heading: string;
    badge: string;
    role: string;
    roleSub: string;
    metrics: Array<[string, string]>;
    notice: string;
    feedback: [string, string, string];
    note: string;
  };
  solution: {
    badge: string;
    titleStart: string;
    titleAccent: string;
    text: string;
    eyebrow: string;
    heading: string;
    pillars: Array<{ title: string; text: string; featured?: boolean }>;
  };
  learning: {
    eyebrow: string;
    heading: string;
    badge: string;
    filters: string[];
    events: Array<[string, string, string]>;
    trendLabel: string;
    trendTitle: string;
    footnote: string;
    disclaimer: string;
  };
  agents: {
    badge: string;
    title: string;
    text: string;
    demoCta: string;
    journeyCta: string;
    mission: string;
    done: string;
    saved: string;
    active: string;
    nameFormat: string;
    portraitAlt: string;
    scrollHint: string;
    regionLabel: string;
    list: LandingAgent[];
  };
  workflow: {
    badge: string;
    title: string;
    proofPoints: string[];
    steps: Array<{ number: string; title: string; text: string }>;
    timeline: {
      eyebrow: string;
      heading: string;
      badge: string;
      stages: [string, string, string, string, string, string, string, string];
      note: string;
      cards: Array<{ title: string; text: string }>;
    };
  };
  final: {
    badge: string;
    title: string;
    text: string;
    demoCta: string;
    login: string;
  };
  footer: {
    tagline: string;
    columns: Array<{
      title: string;
      links: Array<{ label: string; href: string }>;
    }>;
    rights: string;
    note: string;
  };
};

/** Replaces `{name}` in a content template. */
export function fill(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
}

const fr: LandingContent = {
  meta: {
    title: "Vectis Agency — Trouvez et signez des sponsors pour vos sportifs",
    description:
      "Vectis trouve les marques cohérentes avec chaque sportif, identifie le décideur, rédige le premier contact et suit chaque opportunité jusqu'au contrat. Six agents IA, validation humaine avant chaque envoi.",
  },
  demoMailto: "mailto:contact@vectis.agency?subject=Démo%20Vectis%20Agency",
  nav: {
    items: [
      { label: "Plateforme", href: "#overview" },
      { label: "Méthode", href: "#technology" },
      { label: "Agents", href: "#agents" },
      { label: "Comment ça marche", href: "#resources" },
    ],
    login: "Connexion",
    demo: "Réserver une démo",
    openMenu: "Ouvrir le menu",
    languageLabel: "Langue",
  },
  hero: {
    badge: "Bêta privée · Prospection sponsoring assistée par IA",
    titleStart: "Signez plus de sponsors,",
    titleAccent: "sans prospecter à l'aveugle.",
    subtitle:
      "Vectis trouve les marques cohérentes avec chaque sportif, identifie le décideur, rédige le premier contact et suit l'opportunité jusqu'à la signature. Vous gardez la main sur chaque envoi.",
    command:
      "Trouve des marques prêtes à sponsoriser une nageuse de niveau national, hors sponsors évidents",
    chip: "Six agents IA · vous validez chaque envoi",
    demoCta: "Réserver une démo",
    howCta: "Comment ça marche",
    checks: [
      "Marques hors évidences",
      "Décideurs vérifiés",
      "Suivi jusqu'à la signature",
    ],
    cards: [
      { title: "Profil du sportif", label: "Analysé et enrichi" },
      { title: "Marques scorées", label: "Recherche web + IA" },
      { title: "Envoi depuis votre boîte", label: "Gmail, Outlook, SMTP" },
    ],
  },
  preview: {
    label: "Aperçu de la plateforme",
    badge: "Exemple",
    sidebar: ["Vue d'ensemble", "Prospection", "Pipeline", "Emails"],
    greeting: "Bonjour Camille,",
    heading: "Vos priorités du jour",
    scanCta: "Lancer un scan",
    stats: [
      { value: "18", label: "Marques scorées" },
      { value: "7", label: "Décideurs vérifiés" },
      { value: "4", label: "Relances à faire" },
    ],
    listTitle: "Opportunités recommandées",
    updated: "À l'instant",
    opportunities: [
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
    ],
    priority: "Priorité",
    followups: "3 relances à envoyer aujourd'hui",
  },
  problem: {
    badge: "Le problème",
    titleStart: "La prospection sponsoring se fait",
    titleAccent: "encore à la main.",
    text: "Recherche de marques sur Google, contacts LinkedIn au hasard, mails sans réponse, tableur jamais à jour. Des semaines de travail pour quelques contrats.",
    eyebrow: "Ce que ça vous coûte",
    heading: "Chaque campagne repart de zéro.",
    items: [
      "Les sponsors évidents sont saturés, les autres restent introuvables",
      "Le bon interlocuteur a changé de poste sans que vous le sachiez",
      "Les mails génériques finissent sans réponse",
      "Les relances dépendent de votre mémoire",
      "Réponses, rendez-vous et contrats sont éparpillés entre mails, LinkedIn et tableur",
      "Ce qui a marché la dernière fois n'est écrit nulle part",
    ],
    cta: "Voir comment Vectis s'y prend",
  },
  contactPreview: {
    eyebrow: "Aperçu · Décideur identifié",
    heading: "Interlocuteur recommandé",
    badge: "À valider avant envoi",
    role: "Head of Sports Partnerships",
    roleSub: "Responsable partenariats · marque cible",
    metrics: [
      ["En poste", "Vérifié"],
      ["Email", "Vérifié"],
      ["Pertinence", "Très forte"],
    ],
    notice:
      "Email et téléphone restent privés sur nos serveurs. Le mail part de votre boîte pro, après votre validation.",
    feedback: ["Bon contact", "Moyen", "Hors cible"],
    note: "Votre avis sur chaque contact affine les prochaines recommandations.",
  },
  solution: {
    badge: "La méthode Vectis",
    titleStart: "Un CRM enregistre.",
    titleAccent: "Vectis apprend.",
    text: "Chaque marque contactée, chaque réponse, chaque rendez-vous et chaque contrat signé améliore les recommandations suivantes. Plus vous l'utilisez, plus les shortlists sont justes.",
    eyebrow: "Ce qui nous distingue",
    heading: "Vos campagnes deviennent votre avantage.",
    pillars: [
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
    ],
  },
  learning: {
    eyebrow: "Aperçu · Ce que la plateforme apprend",
    heading: "Quels interlocuteurs répondent, par secteur",
    badge: "Mis à jour à chaque campagne",
    filters: [
      "Partenariats sportifs",
      "Équipementiers",
      "+5 000 salariés",
      "Tous sports",
    ],
    events: [
      ["Mails envoyés", "184", "Avec leur contexte"],
      ["Réponses positives", "31", "Classées à la lecture"],
      ["Rendez-vous obtenus", "14", "Enregistrés dans la fiche"],
      ["Contrats signés", "5", "Rattachés à leur origine"],
    ],
    trendLabel: "Taux de réponse par rôle",
    trendTitle: "Les bons interlocuteurs ressortent avec le volume",
    footnote: "Pondéré par l'historique · aucune boîte noire",
    disclaimer: "Chiffres d'exemple.",
  },
  agents: {
    badge: "Six agents IA · vous gardez la main",
    title: "Six agents. Un seul objectif : signer.",
    text: "Chaque agent a une mission précise. Ensemble, ils couvrent toute la chaîne, de la recherche de marques au suivi des réponses.",
    demoCta: "Réserver une démo",
    journeyCta: "Voir le parcours complet",
    mission: "Mission confiée",
    done: "{name} a terminé la mission",
    saved: "Résultat enregistré dans la fiche",
    active: "Actif",
    nameFormat: "Agent {name}",
    portraitAlt: "Portrait 3D de l'agent {name}",
    scrollHint: "Faites défiler pour découvrir chaque agent",
    regionLabel: "Présentation des agents Vectis",
    list: [
      {
        avatarKey: "scout",
        name: "Scout",
        role: "Recherche de marques",
        text: "Cherche sur le web les marques cohérentes avec le profil du sportif, en écartant les sponsors évidents que tout le monde sollicite déjà.",
        command:
          "Trouve 25 marques cohérentes avec ce profil, hors sponsors évidents.",
        result:
          "25 marques trouvées, 18 nouvelles pistes prêtes à être scorées.",
        capabilities: [
          "Recherche web ciblée",
          "Aucun doublon par sportif",
          "Sources conservées",
        ],
      },
      {
        avatarKey: "matchmaker",
        name: "Matchmaker",
        role: "Scoring des marques",
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
        avatarKey: "enrichisseur",
        name: "Enrichisseur",
        role: "Identification du décideur",
        text: "Trouve la personne en charge des partenariats, vérifie qu'elle est toujours en poste et que son email est valide, sans jamais exposer ses coordonnées.",
        command:
          "Identifie le responsable sponsoring actuel de chaque marque prioritaire.",
        result: "5 décideurs en poste identifiés, dont 3 prêts à contacter.",
        capabilities: [
          "Poste vérifié",
          "Email vérifié avant envoi",
          "Coordonnées protégées",
        ],
      },
      {
        avatarKey: "redacteur",
        name: "Rédacteur",
        role: "Premier contact",
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
        avatarKey: "dispatcher",
        name: "Dispatcher",
        role: "Envoi et relances",
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
        avatarKey: "veilleur",
        name: "Veilleur",
        role: "Réponses et signaux",
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
    ],
  },
  workflow: {
    badge: "Comment ça marche",
    title: "Du premier contact au contrat signé.",
    proofPoints: [
      "Vous validez chaque mail avant envoi",
      "Coordonnées jamais exposées",
      "Envoi depuis votre propre boîte mail",
      "Chaque deal garde son origine",
    ],
    steps: [
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
    ],
    timeline: {
      eyebrow: "Aperçu · Suivi d'une opportunité",
      heading: "Une opportunité, tout son historique",
      badge: "Origine conservée",
      stages: [
        "Match",
        "Décideur",
        "Contact",
        "Réponse",
        "Rendez-vous",
        "Proposition",
        "Signature",
        "Apprentissage",
      ],
      note: "À chaque étape, Vectis garde ce qui a été décidé : sportif, marque, interlocuteur, score, message envoyé et résultat.",
      cards: [
        {
          title: "Rendez-vous hors plateforme",
          text: "Notez le résultat en un clic, le suivi continue.",
        },
        {
          title: "Contrat envoyé par la marque",
          text: "Ajoutez le document, le deal reste dans le pipeline.",
        },
        {
          title: "Origine conservée",
          text: "On sait toujours quelle recherche a mené à quelle signature.",
        },
      ],
    },
  },
  final: {
    badge: "Bêta privée · Sur invitation",
    title: "Vos sportifs méritent mieux que des mails sans réponse.",
    text: "Réservez une démo : on vous montre la plateforme sur le profil d'un de vos sportifs, de la shortlist de marques au premier mail.",
    demoCta: "Réserver une démo",
    login: "Connexion",
  },
  footer: {
    tagline:
      "Prospection sponsoring pour les représentants de sportifs. Six agents IA trouvent les marques, identifient le décideur et suivent chaque opportunité jusqu'au contrat. Vous validez chaque envoi.",
    columns: [
      {
        title: "Plateforme",
        links: [
          { label: "Présentation", href: "/#overview" },
          { label: "Méthode", href: "/#technology" },
          { label: "Agents", href: "/#agents" },
          { label: "Comment ça marche", href: "/#resources" },
          { label: "Connexion", href: "/login" },
        ],
      },
      {
        title: "Contact",
        links: [
          {
            label: "contact@vectis.agency",
            href: "mailto:contact@vectis.agency",
          },
          {
            label: "Réserver une démo",
            href: "mailto:contact@vectis.agency?subject=Démo%20Vectis%20Agency",
          },
        ],
      },
      {
        title: "Légal",
        links: [
          { label: "Mentions légales", href: "/legal/mentions-legales" },
          {
            label: "Politique de confidentialité",
            href: "/legal/confidentialite",
          },
          { label: "Conditions d'utilisation", href: "/legal/cgu" },
        ],
      },
    ],
    rights: "© {year} Vectis Agency. Tous droits réservés.",
    note: "Coordonnées des décideurs jamais exposées. Validation humaine avant chaque envoi.",
  },
};

const en: LandingContent = {
  meta: {
    title: "Vectis Agency — Find and sign sponsors for your athletes",
    description:
      "Vectis finds the brands that fit each athlete, identifies the decision-maker, drafts the first email and tracks every opportunity through to contract. Six AI agents, a human sign-off before every send.",
  },
  demoMailto: "mailto:contact@vectis.agency?subject=Vectis%20Agency%20demo",
  nav: {
    items: [
      { label: "Platform", href: "#overview" },
      { label: "Method", href: "#technology" },
      { label: "Agents", href: "#agents" },
      { label: "How it works", href: "#resources" },
    ],
    login: "Log in",
    demo: "Book a demo",
    openMenu: "Open menu",
    languageLabel: "Language",
  },
  hero: {
    badge: "Private beta · AI-assisted sponsorship prospecting",
    titleStart: "Sign more sponsors,",
    titleAccent: "without prospecting blind.",
    subtitle:
      "Vectis finds the brands that fit each athlete, identifies the decision-maker, drafts the first email and tracks the opportunity through to signature. You stay in control of every send.",
    command:
      "Find brands ready to sponsor a national-level swimmer, excluding the obvious names",
    chip: "Six AI agents · you approve every send",
    demoCta: "Book a demo",
    howCta: "How it works",
    checks: [
      "Beyond the obvious brands",
      "Verified decision-makers",
      "Tracked through to signature",
    ],
    cards: [
      { title: "Athlete profile", label: "Analyzed and enriched" },
      { title: "Scored brands", label: "Web search + AI" },
      { title: "Sent from your inbox", label: "Gmail, Outlook, SMTP" },
    ],
  },
  preview: {
    label: "Platform preview",
    badge: "Sample",
    sidebar: ["Overview", "Prospecting", "Pipeline", "Emails"],
    greeting: "Hi Camille,",
    heading: "Today's priorities",
    scanCta: "Run a scan",
    stats: [
      { value: "18", label: "Brands scored" },
      { value: "7", label: "Verified decision-makers" },
      { value: "4", label: "Follow-ups due" },
    ],
    listTitle: "Recommended opportunities",
    updated: "Just now",
    opportunities: [
      {
        brand: "Maison M",
        profile: "Striker · Ligue 2",
        score: 94,
        state: "Decision-maker verified",
      },
      {
        brand: "Atlas Mobility",
        profile: "Judoka · National team",
        score: 88,
        state: "Email awaiting approval",
      },
      {
        brand: "North Studio",
        profile: "Handball club · 3rd division",
        score: 82,
        state: "To qualify",
      },
    ],
    priority: "Priority",
    followups: "3 follow-ups to send today",
  },
  problem: {
    badge: "The problem",
    titleStart: "Sponsorship prospecting is still done",
    titleAccent: "by hand.",
    text: "Googling brands, random LinkedIn requests, emails that go unanswered, a spreadsheet nobody updates. Weeks of work for a handful of contracts.",
    eyebrow: "What it costs you",
    heading: "Every campaign starts from zero.",
    items: [
      "The obvious sponsors are saturated, the others are impossible to find",
      "The right contact changed jobs and nobody told you",
      "Generic emails go unanswered",
      "Follow-ups depend on your memory",
      "Replies, meetings and contracts are scattered across email, LinkedIn and spreadsheets",
      "What worked last time isn't written down anywhere",
    ],
    cta: "See how Vectis does it",
  },
  contactPreview: {
    eyebrow: "Preview · Decision-maker identified",
    heading: "Recommended contact",
    badge: "Approve before sending",
    role: "Head of Sports Partnerships",
    roleSub: "Partnerships lead · target brand",
    metrics: [
      ["In role", "Verified"],
      ["Email", "Verified"],
      ["Fit", "Very strong"],
    ],
    notice:
      "Email and phone stay private on our servers. The email goes out from your own inbox, after your approval.",
    feedback: ["Good contact", "Average", "Off target"],
    note: "Your feedback on each contact sharpens the next recommendations.",
  },
  solution: {
    badge: "The Vectis method",
    titleStart: "A CRM records.",
    titleAccent: "Vectis learns.",
    text: "Every brand contacted, every reply, every meeting and every signed contract improves the next recommendations. The more you use it, the sharper the shortlists.",
    eyebrow: "What sets us apart",
    heading: "Your campaigns become your edge.",
    pillars: [
      {
        title: "One base that connects everything",
        text: "Athletes, brands, decision-makers, conversations and contracts live in a single base, not three tools.",
      },
      {
        title: "Scores that improve",
        text: "A positive reply, a meeting or a signature strengthens the score of similar brands, roles and messages.",
        featured: true,
      },
      {
        title: "Nothing slips off the radar",
        text: "An opportunity stays tracked from first contact to signed or lost contract, even when the meeting happens outside the platform.",
      },
    ],
  },
  learning: {
    eyebrow: "Preview · What the platform learns",
    heading: "Which contacts reply, by sector",
    badge: "Updated with every campaign",
    filters: [
      "Sports partnerships",
      "Sportswear",
      "5,000+ employees",
      "All sports",
    ],
    events: [
      ["Emails sent", "184", "With their context"],
      ["Positive replies", "31", "Classified on read"],
      ["Meetings booked", "14", "Logged on the record"],
      ["Contracts signed", "5", "Linked to their origin"],
    ],
    trendLabel: "Reply rate by role",
    trendTitle: "The right contacts stand out with volume",
    footnote: "Weighted by history · no black box",
    disclaimer: "Sample figures.",
  },
  agents: {
    badge: "Six AI agents · you stay in control",
    title: "Six agents. One goal: sign.",
    text: "Each agent has one precise job. Together they cover the whole chain, from brand research to reply tracking.",
    demoCta: "Book a demo",
    journeyCta: "See the full journey",
    mission: "Mission",
    done: "{name} completed the mission",
    saved: "Result saved to the record",
    active: "Active",
    nameFormat: "{name} agent",
    portraitAlt: "3D portrait of the {name} agent",
    scrollHint: "Scroll to discover each agent",
    regionLabel: "Vectis agents showcase",
    list: [
      {
        avatarKey: "scout",
        name: "Scout",
        role: "Brand discovery",
        text: "Searches the web for brands that fit the athlete's profile, setting aside the obvious sponsors everyone already pitches.",
        command:
          "Find 25 brands that fit this profile, excluding the obvious sponsors.",
        result: "25 brands found, 18 new leads ready to be scored.",
        capabilities: [
          "Targeted web search",
          "No duplicates per athlete",
          "Sources kept",
        ],
      },
      {
        avatarKey: "matchmaker",
        name: "Matchmaker",
        role: "Brand scoring",
        text: "Rates each brand on image fit, audience, sponsorship history and timing, then ranks them A, B and C.",
        command: "Rank these brands by their real likelihood of replying.",
        result: "7 priority-A opportunities, each with its pitch rationale.",
        capabilities: [
          "Scored on 6 criteria",
          "Rationale per brand",
          "A, B and C priorities",
        ],
      },
      {
        avatarKey: "enrichisseur",
        name: "Enricher",
        role: "Decision-maker identification",
        text: "Finds the person in charge of partnerships, checks they're still in the role and that their email is valid, without ever exposing their details.",
        command:
          "Identify the current sponsorship lead at each priority brand.",
        result: "5 decision-makers in role identified, 3 ready to contact.",
        capabilities: [
          "Role verified",
          "Email verified before sending",
          "Contact details protected",
        ],
      },
      {
        avatarKey: "redacteur",
        name: "Writer",
        role: "First contact",
        text: "Drafts a first email in your name, grounded in verifiable facts, that opens the conversation without selling a package.",
        command:
          "Draft a credible first email from the profile and the match.",
        result: "One personalized email, ready to review and send.",
        capabilities: [
          "Your tone, your signature",
          "Day 4 and day 10 follow-ups",
          "Review before sending",
        ],
      },
      {
        avatarKey: "dispatcher",
        name: "Dispatcher",
        role: "Sending and follow-ups",
        text: "Sends from your Gmail, Outlook or SMTP, schedules follow-ups and keeps the whole thread on the opportunity record.",
        command:
          "Send the approved emails and follow up with those who haven't replied.",
        result: "Sequence scheduled, conversation thread preserved.",
        capabilities: [
          "Your inbox, your name",
          "Follow-up only without a reply",
          "Full history",
        ],
      },
      {
        avatarKey: "veilleur",
        name: "Watcher",
        role: "Replies and signals",
        text: "Reads replies, classifies them, updates the pipeline and spots new signals, such as a brand changing sponsor.",
        command: "Monitor replies and turn every signal into an action.",
        result: "Positive reply detected, meeting proposed, pipeline updated.",
        capabilities: [
          "Replies classified automatically",
          "Market alerts",
          "Next action suggested",
        ],
      },
    ],
  },
  workflow: {
    badge: "How it works",
    title: "From first contact to signed contract.",
    proofPoints: [
      "You approve every email before it's sent",
      "Contact details never exposed",
      "Sent from your own inbox",
      "Every deal keeps its origin",
    ],
    steps: [
      {
        number: "01",
        title: "Find and score",
        text: "The athlete's profile and brand news produce a short, scored and argued shortlist.",
      },
      {
        number: "02",
        title: "Identify the decision-maker",
        text: "The right contact is found, verified in role and reachable. You approve before anything is sent.",
      },
      {
        number: "03",
        title: "Contact and follow up",
        text: "Email, follow-ups, replies, meetings and contract stay on the opportunity record.",
      },
      {
        number: "04",
        title: "Learn",
        text: "Every outcome sharpens the next shortlists, the roles to target and the messages that get replies.",
      },
    ],
    timeline: {
      eyebrow: "Preview · Opportunity tracking",
      heading: "One opportunity, its whole history",
      badge: "Origin preserved",
      stages: [
        "Match",
        "Decision-maker",
        "Contact",
        "Reply",
        "Meeting",
        "Proposal",
        "Signature",
        "Learning",
      ],
      note: "At every step, Vectis keeps what was decided: athlete, brand, contact, score, message sent and outcome.",
      cards: [
        {
          title: "Meeting outside the platform",
          text: "Log the outcome in one click, tracking continues.",
        },
        {
          title: "Contract sent by the brand",
          text: "Add the document, the deal stays in the pipeline.",
        },
        {
          title: "Origin preserved",
          text: "We always know which search led to which signature.",
        },
      ],
    },
  },
  final: {
    badge: "Private beta · By invitation",
    title: "Your athletes deserve better than unanswered emails.",
    text: "Book a demo: we'll walk you through the platform on one of your athletes' profiles, from the brand shortlist to the first email.",
    demoCta: "Book a demo",
    login: "Log in",
  },
  footer: {
    tagline:
      "Sponsorship prospecting for athlete representatives. Six AI agents find the brands, identify the decision-maker and track every opportunity through to contract. You approve every send.",
    columns: [
      {
        title: "Platform",
        links: [
          { label: "Overview", href: "/en#overview" },
          { label: "Method", href: "/en#technology" },
          { label: "Agents", href: "/en#agents" },
          { label: "How it works", href: "/en#resources" },
          { label: "Log in", href: "/login" },
        ],
      },
      {
        title: "Contact",
        links: [
          {
            label: "contact@vectis.agency",
            href: "mailto:contact@vectis.agency",
          },
          {
            label: "Book a demo",
            href: "mailto:contact@vectis.agency?subject=Vectis%20Agency%20demo",
          },
        ],
      },
      {
        title: "Legal (French)",
        links: [
          { label: "Legal notice", href: "/legal/mentions-legales" },
          { label: "Privacy policy", href: "/legal/confidentialite" },
          { label: "Terms of use", href: "/legal/cgu" },
        ],
      },
    ],
    rights: "© {year} Vectis Agency. All rights reserved.",
    note: "Decision-maker details never exposed. A human approves every send.",
  },
};

export const landingContent: Record<Locale, LandingContent> = { fr, en };

export function getLandingContent(locale: Locale): LandingContent {
  return landingContent[locale];
}
