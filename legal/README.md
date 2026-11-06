# Documents légaux Cubelyo

État : brouillon intégré localement, sans validation juridique ni déploiement.

Source : https://github.com/JavaChrist-apps/JavaChrist-Legal-Kit
Commit : b3345709d0ae1a3c5f8d358dfd50a2cd9cb2487c (kit v0.1).
Version documentaire courante : 0.2.0-pwa, suffixe -firebase si activé ; configurations `cubelyo.json` et `firebase-draft.json`. L’édition initiale 0.1.0-pwa est conservée.

`npm run legal:generate` charge les variables comme Next.js, exporte le catalogue TypeScript réel puis exécute le moteur du kit dans un dossier temporaire neuf. Les éditions sont conservées sous `legal/generated/<version>/<empreinte>/` ; `legal/current.json` sélectionne le document du build. Cette séparation permet des variantes local/Firebase/URL Vercel sans écraser une autre édition. Les cinq Markdown seuls alimentent les pages publiques. Rapport et snapshot restent dans `legal/generated/`, jamais dans `public/` ni dans les réponses des pages.

Source unique des offres : `src/features/shop/catalog.ts`. Toutes sont prévues et non commercialisées ; les prix futurs sont fournis par les stores. Les prix indicatifs de la PWA sont exportés automatiquement dans le snapshot interne, sans constituer un prix contractuel store.

Adaptations suivies du kit : contrôle de chemin du catalogue compatible Windows via `relative`/`isAbsolute` ; annexe aux CGV décrivant les offres prévues lorsque les ventes sont inactives. Les autres modèles et l’identité JavaChrist sont conservés.

Avant publication : confirmer URL/hébergeur de production et traitements associés, public admis/mineurs, base légale et clauses contractuelles ; faire relire les textes. Avant activation des stores : identifiants produits, vendeur par canal, garanties, rétractation, confirmation/archivage et restauration des achats. `review.approved` reste faux ; aucune sortie reviewed n’est créée.

Après modification des fonctionnalités, de l’identité ou des modèles, mettre à jour la configuration, incrémenter sa version et régénérer. Les configurations, rapports et snapshots sont internes. Ne pas utiliser la suppression locale comme suppression d’un futur compte serveur.

Le supplément Firebase est pris en compte uniquement avec l’activation explicite et les quatre paramètres Web présents. La région, les engagements du prestataire et l’hébergement doivent être finalisés avant publication. Aucun projet Firebase réel n’a été renseigné par cette préparation.
