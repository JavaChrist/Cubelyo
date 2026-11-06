# Intégration dans une app

## Routes proposées

| Document | Route |
|---|---|
| Confidentialité | `/confidentialite` |
| CGU | `/conditions-utilisation` |
| CGV | `/conditions-vente` |
| Mentions | `/mentions-legales` |
| Droits RGPD | `/droits-rgpd` |

Conserver les routes existantes lorsqu’elles sont déjà utilisées par des stores ou contrats ; ajouter des redirections si nécessaire. Importer les Markdown générés via un renderer maîtrisé, HTML brut désactivé. Les configurations sont des contenus de confiance réservés aux administrateurs, jamais une entrée utilisateur à exécuter.

## Catalogue unique

1. Repérer la source réelle des offres dans le projet (JSON, TypeScript, base, API).
2. Ajouter un adaptateur vers le schéma `catalogs/cubelyo.json`, sans dupliquer manuellement les tarifs.
3. Alimenter l’écran commercial et la génération à partir de cette source.
4. En CI, générer dans un répertoire/version neuf et refuser une sortie reviewed si son empreinte n’est pas approuvée.
5. Conserver la version juridique, le contenu remis, le montant et la devise réels avec chaque commande. L’interface peut actualiser ses prix, les contrats passés restent figés.

La sortie reviewed comprend un snapshot interne : ne pas exposer rapport/snapshot comme fichiers publics. Seules les cinq pages destinées au public sont intégrées.

## Fonctionnalités à réaliser dans l’application

Un lien RGPD doit ouvrir un vrai parcours : accès/export, suppression de compte, gestion consentement et contact. Une page ne réalise pas ces actions. Prévoir les droits d’accès serveur et la suppression effective des données avec exceptions documentées. Ne pas lier suppression compte et résiliation d’abonnement sans vérifier les règles du canal de paiement.

Sur les parcours de vente : acceptation/version des CGV lorsque requise, bouton avec obligation de paiement, confirmation durable, consentements distincts nécessaires, rétractation en ligne si applicable, résiliation électronique si applicable, restauration des achats stores et mécanismes de garanties.

## Éditeur visuel futur

Un futur panneau admin peut éditer la configuration, afficher les cinq rendus et les points manquants, puis proposer une validation de version. Il doit réutiliser ce moteur et son empreinte. Ne pas rendre un éditeur accessible au public ni y stocker des secrets SMTP ou Firebase Admin.

## Transmission à Codex ou Claude Code

Inspecte le projet, relie son vrai catalogue au Legal Kit, complète uniquement les informations prouvées et liste les manquantes. Compare chaque clause aux fonctionnalités réelles. Préserve les pages légales déjà validées, en particulier celles de SousPli ; ne les remplace pas automatiquement par ces brouillons. Prépare un diff des pages pour revue. N’active pas une clause de renonciation au droit de rétractation sans le parcours et les preuves correspondants.
