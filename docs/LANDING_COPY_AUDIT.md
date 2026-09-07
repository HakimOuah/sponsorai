# Audit du copy de vectis.agency — septembre 2026

Périmètre : landing (`src/app/page.tsx`), page de connexion, métadonnées du layout racine. Le site live était identique au code de `origin/main` au moment de l'audit.

## Diagnostic

Le copy en ligne est un document d'architecture interne (`docs/SPONSORAI_V2_IMPLEMENTATION.md`) reformulé en sections marketing. Il parle du produit à des ingénieurs, pas à un agent sportif qui cherche des sponsors.

### 1. Le visiteur ne sait pas à qui le site s'adresse ni ce qu'il obtient

- Aucune phrase ne nomme la cible (agents, managers, représentants de sportifs, clubs).
- Le titre « Chaque campagne rend la suivante plus intelligente » vend le mécanisme d'apprentissage, pas le résultat attendu : des contrats de sponsoring signés.
- Le mot « sponsor » n'apparaît qu'une fois dans le hero, dans une barre de commande.

### 2. Deux noms pour un seul produit

Le logo dit Vectis Agency, le copy dit SponsorAI (« Un CRM enregistre. SponsorAI apprend. », « Contexte enregistré dans SponsorAI », « Aperçu SponsorAI V2 »). Un prospect ne peut pas savoir lequel est le produit. Le placeholder du login était `agent@sponsorai.com`.

### 3. « V2 » partout

Quinze occurrences : « La rupture V2 », « Data moat V2 », « Closed-loop V2 », « Recommandations V2 », « architecture cible V2 », « V2 progressive ». Personne à l'extérieur n'a vu de V1. Ce numéro de version n'apporte rien et signale un produit en chantier.

### 4. Franglais et jargon technique

« Sponsorship Graph », « Learning Engine », « Closed-loop », « Data moat », « outcomes », « WON ou LOST », « Bayesian smoothing », « Discovery », « Brand score », « Sending identity », « Signals & replies », « Discover & Match », « Close the loop », noms d'énumérations bruts (`EMAIL_SENT`, `POSITIVE_REPLY`). Les titres des quatre étapes étaient en anglais, les textes en français.

### 5. Les « problèmes » décrits sont ceux de l'ancienne version du logiciel, pas ceux du client

« Le contexte d'une marque disparaît après le scan », « Le taux de réponse masque les vrais outcomes business ». Un prospect ne fait pas de « scans ». Ses vrais problèmes : sponsors évidents saturés, bon interlocuteur introuvable, mails sans réponse, relances oubliées, suivi éparpillé.

### 6. Le site s'excuse trois fois d'être faux

« Aperçu illustratif », « Données illustratives — aucun résultat réel affiché », « Aperçu illustratif de l'architecture cible V2 », plus « via une future intégration calendrier ». Trois avertissements sur une page, dont un qui avoue que l'architecture n'est pas construite. La démo affichait aussi « Bonjour Hakim », le prénom du fondateur.

### 7. Boutons qui ne tiennent pas leur promesse

- « Démarrer » (nav) ouvrait un mailto.
- « Voir la plateforme » et « Accéder à la plateforme » envoyaient un prospect sur un mur de login.
- « Voir les agents en action » ouvrait un mailto.
- « Découvrir le moteur V2 » ne veut rien dire pour un visiteur.

### 8. Phrases défensives ou vides

« La mémoire est dans les données. Pas dans une vague mémoire LLM. » répond à une objection que personne n'a formulée. « Transformer les outcomes en avantage propriétaire » est une phrase de pitch deck investisseur.

### 9. Aucune preuve

Pas de client, pas de chiffre réel, pas de nom, pas de « qui sommes-nous ». C'est un manque de contenu, pas de rédaction : à combler quand il y aura des résultats à montrer.

## Ce qui a été réécrit

Principe : une seule marque (Vectis), une seule langue (français), une cible nommée (représentants de sportifs), une promesse (signer des sponsors sans prospecter à l'aveugle), un différenciateur (la plateforme apprend de chaque campagne), et zéro versioning interne.

| Élément | Avant | Après |
|---|---|---|
| Title / meta | « Sponsorship intelligence V2 » | « Trouvez et signez des sponsors pour vos sportifs » |
| Nav | Plateforme · Intelligence V2 · Agents · Boucle fermée | Plateforme · Méthode · Agents · Comment ça marche |
| Badge hero | SponsorAI V2 · Sponsorship intelligence | Bêta privée · Prospection sponsoring assistée par IA |
| H1 | Chaque campagne rend la suivante plus intelligente. | Signez plus de sponsors, sans prospecter à l'aveugle. |
| Sous-titre | donnée propriétaire réutilisable | trouve les marques, identifie le décideur, rédige le premier contact, suit jusqu'à la signature ; vous gardez la main |
| CTA secondaire | Voir la plateforme → /login | Comment ça marche → #resources |
| Section problème | La rupture V2 / angles morts | Le problème : la prospection se fait encore à la main + 6 douleurs côté client |
| Section méthode | Sponsorship intelligence / Data moat V2 / vague mémoire LLM | La méthode Vectis : « Un CRM enregistre. Vectis apprend. » |
| Piliers | Sponsorship Graph / Learning Engine / Closed-loop | Une base qui relie tout / Des scores qui s'améliorent / Rien ne sort du radar |
| Agents | rôles en anglais, descriptions d'implémentation | rôles en français, une phrase sur ce que l'agent fait pour vous |
| Étapes | Discover & Match / Decision maker / Close the loop / Learn & improve | Trouver et scorer / Identifier le décideur / Contacter et relancer / Apprendre |
| Timeline | Match · Contact · Outreach · Reply · Meeting · Proposal · Signed · Learn | Match · Décideur · Contact · Réponse · Rendez-vous · Proposition · Signature · Apprentissage |
| CTA final | Ne perdez plus ce que vos campagnes vous apprennent. | Vos sportifs méritent mieux que des mails sans réponse. |
| Disclaimers | 3 mentions « illustratif » + « architecture cible » | 1 mention « Chiffres d'exemple. » |
| Login | Plateforme IA de sponsoring sportif / agent@sponsorai.com | Prospection sponsoring pour représentants de sportifs / vous@votre-agence.fr |

## Alternatives de H1

- A (retenue) : « Signez plus de sponsors, sans prospecter à l'aveugle. » Résultat + douleur, cible implicite par « vos sportifs » dans le sous-titre.
- B : « Trouvez, contactez et signez des sponsors pour vos sportifs. » Plus littéral, décrit les trois étapes.
- C : « Les marques qui répondent. Les contrats qui se signent. » Plus court, plus affirmé, moins explicite sur ce que fait l'outil.

## Hors périmètre, à décider

1. **Nom du produit dans l'application** : la sidebar, les agents et les paramètres disent encore « SponsorAI » par endroits. Si la marque publique est Vectis, il faut trancher et aligner l'interface.
2. **Preuve sociale** : dès qu'un premier contrat est signé via la plateforme, ajouter une section avec un chiffre réel, un nom de sportif ou d'agence, ou une citation. C'est le plus gros levier de conversion restant.
3. **CTA « Réserver une démo »** : actuellement un mailto. Un lien Calendly ou équivalent convertirait mieux et éviterait de perdre les visiteurs sans client mail configuré.
4. **Cible** : le copy s'adresse aux représentants de sportifs. Si les clubs amateurs sont une cible à part entière, prévoir une variante ou une ligne dédiée.
5. **« Bêta privée »** : conservé du copy existant. À retirer dès l'ouverture commerciale.
