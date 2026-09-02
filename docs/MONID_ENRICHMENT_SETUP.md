# Enrichisseur — intégration Monid

## Fonctionnement

Le bouton Enrichisseur et le relais vers Rédacteur restent les points d’entrée. Aucun email n’est envoyé par l’enrichissement.

1. Le site officiel sert à confirmer la page LinkedIn de l’entité exacte et les domaines email. La recherche web existante peut proposer des pages ou communiqués PDF ; leur contenu est ensuite réellement téléchargé et contrôlé.
2. Monid appelle le fournisseur de profils LinkedIn HarvestAPI pour un maximum de **5 profils**. Seuls les postes actuels dans l’entreprise exacte, avec une identité complète et un rôle pertinent, sont retenus. Priorité au sponsoring/partenariats, puis à la direction marque/communication.
3. Pour **3 interlocuteurs maximum**, Hunter via Monid recherche un email sur **2 domaines maximum**, puis effectue une vérification distincte. Les noms doivent correspondre ; les réponses invalides, incertaines et catch-all ne permettent pas l’envoi.
4. Sans email nominatif exploitable, **Apollo est interrogé via Monid**, même si aucune page LinkedIn n’a été confirmée. Une recherche par domaine/rôle retourne au maximum 10 profils ; seuls **3 identifiants Apollo distincts** peuvent ensuite être enrichis individuellement. Le nom complet, l’entreprise actuelle et le rôle sont contrôlés ; un domaine alternatif doit être attesté par les sources officielles. Les emails professionnels passent aussi la vérification Hunter. Les options emails personnels et téléphones sont explicitement désactivées.
5. Sans email nominatif exploitable après Apollo, une boîte sponsoring, partenariats, communication, presse ou contact réellement publiée sur le site officiel peut être vérifiée. Elle apparaît comme un **contact de service séparé**, jamais comme l’adresse personnelle d’un dirigeant. Les adresses SAV, support, recrutement et autres boîtes hors sujet sont exclues.
6. La recherche publique existante reste disponible, mais ne peut pas requalifier une adresse rejetée. **Il n’y a plus d’appel direct à Apollo ni de dépendance à un abonnement Apollo séparé**. LinkedIn, Hunter et Apollo sont facturés par Monid avec une seule clé et un seul budget par enrichissement.

Si aucune source ne confirme un destinataire, l’outil l’indique et l’envoi reste bloqué. Une vérification technique n’établit pas à elle seule l’identité du titulaire et ne garantit pas la réception en boîte principale.

## Configuration serveur

```dotenv
MONID_API_KEY=<clé Monid>
MONID_ENRICHMENT_MAX_USD=0.50
```

- Définir ces variables dans l’environnement du serveur. En local, une clé stockée par le CLI Monid n’est **pas automatiquement** une variable du processus Next.js.
- Sur Vercel, ajouter la clé comme secret de l’environnement concerné, puis redéployer. Sur Docker, la passer via le mécanisme de secrets/env du déploiement et recréer le service applicatif.
- Ne pas employer de préfixe `NEXT_PUBLIC_`, ne pas copier la clé dans le navigateur ni la versionner. Le CLI Monid n’est pas nécessaire sur le serveur.
- `APOLLO_API_KEY` n’est plus lue par l’application. Une ancienne variable encore présente ne réactive jamais l’abonnement direct. Elle peut être retirée des environnements après validation de la bascule ; aucune clé Hunter séparée n’est nécessaire non plus.
- Sans clé Monid, les sources structurées sont indisponibles ; seule la recherche publique existante reste possible. Sans `GROK_API_KEY`/`XAI_API_KEY`, l’exploration des liens officiels fonctionne, mais la découverte assistée de pages et de domaines alternatifs n’est pas disponible. Aucun domaine de groupe n’est codé en dur.
- Aucun changement de schéma Prisma ni migration de données n’est requis.

## Coût et durée

Le client appelle gratuitement `/v1/inspect` avant chaque type d’opération. Il réserve le coût estimé pour tous les résultats possibles, y compris les frais fixes, avant d’émettre un appel payant. Les réservations des requêtes parallèles partagent un plafond de **0,50 USD par enrichissement** par défaut (configurable, maximum interne 2 USD). Un tarif inconnu ou non bornable est refusé. Ce plafond porte sur les appels Monid estimés, pas sur les appels IA existants ni sur un budget global multi-utilisateur.

