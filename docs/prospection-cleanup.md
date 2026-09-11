# Nettoyage de la prospection par athlète

Dans **Prospection**, choisir un athlète puis ouvrir **Gérer la prospection**.
Sélectionner une ou plusieurs marques, ou toutes les lignes de la vue. Le filtre
par scan permet d'isoler une ancienne recherche sans cutoff de date arbitraire.

- **Archiver** : masque les opportunités dans la prospection active, les pistes
  prioritaires du dashboard et la fiche athlète. Ne modifie pas leur statut métier,
  leurs deals, leurs emails ou les envois déjà programmés.
- **Archives → Restaurer** : rétablit leur visibilité. Un nouveau scan ne restaure
  pas automatiquement une opportunité archivée.
- **Supprimer définitivement** (admin uniquement) : nécessite la saisie de
  `SUPPRIMER`. Toute sélection contenant un prospect avec email (même brouillon),
  conversation, deal ou attribution est refusée en entier : utiliser l'archivage.
- **Supprimer les fiches entreprises inutilisées** : option décochée par défaut.
  Une fiche n'est effacée que sans autre prospect, email, deal, contact, emploi,
  preuve, sponsoring, signal, événement d'apprentissage ou conversation.
  Les entreprises partagées entre athlètes restent toujours conservées.

Les droits sont contrôlés côté serveur. Le rôle free user ne peut pas nettoyer.
Les IDs doivent tous appartenir à l'athlète choisi, sans cible globale implicite.
Un scan en cours bloque l'opération. Les mutations et le journal d'activité sont
regroupés dans une transaction sérialisable. Les scans historiques sont conservés.

## Déploiement

Migration additive requise **avant** de déployer le code :
`prisma/migrations/20260911120000_prospect_archive/migration.sql`.
Elle ajoute `Prospect.archivedAt` nullable et un index par athlète/archivage.
Ne pas utiliser de reset ou de db push destructif. Vérifier l'état réel des
migrations sur l'environnement cible avant d'appliquer le SQL.

Aucune donnée de production n'a été archivée ou supprimée pendant le développement.

## Vérifications

- `npx tsc --noEmit`
- `npm test` (tests unitaires avec transaction simulée, sans suppression réelle)
- Après migration sur une base de test : archive/restauration d'un prospect vierge,
  suppression d'un prospect vierge, conservation d'une entreprise partagée,
  refus des prospects avec historique et accès free user, confirmation au clavier
  et sur mobile, persistance après rechargement.
