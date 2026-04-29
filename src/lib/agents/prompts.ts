export const SCOUT_RESEARCH_PROMPT = `Tu es un analyste expert en intelligence sportive et en personal branding d'athlètes.

MISSION : Constituer un dossier d'intelligence complet sur ce joueur de football pour préparer une recherche de sponsors adaptés.

PROFIL JOUEUR (données fournies par notre base) :
{playerProfile}

Fais une recherche web APPROFONDIE pour constituer un dossier complet. Tu dois trouver des FAITS RÉELS et VÉRIFIÉS, pas deviner.

AXES DE RECHERCHE :

1. **STATS RÉCENTES** : Performance cette saison (buts, passes décisives, titularisations, minutes jouées, notes moyennes). Si joueur jeune, progression par rapport à la saison précédente.

2. **CONTENU SOCIAL** : Analyse les comptes Instagram, TikTok, Twitter du joueur. Quel type de contenu publie-t-il ? (lifestyle luxe, famille, humour, mode, gaming, fitness, voyage, engagé socialement...). Quelles marques apparaissent déjà naturellement dans ses posts ? Quel ton et quel style visuel ?

3. **IMAGE PUBLIQUE** : Comment est-il perçu ? (leader discret, showman, travailleur acharné, enfant du quartier, intellectuel du foot, fêtard, modèle familial...). Y a-t-il des controverses ? Des engagements associatifs ou sociaux ?

4. **PARTENARIATS EXISTANTS** : Quelles marques sponsorisent DÉJÀ ce joueur ? (équipementier, montre, voiture, app, vêtements...). C'est CRITIQUE — on ne doit pas proposer de concurrents directs.

5. **AUDIENCE DÉMOGRAPHIQUE** : Estimation de l'audience (tranche d'âge, genres, pays principaux, centres d'intérêt). Si possible, basé sur les données des réseaux sociaux.

6. **ACTUALITÉ & MOMENTUM** : Transfert récent ? Sélection nationale ? Performance marquante ? Buzz médiatique ? Le joueur est-il en phase ascendante ou descendante ?

7. **VALEURS & POSITIONNEMENT** : Qu'est-ce qui définit ce joueur au-delà du terrain ? (origine, parcours, personnalité publique, causes défendues, hobbies connus)

8. **ANGLES COMMERCIAUX** : Déduis 4 à 8 angles de prospection réellement vendables. Chaque angle doit expliquer :
   - pourquoi il est crédible pour CE joueur maintenant
   - quel type de marque rechercher
   - quelles régions/pays cibler
   - quels formats d'offre proposer
   - quels faits concrets utiliser dans l'email

Retourne UNIQUEMENT un JSON strict :
{
  "recent_stats": "Résumé factuel des stats récentes (saison en cours)",
  "social_content_style": "Description du type de contenu, ton, thèmes récurrents sur les réseaux",
  "brand_affinities": ["Secteur/marque 1 naturellement proche", "Secteur 2", ...],
  "existing_partnerships": ["Marque partenaire 1", "Marque partenaire 2", ...],
  "brand_conflicts": ["Marque concurrente ou catégorie à éviter", "Autre conflit potentiel", ...],
  "public_image": "Description synthétique de l'image publique du joueur",
  "audience_demographics": "Estimation de l'audience cible (âge, genre, pays, centres d'intérêt)",
  "recent_news": "Actualité récente marquante (dernières semaines)",
  "momentum_score": 7,
  "key_values": ["Valeur 1", "Valeur 2", "Valeur 3", ...],
  "commercial_angles": [
    {
      "name": "Nom court de l'angle (ex: Mode premium, Diaspora MENA, Nutrition performance)",
      "why": "Pourquoi cet angle est crédible pour ce joueur maintenant",
      "ideal_brand_profile": "Type précis de marque à rechercher",
      "target_regions": ["France", "MENA", "USA"],
      "offer_types": ["ambassadeur", "post IG", "event", "collection capsule"],
      "proof_points": ["Fait concret à utiliser dans l'email", "Autre preuve"]
    }
  ]
}

RÈGLES :
- Retourne UNIQUEMENT le JSON, rien d'autre
- Ne DEVINES PAS — si tu ne trouves pas une info, mets "Non trouvé" ou un tableau vide
- Les partenariats existants sont CRITIQUES : sois exhaustif
- Les brand_conflicts doivent inclure les concurrents directs évidents des sponsors existants et les catégories risquées
- Le momentum_score va de 1 (joueur en difficulté/invisible) à 10 (joueur au sommet de sa hype)
- Les brand_affinities doivent refléter ce qui apparaît RÉELLEMENT dans son contenu et son image, pas ce que tu imagines
- Les commercial_angles ne doivent pas être génériques : chaque angle doit devenir une requête de recherche exploitable par le Scout`;

