# Synchronisation des envois et du pipeline

## Règles

- Un brouillon ou une approbation ne constitue pas un envoi.
- Après acceptation du message par le fournisseur, l'application enregistre le reçu d'envoi, puis synchronise le prospect et son deal.
- Sans deal, une fiche est créée au stade **Contacté**, pour le même athlète et la même entreprise. Un deal **Lead** passe à **Contacté**.
- Les statuts déjà avancés du prospect et les deals **Meeting**, **Négo**, **Offre**, **Signé** ou **Perdu** sont conservés. Un rattrapage respecte aussi un prospect déjà avancé dont le deal manque.
- Une relance n'ajoute pas de deuxième fiche : `Deal.prospectId` reste unique.
- Un email sans prospect n'invente pas de rattachement à un athlète.
- Envoi individuel et Dispatcher utilisent la même action `sendEmail` et le même service.
- Les vues emails, prospection, pipeline, dashboard, analytics et fiches concernées sont invalidées après l'envoi. Le Kanban accepte les données actualisées du serveur.

## Fiabilité

La synchronisation de la base est transactionnelle et rejouable. Les conflits de concurrence sont retentés au maximum trois fois, sans rappeler le fournisseur d'envoi. L'attribution et la trace de création/changement de stade sont conservées.

Un verrou conditionnel `draft → sending` protège contre deux clics simultanés. Un fournisseur qui refuse le message ne peut pas marquer l'email comme envoyé. Le reçu SMTP est conservé avant les opérations secondaires : si la synchronisation échoue, un nouvel appel sur l'email déjà envoyé ne le renvoie pas.

SMTP et PostgreSQL ne forment pas une transaction distribuée. Une interruption après acceptation SMTP mais avant enregistrement du reçu peut laisser `sending` sans confirmation. Dans ce cas, vérifier l'envoi côté fournisseur avant toute remise en brouillon ; ne jamais réinitialiser automatiquement ce statut.

## Rattrapage ciblé, sans renvoi

Le script n'importe aucun fournisseur mail et ne peut pas envoyer d'email. Il exige des identifiants explicites ; sans `--apply`, il est en lecture seule. Utiliser un environnement avec `DATABASE_URL` défini, après vérification du projet et de la base ciblés.

```bash
npx tsx scripts/reconcile-email-pipeline.ts --email-id IDENTIFIANT_EMAIL
npx tsx scripts/reconcile-email-pipeline.ts --email-id IDENTIFIANT_EMAIL --apply
```

Plusieurs `--email-id` sont acceptés. Les sorties excluent destinataires, corps des messages et secrets. Le script vérifie que le contenu, le statut, la date d'envoi, le message ID et le nombre d'événements d'envoi n'ont pas changé. Les brouillons et messages entrants sont ignorés, même avec `--apply`.

## Vérification

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Les tests dédiés couvrent l'envoi accepté/refusé, l'approbation, les doublons, les relances, les anciens envois, les statuts avancés et les conflits de transaction, avec fournisseur et base simulés. Aucun email réel n'est nécessaire pour ces tests.
