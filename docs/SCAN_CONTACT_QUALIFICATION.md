# Scout → contacts prêts à contacter

## Parcours livré

Scout/Matchmaker conservent leur recherche fondée sur la pertinence sportive et commerciale. La présence d’une marque dans une base de contacts n’est pas un critère d’exclusion.

Après la sauvegarde d’un nouveau scan réussi, une qualification distincte traite jusqu’à **5 prospects nouveaux, notés au moins 6/10**, dans l’ordre de leur score. Les pistes déjà contactées ne sont pas retraitées automatiquement.

Dans Prospection, la vue par défaut « Prêtes à contacter » distingue :

- un contact nominatif pertinent avec email professionnel vérifié ;
- une boîte générique officielle vérifiée, présentée comme solution de secours.

Les autres pistes restent dans « À compléter » et « Toutes ». Rédacteur reçoit l’identifiant explicite du contact prêt, avec choix de langue et validation du brouillon. La qualification ne sélectionne pas un destinataire à la place de l’utilisateur, ne valide pas l’outreach et n’envoie aucun email.

## Vérification et réutilisation

La qualification utilise les enregistrements Contact/ContactEmail, pas un ancien booléen Company.outreachReady. Elle exige un contact actif, un poste actuel contrôlé, une identité/un rôle pertinent, et une vérification technique de l’email datant de moins de 30 jours. Un rebond postérieur à cette vérification exclut sa réutilisation. L’adresse primaire effectivement utilisée par Rédacteur fait foi : une adresse secondaire vérifiée ne masque pas une primaire ancienne ou incertaine.

Un email seulement publié sur le web reste disponible pour le parcours manuel, mais ne reçoit pas automatiquement le badge vérifié. Les coordonnées privées ne sont pas sérialisées dans les props Prospection ou les jobs de suivi ; les accès admin existants sur la fiche entreprise restent inchangés.

## Coûts et sources

- Plafond **Monid de 1,50 USD par scan** ; réservation de **0,50 USD maximum par tentative d’entreprise**.
- Le plafond existant `MONID_ENRICHMENT_MAX_USD`, s’il est inférieur, est également respecté.
- Une réservation reste consommée dans l’enveloppe même après un échec ou un coût fournisseur inconnu. Elle n’est pas une facture. Les coûts constatés et réservations sont distincts dans le suivi admin.
- Au maximum trois nouvelles recherches avec réservation de 0,50 USD ; les autres entreprises peuvent être servies depuis le cache sans dépense, ou rester à compléter. « Jusqu’à 5 » n’est donc pas une promesse de cinq recherches payantes.
- Monid transporte LinkedIn/Apollo/Hunter selon la chaîne existante. La lecture bornée du site officiel peut trouver sa page LinkedIn et ses boîtes fonctionnelles ; aucune adresse n’est inventée.
- Cette étape automatique **ne lance pas de recherche LLM supplémentaire**. Le contexte IA optionnel du parcours manuel est désactivé ici. Les coûts habituels Scout/Matchmaker et ceux d’un enrichissement manuel séparé ne font pas partie de l’enveloppe Monid du scan.
- Aucune nouvelle souscription ni nouvelle variable d’environnement obligatoire.

La disponibilité d’un contact dans une base n’assure ni un email vérifiable, ni sa délivrance, ni une réponse commerciale. Aucun objectif de couverture à 100 % n’est promis.

## Exécution, reprise et concurrence

Le scan conserve son statut `completed` indépendamment de l’enrichissement. Son dernier événement SSE est best-effort : fermer la connexion ne transforme pas un scan sauvegardé en échec.

Le job est enregistré dans ActivityLog (`scan_contact_qualification`, ID `scan-qualification:<scanId>`), sans nouvelle migration. Il ne contient que des IDs, états, dates, compteurs et coûts. Le flux d’activité public exclut ces enregistrements ainsi que les verrous internes `contact_enrichment_lease`.

`GET /api/agents/scan/contacts` lit uniquement les jobs propres à l’utilisateur. `POST` avance au plus une entreprise d’un job existant ; propriétaire ou administrateur autorisé uniquement, jamais free user. Une version JSON compare-and-swap et une lease par entreprise protègent les doubles onglets, les scans concurrents et l’enrichissement manuel. Les réservations sont persistées avant l’appel payant ; les workers périmés sont bloqués avant/après appel et avant persistance.

Le coordinateur reste monté pendant la navigation interne. Au rechargement, il relit l’état serveur avant toute continuation. Une requête au résultat ambigu n’est pas répétée : si sa lease de 330 secondes expire, le job est réconcilié en interruption et les pistes restent disponibles. Les jobs non terminés de plus de 24 heures sont également interrompus sans nouvelle dépense.

Ce n’est **pas un worker permanent hors navigateur** : si l’application est entièrement fermée, les étapes suivantes attendent son retour. Un appel serveur déjà engagé peut terminer, mais sa reprise dépend de l’état enregistré ; aucune garantie d’exécution continue après fermeture de l’application.

## Vérification

Tests automatisés avec stockage/fournisseurs simulés : sélection des candidats, fraîcheur et rebonds, boîtes génériques, budget et coûts inconnus, CAS concurrent, lease expirée, worker tardif, autorisations et confidentialité. Build Next.js et tests UI locaux avec données fictives.

Les tests simulés valident le parcours et les garde-fous, **pas le taux de couverture réel** d’Apollo/Hunter/LinkedIn ni un coût moyen de production. Aucun scan, enrichissement payant ou envoi réel n’est requis pour ces vérifications.