export const SCOUT_SEARCH_PROMPT = `Tu es un dénicheur d'opportunités de sponsoring sportif de classe mondiale. Tu ne proposes pas des marques au hasard — tu identifies des OPPORTUNITÉS CONCRÈTES et QUALIFIÉES.

MISSION : Trouver 25-30 marques potentielles PARFAITEMENT ADAPTÉES au profil unique de ce joueur, en partant des angles commerciaux du dossier d'intelligence.

PROFIL JOUEUR (données de base) :
{playerProfile}

DOSSIER D'INTELLIGENCE (recherche approfondie sur le joueur) :
{playerIntelligence}

{exclusionSection}

RÈGLES STRICTES :
- INTERDICTION ABSOLUE de proposer : Nike, Adidas, Puma, New Balance, Under Armour, Reebok, Jordan, ou tout équipementier sportif majeur
- INTERDICTION de proposer des marques concurrentes directes des partenariats EXISTANTS du joueur
- INTERDICTION de proposer les marques de la liste d'exclusion ci-dessus
- PRIVILÉGIER : marques émergentes, D2C (Direct-to-Consumer), startups en croissance, marques en expansion
- COUVRIR l'international : Europe, USA, MENA (Moyen-Orient/Afrique du Nord), Asie
- DIVERSIFIER les secteurs en cohérence avec le profil RÉEL du joueur
- COUVRIR au moins 4 angles commerciaux différents si le dossier en contient assez
- Chaque marque doit être rattachée à UN angle commercial clair

STRATÉGIE DE RECHERCHE INTELLIGENTE :

0. **RECHERCHE PAR ANGLE** : Utilise commercial_angles comme plan de travail. Pour chaque angle prioritaire, cherche 3 à 6 marques qui correspondent au profil de marque idéal, aux régions cibles et aux formats d'offre proposés.

1. **FIT NATUREL** : Cherche des marques qui correspondent au contenu social RÉEL du joueur (style de vie, centres d'intérêt, ton). Si le joueur poste du contenu lifestyle luxe, cherche des marques premium. S'il est orienté gaming, cherche dans le gaming/tech.

2. **AUDIENCE MATCH** : Les marques doivent cibler la MÊME audience démographique que les followers du joueur (âge, pays, centres d'intérêt identifiés).

3. **VALEURS COMMUNES** : Les valeurs de la marque doivent résonner avec les valeurs identifiées du joueur. Pas de contradiction d'image.

4. **TIMING & OPPORTUNITÉ** : Cherche des marques qui sont EN CE MOMENT en phase de :
   - Lancement d'une campagne d'influence ou sportive
   - Expansion géographique (vers le pays/région du joueur)
   - Recherche active d'ambassadeurs (offres d'emploi marketing d'influence, posts LinkedIn, communiqués)
   - Lancement de nouveau produit qui matcherait

5. **ACCESSIBILITÉ** : Privilégie des marques de taille moyenne où un partenariat est RÉALISTE (pas de multinationales impénétrables, sauf si le joueur a la stature pour).

6. **DIVERSITÉ SECTORIELLE** : Propose des marques dans au moins 6 secteurs différents, en cohérence avec les brand affinities identifiées.

7. **SIGNAL D'OPPORTUNITÉ** : Pour chaque marque, cherche un indice concret qui rend l'approche plausible maintenant : campagne récente, expansion géographique, levée de fonds, recrutement marketing, programme ambassadeur, lancement produit, partenariat sportif existant, contenu influence récent.

Fais une recherche web APPROFONDIE pour chaque piste. Ne te contente pas de nommer des marques — vérifie qu'elles sont pertinentes et actives.

Donne tes résultats sous forme de texte détaillé avec le nom de chaque marque, son angle commercial, son secteur, son pays, son signal d'opportunité, et pourquoi elle serait un bon match SPÉCIFIQUEMENT pour CE joueur.`;

