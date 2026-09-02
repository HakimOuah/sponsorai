# Navigation de la webapp

## Objectif

Répondre immédiatement à une navigation et réduire les lectures serveur inutiles, sans modifier les envois, les agents, les droits ou les données métier.

## Changements

- `NavigationProvider` maintient une transition React dans le layout persistant. Une barre indéterminée et un statut accessible indiquent une navigation réellement en cours, y compris pour les filtres et l'historique navigateur. Aucun pourcentage fictif ni délai d'animation n'est ajouté à une requête.
- `NavigationLink` conserve les vrais liens Next.js et leurs comportements natifs : ouvrir dans un nouvel onglet, clic modifié, téléchargement, lien externe, ancre et remplacement de l'historique. Le préchargement complet est déclenché sur une intention de survol, focus ou toucher ; il est dédupliqué et limité, et désactivé pour les connexions économes/lentes signalées par le navigateur.
- Les fichiers `loading.tsx` des listes et fiches affichent des squelettes adaptés à la page. Le menu reste utilisable pendant le chargement. La frontière d'erreur permet de réessayer ou de poursuivre la navigation.
- Le template anime seulement le nouveau contenu pendant 180 ms. Le layout, la session d'agent et son dock restent montés. Les animations de navigation et de chargement respectent `prefers-reduced-motion`.
- Les appels identiques à `getCurrentUserAccess` sont dédupliqués par `React.cache` pour un seul rendu serveur. Aucun rôle ni résultat d'autorisation n'est mis en cache entre utilisateurs ou requêtes.
- La page Emails calcule les compteurs par agrégation SQL, au lieu de charger une seconde fois la liste et ses relations.
- Les lectures indépendantes de Prospection sont parallèles. Les historiques de scans d'Agents et de Prospection sélectionnent uniquement leurs champs d'affichage ; les données nécessaires à la reprise des scans restent inchangées.

## Vérification

- `npm test` : 139 tests réussis, dont huit tests de navigation (liens natifs, destinations autorisées, présentation sans identité, limites du préchargement).
- `npx tsc --noEmit`, `npm run lint`, `npm run build` et `git diff --check` : réussis.
- Test navigateur sur une app isolée utilisant les vrais composants, sans base de données ni fournisseur externe : chargement serveur artificiel de 1,2 seconde, navigation liste/fiche, précédent/suivant, filtre, interruption par une autre destination, erreur contrôlée, ancre, lien vers la page courante et nouvel onglet.
- Dans cet essai local, le DOM de la barre apparaît 5 à 12 ms après le clic et celui du squelette 42 à 72 ms après le clic. Il s'agit de mesures instrumentées de retour visuel sur la fixture, pas d'un benchmark réseau de production.
- Vérification responsive à 390 × 844 : ouverture du menu, navigation, fermeture du menu, indicateur et contenu en une colonne. La préférence de mouvement réduit est couverte par la revue CSS, sans test sur un appareil iOS physique.

## Limites et maintenance

Ces changements ne rendent pas toutes les requêtes serveur instantanées. Les volumes, la latence de la base, un démarrage à froid ou une API externe peuvent encore rallonger une page. Le retour visuel ne doit jamais être présenté comme une fin de chargement.

Pour ajouter une destination, réutiliser `NavigationLink`, ou `useNavigationRouter` pour une navigation impérative. Un simple `router.refresh()` de fond ne doit pas ouvrir l'indicateur global. Garder les contrôles d'autorisation et la redaction des contacts côté serveur ; ne pas ajouter de cache partagé des permissions pour gagner du temps.

Références Next.js 14 : [navigation et préchargement](https://nextjs.org/docs/14/app/building-your-application/routing/linking-and-navigating), [chargement et streaming](https://nextjs.org/docs/14/app/building-your-application/routing/loading-ui-and-streaming), [cache par requête](https://nextjs.org/docs/14/app/building-your-application/caching).