La même instance du client couvre LinkedIn, Hunter **et Apollo** : le passage à Apollo ne remet ni le budget ni le délai à zéro. Le tarif Apollo par paliers n’est accepté que pour les suppléments connus explicitement désactivés (emails personnels/téléphones) ; toute nouvelle condition non interprétable bloque l’appel. Le catalogue inspecté le 2 septembre 2026 indique 0 USD pour `/mixed_people/api_search` et 0,05 USD pour `/people/match` standard ; la vérification Hunter est une opération supplémentaire. Ces prix sont réinspectés à l’exécution, pas codés en dur.

Un échec fournisseur terminal avec coût connu permet d’essayer une autre source ; une facturation inconnue ou une réponse réseau ambiguë bloque tous les nouveaux appels du client, Apollo compris. L’ancienne route `/api/integrations/apollo` reste compatible : elle contrôle uniquement le catalogue et l’accès Monid, sans appel payant et sans garantir un résultat d’enrichissement.

Le coût réellement retourné par Monid est affiché à l’administrateur lorsqu’il est disponible ; en cas de réponse incertaine, il reste inconnu. Aucune requête payante n’est automatiquement répétée après une erreur ambiguë. Une demande explicite de relance est une nouvelle exécution et peut consommer de nouveaux crédits.

Monid dispose d’un délai de 150 secondes maximum dans un enrichissement global borné à 255 secondes ; la route Node a une durée maximale de 300 secondes. Le flux envoie des signaux de présence sans inventer de progression. Une déconnexion ou un dépassement de délai transmet une annulation et tente d’arrêter les runs Monid connus, sans garantie de remboursement d’un appel déjà exécuté.

## Coordonnées et enregistrement

- L’administrateur voit les noms, emails, justificatifs, liens professionnels et coûts Monid.
- Les clients reçoivent uniquement l’identifiant interne, le rôle, le statut de contactabilité et les scores ; les champs privés ne figurent pas dans le JSON/SSE. Les comptes `free_user` ne peuvent pas déclencher l’enrichissement.
- Les logs de progression et d’activité ne contiennent pas les corps de réponse bruts des fournisseurs. Les justificatifs privés restent dans les tables de contacts/preuves.
- Les contacts sont dédupliqués à l’intérieur de la même entreprise. Une recherche sans résultat ne remplace pas un email précédemment qualifié ; une vérification négative/inconclusive retire explicitement son caractère exploitable.
- Les contacts Apollo gardent leur identifiant fournisseur historique ; leur source précise désormais « Apollo via Monid ». Aucune migration ni suppression de contacts, brouillons ou historiques n’est effectuée.
- La boîte principale d’une entreprise ne mélange pas le nom d’une nouvelle personne et l’adresse d’un ancien contact.
- Les brouillons, l’approbation humaine et l’envoi via la boîte connectée restent des étapes distinctes.

## Vérification et limites de validation

Les tests utilisent des données synthétiques et des fournisseurs/base isolés. Ils couvrent le transport Monid synchrone/asynchrone, le budget partagé, la sélection LinkedIn, les preuves officielles, les domaines email, les catch-all, les replis, la persistance, les rôles et le flux HTTP/SSE complet. Ils ne prouvent pas un envoi ni une livraison réelle, et ne remplacent pas une recette sur une base de test configurée.

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Les lectures de sources officielles sont limitées à HTTPS, au domaine de l’entreprise et à ses sous-domaines. Les IP privées et redirections externes sont refusées, le DNS est épinglé, les documents sont limités à 2 Mo et les PDF à 20 pages.

### Contrôles initiaux du 2 septembre 2026, avant activation

- 92 tests automatisés réussis ; TypeScript, ESLint et compilation de production réussis.
- Test réel isolé du nouveau parcours sur MAR by MARoco : boîte officielle retrouvée et vérifiée en 6,4 secondes, coût Monid retourné **0,01196 USD**, sous le plafond de test de 0,05 USD. Aucun envoi d’email, aucune écriture en base. Les coordonnées et la clé ne sont pas enregistrées dans ce document.
- À ce stade initial, les scénarios de persistance et d’accès administrateur/client avaient été exécutés avec une base et des sessions simulées ; la recette navigateur restait à effectuer.
- À ce stade initial, la modification n'était pas déployée. L'ajout de la clé de production et la recette réelle sont décrits ci-dessous.
- `npm audit` signale 21 vulnérabilités dans les dépendances déjà présentes (13 élevées, 4 modérées, 4 faibles). Les versions existantes n’ont pas été changées ; l’ajout `unpdf` n’apparaît pas dans ce relevé. Prévoir leur traitement dans un chantier de mise à jour distinct avant publication.