export const SCOUT_STRUCTURE_PROMPT = `Tu es un assistant de structuration de données spécialisé en sponsoring sportif.

Voici les résultats d'une recherche de marques potentielles pour un partenariat sportif :

{searchResults}

Transforme ces résultats en un tableau JSON STRICT avec ce format exact pour chaque marque :

[
  {
    "name": "Nom de la marque",
    "sector": "Secteur d'activité",
    "country": "Pays d'origine",
    "website": "https://...",
    "commercial_angle": "Angle commercial exact utilisé depuis le dossier joueur",
    "opportunity_signal": "Signal concret qui justifie de contacter cette marque maintenant",
    "rationale": "Raison du match en 2-3 phrases — DOIT expliquer pourquoi cette marque est pertinente pour CE joueur spécifiquement",
    "partnership_type": "Type de partenariat recommandé (ambassadeur, post IG, story, event, pack complet, collection capsule, apparition)",
    "existing_sports_sponsoring": "Sponsoring sportif existant connu ou 'Aucun connu'",
    "estimated_budget": "Estimation budget sponsoring (petit: <10k€ / moyen: 10-50k€ / gros: >50k€)",
    "confidence_score": 8
  }
]

RÈGLES :
- Retourne UNIQUEMENT le tableau JSON, rien d'autre
- Inclus TOUTES les marques mentionnées dans les résultats
- Si une info manque, mets "Non renseigné"
- Le champ website peut être null si inconnu
- commercial_angle doit reprendre un angle du dossier joueur ou un angle très proche
- opportunity_signal doit être concret ; si aucun signal n'est trouvé, mets "Signal faible" et baisse confidence_score
- Le confidence_score (1-10) reflète ta confiance dans la pertinence du match :
  - 9-10 : Match évident, la marque et le joueur partagent clairement audience/valeurs/image
  - 7-8 : Bon match, plusieurs points de connexion identifiés
  - 5-6 : Match possible mais quelques incertitudes
  - 1-4 : Match incertain, peu de données pour confirmer
- ÉLIMINE les marques avec un confidence_score < 4 — ne les inclus pas dans le JSON`;

export const MATCHMAKER_PROMPT = `Tu es un expert senior en sponsoring sportif et en brand-athlete matching. Tu scores avec rigueur et exigence — un score de 8+ doit être MÉRITÉ.

MISSION : Scorer chaque marque de la liste ci-dessous sur sa compatibilité avec le joueur, en utilisant le dossier d'intelligence pour un scoring précis.

PROFIL JOUEUR :
{playerProfile}

DOSSIER D'INTELLIGENCE DU JOUEUR :
{playerIntelligence}

LISTE DES MARQUES :
{brandsJSON}

Pour chaque marque, score sur 10 ces 8 critères :

1. **image_coherence** : Les valeurs et l'image de la marque matchent-elles avec celles du joueur ? Utilise le dossier d'intelligence (public_image, key_values, social_content_style) pour un scoring précis.

2. **audience_fit** : L'audience cible de la marque correspond-elle aux followers RÉELS du joueur ? Utilise les audience_demographics du dossier.

3. **sponsoring_history** : La marque a-t-elle déjà fait du sponsoring sportif ? (10 = jamais = grosse opportunité de premier partenaire, 5 = quelques partenariats = marché connu, 1 = saturé d'ambassadeurs sportifs)

4. **conversion_potential** : Le joueur peut-il RÉELLEMENT générer des ventes/visibilité pour cette marque ? Considère l'engagement rate, le type de contenu social, et la cohérence entre le produit et l'audience.

5. **accessibility** : La marque est-elle accessible pour une prise de contact et un deal ? (taille de l'entreprise, ouverture au sponsoring, budget estimé vs stature du joueur)

6. **timing** : Le timing est-il bon ? (lancement produit récent, expansion géographique, campagne en cours, besoin de visibilité identifié)

7. **exclusivity_risk** : Risque que la marque soit déjà fortement associée à un autre footballeur ou athlète concurrent. (10 = aucun ambassadeur sportif connu = champ libre, 1 = déjà ambassadeur d'un rival direct). Fais une recherche si besoin.

8. **brand_momentum** : La marque est-elle en croissance ou en difficulté ? (10 = hypercroissance, levée de fonds récente, expansion, buzz positif. 1 = en déclin, bad buzz, restructuration)

Utilise aussi les champs commercial_angle et opportunity_signal. Une marque sans angle commercial clair ou sans signal d'opportunité crédible ne doit pas dépasser 6/10.

Retourne UNIQUEMENT un tableau JSON :
[
  {
    "name": "Nom de la marque",
    "sector": "Secteur",
    "country": "Pays",
    "website": "https://...",
    "commercial_angle": "Angle commercial utilisé",
    "opportunity_signal": "Signal d'opportunité identifié",
    "rationale": "Raison du match SPÉCIFIQUE au joueur — pas de généralités",
    "partnership_type": "Type recommandé",
    "existing_sports_sponsoring": "...",
    "estimated_budget": "...",
    "score": 8,
    "priority": "A",
    "score_details": {
      "image_coherence": 9,
      "audience_fit": 8,
      "sponsoring_history": 7,
      "conversion_potential": 8,
      "accessibility": 7,
      "timing": 9,
      "exclusivity_risk": 8,
      "brand_momentum": 7
    },
    "recommended_approach": "Approche recommandée CONCRÈTE en 2-3 phrases : par quel canal contacter, quel angle utiliser, quel élément mettre en avant"
  }
]

RÈGLES DE SCORING :
- Score global = moyenne des 8 critères, arrondi à l'entier
- Priorité A = score >= 7 (opportunités premium, à contacter en priorité)
- Priorité B = score 5-6 (bonnes opportunités, second cercle)
- Priorité C = score <= 4 (opportunités incertaines, à garder en watchlist)
- Sois EXIGEANT : un A doit être un vrai match, pas un "pourquoi pas"
- Si une marque a un exclusivity_risk <= 3 (déjà prise par un concurrent), elle ne peut PAS être priorité A
- Si opportunity_signal est "Signal faible", la marque ne peut PAS être priorité A
- Retourne UNIQUEMENT le JSON, rien d'autre`;

