# Enrichisseur — intégration Monid

## Fonctionnement

Le bouton Enrichisseur et le relais vers Rédacteur restent les points d’entrée. Aucun email n’est envoyé par l’enrichissement.

1. Le site officiel sert à confirmer la page LinkedIn de l’entité exacte et les domaines email. La recherche web existante peut proposer des pages ou communiqués PDF ; leur contenu est ensuite réellement téléchargé et contrôlé.
2. Monid appelle le fournisseur de profils LinkedIn HarvestAPI pour un maximum de **5 profils**. Seuls les postes actuels dans l’entreprise exacte, avec une identité complète et un rôle pertinent, sont retenus. Priorité au sponsoring/partenariats, puis à la direction marque/communication.
3. Pour **3 interlocuteurs maximum**, Hunter via Monid recherche un email sur **2 domaines maximum**, puis effectue une vérification distincte. Les noms doivent correspondre ; les réponses invalides, incertaines et catch-all ne permettent pas l’envoi.
4. Sans email nominatif exploitable, une boîte sponsoring, partenariats, communication, presse ou contact réellement publiée sur le site officiel peut être vérifiée. Elle apparaît comme un **contact de service séparé**, jamais comme l’adresse personnelle d’un dirigeant. Les adresses SAV, support, recrutement et autres boîtes hors sujet sont exclues.
5. Apollo reste un secours lorsqu’il est configuré. La recherche publique existante reste disponible, mais ne peut pas requalifier une adresse rejetée par Monid. Aucun abonnement supplémentaire à FullEnrich n’est nécessaire pour ce chemin ; les appels fournisseurs sont facturés via Monid.

Si aucune source ne confirme un destinataire, l’outil l’indique et l’envoi reste bloqué. Une vérification technique n’établit pas à elle seule l’identité du titulaire et ne garantit pas la réception en boîte principale.

## Configuration serveur

```dotenv
MONID_API_KEY=<clé Monid>
MONID_ENRICHMENT_MAX_USD=0.50
```

- Définir ces variables dans l’environnement du serveur. En local, une clé stockée par le CLI Monid n’est **pas automatiquement** une variable du processus Next.js.
- Sur Vercel, ajouter la clé comme secret de l’environnement concerné, puis redéployer. Sur Docker, la passer via le mécanisme de secrets/env du déploiement et recréer le service applicatif.
- Ne pas employer de préfixe `NEXT_PUBLIC_`, ne pas copier la clé dans le navigateur ni la versionner. Le CLI Monid n’est pas nécessaire sur le serveur.
- Sans clé Monid, le circuit précédent reste disponible. Sans `GROK_API_KEY`/`XAI_API_KEY`, l’exploration des liens officiels fonctionne, mais la découverte assistée de pages et de domaines alternatifs n’est pas disponible. Aucun domaine de groupe n’est codé en dur.
- Aucun changement de schéma Prisma ni migration de données n’est requis.

## Coût et durée

Le client appelle gratuitement `/v1/inspect` avant chaque type d’opération. Il réserve le coût estimé pour tous les résultats possibles, y compris les frais fixes, avant d’émettre un appel payant. Les réservations des requêtes parallèles partagent un plafond de **0,50 USD par enrichissement** par défaut (configurable, maximum interne 2 USD). Un tarif inconnu ou non bornable est refusé. Ce plafond porte sur les appels Monid estimés, pas sur les appels IA existants ni sur un budget global multi-utilisateur.

Le coût réellement retourné par Monid est affiché à l’administrateur lorsqu’il est disponible ; en cas de réponse incertaine, il reste inconnu. Aucune requête payante n’est automatiquement répétée après une erreur ambiguë. Une demande explicite de relance est une nouvelle exécution et peut consommer de nouveaux crédits.

Monid dispose d’un délai de 150 secondes maximum dans un enrichissement global borné à 255 secondes ; la route Node a une durée maximale de 300 secondes. Le flux envoie des signaux de présence sans inventer de progression. Une déconnexion ou un dépassement de délai transmet une annulation et tente d’arrêter les runs Monid connus, sans garantie de remboursement d’un appel déjà exécuté.

## Coordonnées et enregistrement

- L’administrateur voit les noms, emails, justificatifs, liens professionnels et coûts Monid.
- Les clients reçoivent uniquement l’identifiant interne, le rôle, le statut de contactabilité et les scores ; les champs privés ne figurent pas dans le JSON/SSE. Les comptes `free_user` ne peuvent pas déclencher l’enrichissement.
- Les logs de progression et d’activité ne contiennent pas les corps de réponse bruts des fournisseurs. Les justificatifs privés restent dans les tables de contacts/preuves.
- Les contacts sont dédupliqués à l’intérieur de la même entreprise. Une recherche sans résultat ne remplace pas un email précédemment qualifié ; une vérification négative/inconclusive retire explicitement son caractère exploitable.
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

### Contrôles effectués le 2 septembre 2026

- 92 tests automatisés réussis ; TypeScript, ESLint et compilation de production réussis.
- Test réel isolé du nouveau parcours sur MAR by MARoco : boîte officielle retrouvée et vérifiée en 6,4 secondes, coût Monid retourné **0,01196 USD**, sous le plafond de test de 0,05 USD. Aucun envoi d’email, aucune écriture en base. Les coordonnées et la clé ne sont pas enregistrées dans ce document.
- Les scénarios de persistance et d’accès administrateur/client ont été exécutés avec une base et des sessions simulées. La recette navigateur avec une vraie session et une base configurée reste à effectuer avant activation.
- Cette modification n’a pas été déployée et ne configure pas les secrets du serveur de production.
- `npm audit` signale 21 vulnérabilités dans les dépendances déjà présentes (13 élevées, 4 modérées, 4 faibles). Les versions existantes n’ont pas été changées ; l’ajout `unpdf` n’apparaît pas dans ce relevé. Prévoir leur traitement dans un chantier de mise à jour distinct avant publication.

Sources techniques : [Monid Run API](https://docs.monid.ai/api/run.html), [suivi des runs](https://docs.monid.ai/api/runs.html), [inspection des endpoints](https://docs.monid.ai/api/inspect.html). Le payload natif utilise `input.body`, `input.queryParams` et `input.pathParams` selon l’opération. Le statut Monid `COMPLETED` est contrôlé séparément du statut HTTP du fournisseur.
