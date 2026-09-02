# Scoring Claude et reprise de scan

Le scoring utilise désormais le même modèle Claude configuré que Scout
(`CLAUDE_SCOUT_MODEL`, valeur par défaut déjà utilisée par l'application).
Il nécessite la clé serveur `ANTHROPIC_API_KEY` existante. Aucune nouvelle
variable, migration ou activation Gmail/Outlook n'est nécessaire.

## Traitement borné

- Lots de 5 marques, au maximum 3 appels Claude simultanés.
- Délai commun de 65 secondes pour l'ensemble du scoring, pas 65 secondes
  supplémentaires par lot. Les scans habituels contiennent au plus 15 marques.
- Aucune recherche web au scoring, réflexion adaptative désactivée.
- Sortie JSON structurée : index de marque, huit notes, justification et approche.
  L'application conserve les faits de Scout, calcule la moyenne et vérifie que
  chaque marque est présente exactement une fois. Les sorties tronquées ou
  invalides ne sont pas enregistrées comme un succès.
- Aucun retry automatique payant. Une erreur annule les appels frères.

## Reprise

`POST /api/agents/scan` accepte un `resumeScanId` avec le `playerId` habituel.
Seul un scan échoué du même talent, créé depuis moins de 24 heures et contenant
des marques valides, est reprenable. La prise en charge est atomique : deux
demandes de reprise ne peuvent pas lancer deux traitements du même scan.

Le bouton de la fiche du talent devient « Reprendre le scan » lorsque le dernier
scan est reprenable. Le bouton de retry réutilise aussi les marques sauvegardées.
La reprise conserve le même scan et n'appelle ni la recherche du profil ni Scout.
Si le scoring complet avait déjà été enregistré avant un incident de sauvegarde,
ses résultats sont également réutilisés sans nouvel appel IA.

Un scan ne devient `completed` qu'après l'enregistrement de toutes ses opportunités.
La reprise utilise les upserts existants et les événements d'apprentissage
idempotents ; elle ne crée pas de nouveaux emails et n'envoie rien.

## Vérification

`npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.
Tests ciblés : `tests/matchmaker.test.ts` et `tests/scan-recovery.test.ts`.
En production, corréler `[scan] started` (`resumed: true`) et les durées d'étapes
avec le résultat de la modale et les opportunités visibles après rechargement.