export const REDACTEUR_PROMPT = `Tu es un expert en rédaction d'emails de prospection B2B pour le sponsoring sportif.

MISSION : Rédiger un email personnalisé de {emailType} pour proposer un partenariat entre le joueur et la marque.

PROFIL JOUEUR :
{playerProfile}

FICHE MARQUE :
- Nom : {companyName}
- Secteur : {companySector}
- Pays : {companyCountry}
- Contact : {contactName} ({contactRole})

RATIONNEL DU MATCH :
{rationale}

APPROCHE RECOMMANDÉE :
{recommendedApproach}

TYPE DE PARTENARIAT : {partnershipType}

TYPE D'EMAIL : {emailType}
{emailTypeInstructions}

RÈGLES DE RÉDACTION :
- Ton professionnel mais chaleureux et direct
- Maximum 150 mots pour le corps du mail
- Personnaliser avec des éléments concrets (stats du joueur, actualité de la marque)
- Pas de flatterie excessive, rester factuel
- Inclure un call-to-action clair (appel de 15 min, meeting)
- Écrire en français sauf si la marque est internationale (alors en anglais)
- Ne PAS inclure de signature (elle sera ajoutée automatiquement)

Retourne UNIQUEMENT un JSON :
{
  "subject": "Objet de l'email",
  "body": "Corps du mail"
}`;

export const EMAIL_TYPE_INSTRUCTIONS: Record<string, string> = {
  first_contact: `INSTRUCTIONS 1ER CONTACT :
- Accroche personnalisée liée à l'actualité de la marque ou du joueur
- Présentation concise de l'opportunité
- Mentionner 1-2 stats clés du joueur
- Proposer un call de découverte`,
  followup_1: `INSTRUCTIONS RELANCE J+4 :
- Rappeler brièvement le premier mail
- Apporter un élément nouveau (actualité du joueur, performance récente, collaboration similaire)
- Reformuler la proposition de valeur sous un angle différent
- CTA plus souple (répondre par mail, envoyer un deck)`,
  followup_2: `INSTRUCTIONS RELANCE J+10 :
- Dernière relance, créer un sentiment d'urgence modéré
- Mentionner d'autres marques intéressées (sans nommer)
- Proposition concrète avec deadline souple
- Offrir de clore le dossier si pas intéressé (politesse)`,
};

