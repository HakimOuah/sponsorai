# LinkedIn direct en priorité

## Parcours

1. Résoudre la page LinkedIn depuis les sources officielles de l’entreprise.
2. Si le connecteur local est disponible, chercher au maximum trois profils et retenir au maximum deux personnes avec expérience actuelle dans l’entreprise exacte.
3. Si aucun profil ne passe les contrôles, utiliser LinkedIn via Monid.
4. Chercher et vérifier les emails via Hunter/Monid ; Apollo/Monid et boîte fonctionnelle officielle restent les solutions de repli existantes.
5. Conserver l’approbation humaine avant tout envoi. Une identité LinkedIn ne constitue pas une adresse email vérifiée.

Le connecteur utilise `stickerdaniel/linkedin-mcp-server` 4.23.3, révision `5448ab1fc2fcdf6e6e1bc1e4b166c81a5f5e7402`, sans installer les autres canaux d’Agent-Reach. Aucun message LinkedIn, invitation ou extraction automatique des cookies du navigateur personnel. Les refus explicites de sponsoring observés sont exclus de la recherche courante, y compris du repli Apollo lorsque son URL identifie la même personne.

## Hébergement VPS

Le worker peut fonctionner sans Mac dans le conteneur `vectis-linkedin-worker`, installé sous `/opt/vectis-linkedin`. Le fichier `scripts/linkedin-worker/compose.yaml` utilise l’image 4.23.3 épinglée par digest, un utilisateur non-root, aucun port publié, 2 Go de RAM au maximum, 1,5 CPU et des logs limités en taille. Les fichiers `auth/` et `state/` sont persistants, protégés et hors Git. `restart: unless-stopped` assure le redémarrage avec Docker après un redémarrage du VPS.

`deploy-vps.py` copie uniquement les scripts, la configuration et le profil **dédié** LinkedIn déjà créé, vers le VPS autorisé. Il refuse d’écraser la session d’un worker VPS actif. Arrêter d’abord le LaunchAgent du Mac pour éviter deux workers avec le même compte. L’image reconstruit le navigateur Linux depuis la session macOS ; la commande `--status` seule ne prouve pas la validité d’une session transférée : un appel LinkedIn réel est nécessaire.

Commandes sur le VPS : `cd /opt/vectis-linkedin && docker compose up -d`, `docker compose logs --tail 20`, `docker compose stop`. Pour une reconnexion, arrêter le worker et utiliser temporairement le login viewer officiel, lié **uniquement à 127.0.0.1**, accessible par tunnel SSH ; ne jamais exposer publiquement le navigateur ou le MCP. Le Mac n’est alors nécessaire que pour cette éventuelle reconnexion, pas pour les enrichissements courants depuis un téléphone.

L’ancien LaunchAgent local doit rester arrêté et désactivé après la bascule VPS. La perte de session LinkedIn ou l’indisponibilité du VPS conserve le repli Monid. Un échec du connecteur entraîne cinq minutes de retrait avant une nouvelle vérification.

Installation du 7 septembre 2026 : ressources VPS vérifiées (8 Go RAM, plus de 80 Go libres), fichiers copiés et image disponible. La session macOS transférée n’a pas passé le premier appel LinkedIn sur Linux. Un conteneur temporaire `vectis-linkedin-login` a été ouvert sur le loopback 6080, via tunnel SSH local 16080, pour une reconnexion humaine (expiration 30 minutes). **La bascule n’est pas encore validée** : après login réussi, démarrer le worker, effectuer le smoke test production et fermer le viewer/tunnel. Aucun autre service VPS n’a été modifié.

## Installation locale (alternative au VPS)

Après connexion manuelle dans le profil dédié du test :

```
python3 scripts/linkedin-worker/install.py /chemin/du/test
```

Ce script vérifie la révision du connecteur et copie le profil dédié vers `~/Library/Application Support/VectisLinkedIn`. Il installe les scripts et le LaunchAgent `agency.vectis.linkedin`. Il ne démarre pas le service. `uv` et `uvx` sont requis dans `~/.local/bin`.

Configurer **uniquement côté serveur** Vercel : `LINKEDIN_DIRECT_ENABLED=true` et `LINKEDIN_WORKER_TOKEN` avec le secret généré dans le fichier local `config.json` (permissions 600). Ne jamais publier ce fichier ou sa valeur. Redéployer, puis démarrer le LaunchAgent avec `launchctl bootstrap gui/<uid> ~/Library/LaunchAgents/agency.vectis.linkedin.plist`.

Le Mac doit être allumé et la session utilisateur ouverte. En veille, hors ligne, occupé ou déconnecté de LinkedIn, Monid reprend automatiquement. Il ne s’agit pas d’un navigateur hébergé dans Vercel. Pour reconnecter LinkedIn, arrêter le LaunchAgent et utiliser le CLI du connecteur avec le même `--user-data-dir`, `--no-auto-import` et `--login`, puis redémarrer le service. Ne jamais faire naviguer deux processus simultanément dans ce profil.

## Échange sécurisé et bornes

Le worker initie des requêtes HTTPS vers `/api/worker/linkedin` : aucun port local public. Authentification Bearer à secret partagé, aucune redirection autorisée. Les tâches sont réclamées par comparaison atomique et les résultats tardifs sont rejetés. Seuls entreprise LinkedIn, profils professionnels, expérience et exclusions sont échangés ; ni cookies ni clés Monid.

Les tâches brutes utilisent temporairement `ActivityLog` (types exclus du fil d’activité utilisateur), sont supprimées à la fin de la demande ou après dix minutes lors d’un prochain passage du worker. Les candidats validés suivent la persistance et les droits d’accès habituels. Le heartbeat ne contient aucune identité.

Le passage direct dure au plus 90 secondes et laisse au moins 65 secondes avant l’échéance de l’appelant pour les fournisseurs suivants. Les budgets Monid existants sont inchangés ; une recherche directe réussie évite l’appel payant LinkedIn, pas les appels Hunter/Apollo nécessaires aux emails. Aucun taux de réussite à 100 % n’est garanti. Ce mode reste séquentiel et à faible volume pour le compte connecté ; aucune tentative de contournement si LinkedIn refuse l’accès.

Retour arrière : `LINKEDIN_DIRECT_ENABLED=false` et redéploiement. Le parcours Monid reste fonctionnel sans worker. Les journaux locaux du worker ne contiennent que statut, nombre de profils et durée.

## Vérifications

```
python3 -m unittest discover -s scripts/linkedin-worker -p 'test_*.py'
npm test
npx tsc --noEmit
```

Validation du 7 septembre 2026 : 240 tests TypeScript, 7 tests Python, compilation et build réussis. Un test de file de tâches via le endpoint de production a identifié et validé une responsable actuelle Air Up en 56,4 secondes. Aucun appel Monid, aucune modification de contact et aucun envoi pendant ce test. Le service launchd a fourni le heartbeat, réclamé la tâche et retourné le résultat ; la tâche temporaire a ensuite été supprimée. Cela valide la liaison de production et l’identification LinkedIn, pas la délivrabilité d’un nouvel email.