Sources techniques : [Monid Run API](https://docs.monid.ai/api/run.html), [suivi des runs](https://docs.monid.ai/api/runs.html), [inspection des endpoints](https://docs.monid.ai/api/inspect.html). Le payload natif utilise `input.body`, `input.queryParams` et `input.pathParams` selon l’opération. Le statut Monid `COMPLETED` est contrôlé séparément du statut HTTP du fournisseur.

### Activation et pilote de production du 2 septembre 2026

Ce premier pilote précède la bascule Apollo via Monid : les quatre emails Apollo ci-dessous utilisaient encore la clé directe. Ses coûts ne doivent pas être interprétés comme ceux du nouveau circuit.

- Intégration activée en production avec la clé serveur configurée, sans migration ni activation des changements Gmail/Outlook.
- Version testée : `ff08a92`, incluant le scoring Claude et la reprise décrits dans `SCAN_RECOVERY.md`. 101 tests, TypeScript et build de production réussis.
- Le scan interrompu a repris ses 13 marques sauvegardées : 13 prospects persistés en 30 secondes, dont 16,186 secondes de scoring. Aucun nouvel appel Scout ; compteur de scans inchangé après rechargement.
- Pilote autorisé sur **10 entreprises**, plafond **0,50 USD par enrichissement**, enveloppe **5 USD Monid**, sans rédaction ni envoi d'email.
- **10 traitements terminés**, **5 entreprises avec au moins un email exploitable**, **8 adresses nominatives et 1 boîte officielle**. Monid a apporté 4 adresses nominatives et 1 boîte officielle ; Apollo a fourni les 4 autres adresses nominatives. Les cinq entreprises sans email restent bloquées pour l'envoi.
- Relevé fournisseur final : **21 opérations terminées**, coût total **0,739 USD**, aucune facturation inconnue ni opération en cours. Les prix Claude/Grok et crédits Apollo ne sont pas inclus.
- Moyenne sur les 10 entreprises : **0,0739 USD**, incluant 6 cas sans appel Monid payant. Moyenne des 4 cas ayant utilisé Monid : **0,18475 USD** ; maximum observé **0,19372 USD**. Aucun plafond de coût atteint dans ce pilote.
- Contacts nominatifs et boîte officielle retrouvés après rechargement sur les cas contrôlés ; bouton Rédacteur disponible, aucun email créé. La séparation nominatif/boîte fonctionnelle est conservée.
- Limites observées : page LinkedIn non attestée depuis le site officiel sur 6 cas ; certains intitulés « partnerships » relèvent du business/innovation plutôt que du sponsoring. Le plafond de coût n'explique pas ces limites de couverture et de pertinence.
- Échantillon réduit et principalement fintech : cette moyenne ne constitue pas une garantie de prix ou de couverture future. Aucun test d'envoi ou de délivrabilité réelle réalisé. Les contrôles de rôles non-admin restent automatisés, pas testés avec un vrai compte client pendant ce pilote.

Les détails des entreprises, coordonnées, sessions et identifiants des opérations restent hors du dépôt.

### Bascule Apollo via Monid — contrôle du 2 septembre 2026

- 116 tests automatisés réussis, dont le transport exclusivement Monid, le budget partagé, les suppléments Apollo désactivés, les adresses rejetées non réutilisées et le parcours HTTP/SSE vers la persistance avec séparation admin/client.
- Test fournisseur réel isolé sur une entreprise du pilote, avec **`APOLLO_API_KEY` absente** et uniquement la clé Monid : une identité complète et un email professionnel confirmé par une vérification Hunter distincte.
- Coût retourné : **0,06196 USD** (recherche Apollo 0 ; révélation professionnelle Apollo 0,05 ; vérification Hunter 0,01196), sous le plafond de test de 0,20 USD. Aucune écriture en base, aucun brouillon ni email envoyé pendant ce contrôle isolé.
- Ce contrôle valide l’accès aux données Apollo via Monid sans abonnement Apollo direct. Un seul résultat ne constitue pas une moyenne représentative du coût des enrichissements complets ; LinkedIn, recherche d’email et appels IA peuvent s’y ajouter.