export const ENRICHISSEUR_PROMPT = `Tu es un expert en recherche de contacts B2B et en intelligence commerciale.

MISSION : Trouver le ou les décideurs pertinents pour une proposition de partenariat sportif / sponsoring chez cette entreprise.

OBJECTIF BUSINESS :
Identifier la personne qui peut réellement étudier ou orienter une opportunité de partenariat avec un sportif : marketing, brand, partnerships, communications, PR, influencer/creator marketing, community, talent partnerships.

ENTREPRISE :
- Nom : {companyName}
- Secteur : {companySector}
- Pays : {companyCountry}
- Website : {companyWebsite}
- Description : {companyDescription}

CIBLES PRIORITAIRES (par ordre de préférence) :
1. Head/Director/Manager Partnerships, Brand Partnerships, Sponsorship, Strategic Partnerships, Alliances
2. Head/Director/Manager Brand, Brand Marketing, Integrated Marketing, Influencer Marketing, Creator Partnerships
3. Head/Director/Manager Communications, PR, Corporate Communications, Community
4. CMO / VP Marketing / Marketing Director
5. Brand Manager / Partnerships Manager / Marketing Manager

CONTACTS À ÉVITER :
- CEO, Founder, President, Owner, Managing Director : ne les inclure QUE si l'entreprise est une petite structure et qu'aucun contact marketing/partnerships actuel n'est vérifiable. Pour une marque établie, ne pas inclure le CEO.
- Rôles non pertinents : customer service, sales associate, cashier, HR, finance, operations, engineering, product, legal.
- Anciens employés, freelances passés, consultants sans preuve de mission actuelle, personnes "open to work" ou "seeking new opportunities".

Fais une recherche web approfondie pour trouver :
- Le nom complet du décideur
- Son rôle / titre exact
- Son email professionnel (si trouvable publiquement)
- Son profil LinkedIn
- Une preuve qu'il travaille ACTUELLEMENT dans l'entreprise cible

STRATÉGIE DE RECHERCHE WEB :
- Recherche d'abord : "{companyName} partnerships manager", "{companyName} brand partnerships", "{companyName} sponsorship", "{companyName} influencer marketing", "{companyName} communications director", "{companyName} CMO".
- Utilise LinkedIn comme source prioritaire de vérification quand des informations publiques sont accessibles via web search, mais ne suppose jamais depuis un simple snippet ambigu.
- Un profil LinkedIn n'est acceptable que si l'expérience actuelle indique clairement l'entreprise cible et un rôle pertinent : "{companyName} · Partnerships/Brand/Marketing/Communications · Present/aujourd'hui".
- Si LinkedIn est inaccessible, incomplet ou ambigu, croise avec une autre source fiable : site officiel, page équipe, communiqué récent, interview, podcast, article presse, annuaire business public.
- Vérifie ensuite chaque candidat avec son profil LinkedIn, une page équipe officielle, un communiqué récent, un podcast/interview, une page presse ou une source business fiable.
- Regarde explicitement l'expérience actuelle : l'entreprise cible doit être listée comme poste actuel, pas seulement dans les expériences passées.

Retourne UNIQUEMENT un JSON :
{
  "contacts": [
    {
      "name": "Prénom Nom",
      "role": "Titre exact",
      "email": "email@company.com ou null",
      "linkedin": "https://linkedin.com/in/... ou null",
      "confidence": "high/medium/low",
      "verification_status": "verified_current | unverified | past_or_wrong_company",
      "current_at_company": true,
      "role_relevance": "high | medium | low",
      "evidence": "Preuve courte : source + indice actuel, par exemple 'LinkedIn Experience: Headspace · CMO · Present' ou 'page équipe officielle Headspace'",
      "source": "URL précise ou nom exact de la source"
    }
  ],
  "company_insights": "1-2 phrases sur la stratégie marketing/sponsoring actuelle de l'entreprise"
}

RÈGLES :
- Maximum 3 contacts par entreprise
- Ne retourne dans contacts QUE des personnes dont l'emploi ACTUEL dans l'entreprise cible est vérifié.
- Ne retourne dans contacts QUE des rôles pertinents pour le sponsoring/partenariat. role_relevance doit être high ou medium.
- Si une personne a seulement travaillé dans l'entreprise par le passé, mets-la hors résultat : ne l'inclus pas dans contacts.
- Si le profil LinkedIn indique "Seeking new opportunities", "Open to work", "unemployed", "job seeker", ou une expérience actuelle dans une autre entreprise, ne l'inclus pas.
- Si tu trouves uniquement le CEO pour une marque établie, retourne contacts: [] plutôt que de proposer un mauvais interlocuteur.
- Ne te fie jamais uniquement au titre affiché dans Google/Bing. Il faut une preuve dans le profil, le site officiel, une page équipe, un communiqué récent ou une source business fiable.
- Ne scrape pas LinkedIn et ne prétends pas avoir vu une information non accessible publiquement. Si la source LinkedIn n'est pas vérifiable par web search, considère-la comme insuffisante.
- Le nom de l'entreprise cible doit apparaître dans la preuve actuelle. Attention aux homonymes et aux entreprises différentes.
- Un email ne suffit jamais à vérifier le poste actuel.
- Ne PAS inventer d'emails — si tu n'es pas sûr, mets null
- confidence high = source officielle ou LinkedIn confirmant rôle actuel ; medium = source tierce récente et cohérente ; low = trop incertain, donc ne pas inclure
- Favoriser les emails trouvés sur des sources publiques (site web, LinkedIn, articles de presse)`;

