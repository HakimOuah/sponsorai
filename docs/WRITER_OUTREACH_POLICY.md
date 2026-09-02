# Rédaction : ouvrir la discussion avant de définir les prestations

## Consigne du 2 septembre 2026

Les nouveaux brouillons doivent sonder l'intérêt de la marque pour un partenariat potentiel. Les prestations et conditions commerciales seront définies seulement après un échange et la validation du représentant du sportif.

- Présenter le représentant et le sportif, puis expliquer la pertinence du rapprochement à partir de faits vérifiables.
- Évoquer une collaboration, un sponsoring ou des activations à envisager ensemble selon les objectifs de la marque.
- Ne proposer aucun format ou livrable précis, même au conditionnel ou sous forme d'exemples : stories, posts, vidéos, capsule, présence à un événement, etc.
- Ne préannoncer ni volume, ni prix, ni calendrier de collaboration, ni disponibilité, ni exclusivité, ni droits d'image.
- Terminer par une invitation à échanger ou à recevoir une présentation, sans urgence artificielle.

Exemple d'intention, à adapter et non à recopier systématiquement :

> Nous pensons qu'une collaboration avec votre marque pourrait être pertinente et souhaiterions échanger sur les activations envisageables, en fonction de vos objectifs.

## Portée

Le même cadre est injecté dans les instructions du Rédacteur (premier contact, J+4, J+10, toutes les langues disponibles) et du Relanceur contextuel. Il s'applique à l'objet et au corps du message, y compris à la seconde génération éventuelle destinée à corriger la voix du représentant.

Les pistes du scan restent utiles en interne pour le contexte, mais sont explicitement non validées et ne constituent pas une offre à reproduire. Le type de partenariat du prospect n'est plus injecté comme une consigne de rédaction. Scout et Matchmaker conservent leurs fonctions de recherche et de recommandation.

Les brouillons déjà enregistrés et les emails envoyés ne sont pas réécrits. Le fournisseur IA, le modèle, les droits d'accès et le circuit de validation avant envoi ne changent pas.

## Vérification

`tests/writer-discussion-policy.test.ts` vérifie les instructions communes et intercepte les requêtes du Rédacteur pour les trois types d'email dans les six langues disponibles. Il couvre aussi la correction de voix et une relance contextuelle dont l'ancien objet mentionne des prestations.

Les réponses du modèle sont simulées : ces tests prouvent la transmission des consignes, pas une conformité garantie de toutes les générations. Aucun appel IA payant, enrichissement, création de brouillon en production ou envoi d'email n'est nécessaire à ces tests. La relecture humaine avant envoi reste requise.
