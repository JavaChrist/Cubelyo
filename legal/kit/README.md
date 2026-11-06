# JavaChrist Legal Kit — base de travail v0.1

Générateur sans dépendance externe de cinq documents Markdown par application : confidentialité, CGU, CGV, mentions légales et droits RGPD. Périmètre initial : applications numériques françaises B2C. Ce kit automatise des documents, pas la conformité du service. Les clauses restent à adapter et à faire valider ; les informations de JavaChrist inconnues ne sont pas inventées.

## Démarrer

Node.js 20 ou supérieur. Depuis ce dossier :

```bash
npm run generate -- --app cubelyo
npm test
```

Les cinq brouillons, le rapport des champs manquants et la configuration figée sont dans `dist/cubelyo/0.1.0-draft/`.
Une génération refuse d’écraser une version existante : incrémenter `version` dans la configuration pour une nouvelle édition.

## Une identité, plusieurs apps

1. Les informations juridiques JavaChrist et le médiateur sont déjà renseignés dans `config/company.json` ; les actualiser uniquement en cas de changement.
2. Copier `apps/cubelyo.json` pour chaque app ; changer id, nom, URL et fonctionnalités.
3. Référencer son catalogue JSON dans `catalog`. Les prix sont en centimes entiers ; aucun prix Cubelyo n’est inventé.
4. Décrire les traitements réels et prestataires. Définir les clauses propres à l’application. Les modules publicités, abonnements, IA, mineurs, contenus utilisateurs et sous-traitance sont conditionnels.
5. Générer les brouillons, corriger les champs `À COMPLÉTER` et le fonctionnement réel de l’app.
6. Faire relire le jeu de documents final. Reporter dans `review` le responsable de validation, la date, `approved: true` et l’empreinte indiquée par le générateur.
7. Exécuter `npm run generate -- --app cubelyo --publish` pour obtenir la sortie marquée reviewed. Cette commande ne publie rien sur Internet.

L’empreinte couvre identité, configuration app, catalogue et modèles. Toute modification invalide la validation précédente. Une approbation JSON est une trace de workflow, jamais une certification juridique automatique.

## Tarifs automatiquement repris

Le catalogue doit être la source commune de l’interface et des CGV. Un fichier JSON copié manuellement d’un autre catalogue ne constitue pas une synchronisation. L’intégrateur doit importer le catalogue existant ou ajouter un export adapté au projet. Voir `docs/INTEGRATION.md`.
Pour les stores, renseigner `priceSource: "store"` : le prix localisé s’affiche au moment de l’achat, et les CGV ne fabriquent pas de montant statique. Pour le web : `priceSource: "catalog"`, `amountMinor`, devise et périodicité.

## Limites explicites

- Générateur CLI fonctionnel ; aucun éditeur visuel livré dans cette première version.
- Aucun audit du code applicatif, aucune détection automatique des cookies ou prestataires.
- Les textes de garanties, rétractation, mineurs et autres clauses sensibles sont à renseigner selon le produit ; publication bloquée tant qu’ils manquent.
- Les CGV d’applications gratuites restent un document de travail ; adapter si données fournies en contrepartie d’un service numérique. Ne pas déduire l’absence de toute garantie du seul prix nul.
- B2B, services réglementés, données sensibles/santé, marketplace et pays étrangers nécessitent des modèles complémentaires.
- Aucun dossier transmis sur GitHub, aucune page remplacée ni application déployée par cette création.

Un aperçu des cinq documents générés est inclus dans `examples/cubelyo-brouillon/`.

Sources et contrôles : `docs/SOURCES_ET_VALIDATION.md`.