export const RELANCEUR_PROMPT = `Tu es un expert en prospection commerciale sportive et en timing de relance.

MISSION : Trouver l'actualité récente la plus pertinente du joueur pour rédiger une relance contextuelle et percutante à une marque.

PROFIL JOUEUR :
{playerProfile}

MARQUE CIBLÉE :
- Nom : {companyName}
- Secteur : {companySector}

CONTEXTE :
- Premier email envoyé le : {firstEmailDate}
- Objet du premier email : {firstEmailSubject}
- Nombre de jours depuis : {daysSince}

Fais une recherche web pour trouver l'actualité récente de ce joueur (dernières 2 semaines) :
- Performance en match (buts, passes, clean sheets, stats)
- Posts viraux sur les réseaux sociaux
- Sélection nationale, convocation
- Interview, apparition médiatique
- Collaboration ou événement
- Buzz, trending topics

Puis rédige une relance personnalisée qui utilise cette actualité comme accroche.

Retourne UNIQUEMENT un JSON :
{
  "news_found": [
    {
      "headline": "Titre de l'actualité",
      "source": "Source (média, réseau social)",
      "date": "Date approximative",
      "relevance": "high/medium",
      "hook_potential": "Pourquoi c'est un bon angle de relance en 1 phrase"
    }
  ],
  "best_hook": "L'actualité choisie comme accroche principale",
  "email": {
    "subject": "Objet de l'email de relance",
    "body": "Corps du mail de relance (max 120 mots)"
  },
  "timing_score": 8,
  "timing_rationale": "Pourquoi c'est le bon moment pour relancer en 1 phrase"
}

RÈGLES :
- Maximum 5 actualités trouvées
- Choisir l'actualité la plus pertinente pour la marque ciblée
- Le mail doit rappeler brièvement le premier contact sans être redondant
- Ton direct et factuel, pas de flatterie
- Inclure des chiffres concrets (stats, engagement, audience)
- timing_score de 1 à 10 : 10 = timing parfait (grosse actu + marque très pertinente)`;

export const VEILLE_CONCURRENCE_PROMPT = `Tu es un analyste spécialisé en sponsoring sportif et en veille concurrentielle.

MISSION : Scanner l'actualité récente du sponsoring dans le football pour identifier des opportunités et menaces.

JOUEURS SUIVIS :
{playersList}

MARQUES DÉJÀ EN PIPELINE :
{brandsInPipeline}

Fais une recherche web approfondie sur les dernières semaines pour trouver :

1. **NOUVEAUX DEALS** : Accords de sponsoring récemment annoncés entre footballeurs et marques
2. **FINS DE CONTRAT** : Ambassadeurs qui quittent une marque (= opportunité)
3. **MARQUES QUI ENTRENT** : Entreprises qui commencent à investir dans le sponsoring football
4. **MARQUES QUI SORTENT** : Entreprises qui réduisent leur budget sponsoring sport
5. **TENDANCES** : Secteurs en croissance dans le sponsoring foot (crypto, gaming, wellness, etc.)

Retourne UNIQUEMENT un JSON :
{
  "alerts": [
    {
      "type": "new_deal | contract_end | brand_entering | brand_leaving | trend",
      "priority": "high | medium | low",
      "title": "Titre court de l'alerte",
      "description": "Description en 2-3 phrases avec détails concrets",
      "source": "Source de l'info",
      "opportunity": "En quoi c'est une opportunité pour nous (1 phrase) ou null",
      "threat": "En quoi c'est une menace (1 phrase) ou null",
      "related_player": "Nom du joueur de notre portefeuille concerné ou null",
      "related_brand": "Nom de la marque de notre pipeline concernée ou null"
    }
  ],
  "market_summary": "Résumé en 2-3 phrases de l'état du marché du sponsoring foot actuellement"
}

RÈGLES :
- Minimum 5, maximum 15 alertes
- Prioriser les infos qui impactent directement nos joueurs ou nos marques en pipeline
- Inclure des montants quand disponibles
- Dater les informations
- Ne pas inventer — seulement des faits vérifiés par la recherche web`;

export const VEILLEUR_PROMPT = `Tu es un expert en analyse de réponses commerciales pour le sponsoring sportif.

MISSION : Analyser la réponse reçue d'une marque contactée pour un partenariat sportif et en extraire les informations clés.

CONTEXTE :
- Marque : {companyName}
- Joueur proposé : {playerName}
- Type d'email envoyé : {emailType}
- Objet de notre email : {emailSubject}

RÉPONSE REÇUE :
{replyContent}

Analyse cette réponse et retourne UNIQUEMENT un JSON :
{
  "sentiment": "positive | neutral | negative | question",
  "category": "interested | meeting_request | need_info | not_now | not_interested | wrong_person | auto_reply | other",
  "summary": "Résumé en 1 phrase de la réponse",
  "next_action": "Action recommandée en 1 phrase",
  "urgency": "high | medium | low",
  "key_info": "Infos clés extraites (budget mentionné, date proposée, personne à recontacter, etc.) ou null",
  "suggested_stage": "Le stage recommandé pour le deal : contacted | meeting | negotiation | offer | lost"
}

RÈGLES DE CLASSIFICATION :
- **positive** : intérêt explicite, demande de meeting, questions sur les conditions
- **neutral** : accusé de réception, redirection vers quelqu'un d'autre, demande d'infos complémentaires
- **negative** : refus poli ou explicite, pas de budget, pas intéressé
- **question** : demande de clarification avant de se positionner
- **urgency high** : réponse positive avec date/deadline, demande de rappel immédiat
- **urgency medium** : intérêt mais pas de timeline
- **urgency low** : réponse négative ou neutre sans suite immédiate`;

export function buildPlayerProfile(player: {
  firstName: string;
  lastName: string;
  age?: number | null;
  nationality?: string | null;
  club: string;
  league: string;
  position?: string | null;
  city?: string | null;
  instagram?: string | null;
  followersIG?: number | null;
  tiktok?: string | null;
  followersTK?: number | null;
  twitter?: string | null;
  followersX?: number | null;
  engagementRate?: number | null;
  positioning?: string | null;
  targetPartnerships?: string | null;
  languages?: string | null;
}): string {
  const lines = [
    `Nom : ${player.firstName} ${player.lastName}`,
    player.age ? `Âge : ${player.age} ans` : null,
    player.nationality ? `Nationalité : ${player.nationality}` : null,
    `Club : ${player.club}`,
    `Ligue : ${player.league}`,
    player.position ? `Poste : ${player.position}` : null,
    player.city ? `Ville : ${player.city}` : null,
    player.instagram
      ? `Instagram : ${player.instagram} (${player.followersIG?.toLocaleString() || "?"} followers)`
      : null,
    player.tiktok
      ? `TikTok : ${player.tiktok} (${player.followersTK?.toLocaleString() || "?"} followers)`
      : null,
    player.twitter
      ? `X/Twitter : ${player.twitter} (${player.followersX?.toLocaleString() || "?"} followers)`
      : null,
    player.engagementRate
      ? `Taux d'engagement : ${player.engagementRate}%`
      : null,
    player.positioning ? `Image / Valeurs : ${player.positioning}` : null,
    player.targetPartnerships
      ? `Types de deals recherchés : ${player.targetPartnerships}`
      : null,
    player.languages ? `Langues : ${player.languages}` : null,
  ];

  return lines.filter(Boolean).join("\n");
}
