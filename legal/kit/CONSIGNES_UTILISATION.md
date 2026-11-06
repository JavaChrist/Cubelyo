# JavaChrist Legal Kit — Consignes d’utilisation

À placer à la racine du dossier `JavaChrist-Legal-Kit`, à côté de `README.md`.

## 1. À quoi sert ce dossier ?

Il permet de préparer et mettre à jour cinq documents pour les applications JavaChrist :

- Politique de confidentialité.
- Conditions d’utilisation (CGU).
- Conditions générales de vente (CGV).
- Mentions légales.
- Droits RGPD.

L’identité juridique de JavaChrist et les coordonnées du médiateur sont déjà renseignées. Le nom, l’adresse du site, les offres et les rubriques propres à chaque application viennent de sa configuration.

Le kit actuel est un générateur en ligne de commande. Il ne comporte pas encore de générateur visuel, ne détecte pas seul les traitements de données et ne synchronise pas à distance les applications déjà déployées.

## 2. Où conserver le kit ?

Conserver un dossier central et son dépôt GitHub `JavaChrist-Legal-Kit` si ce dépôt a été créé. Donner accès à ce dossier ou au dépôt à l’agent qui travaille sur l’application.

Pour chaque application, garder sa configuration dans le kit. Lors de l’intégration, documenter la version du kit utilisée et la façon dont les pages sont copiées ou générées dans le projet. Éviter les copies de modèles qui divergent sans suivi.

## 3. Les fichiers à connaître

| Chemin dans le kit | Utilité |
| --- | --- |
| `config/company.json` | Identité juridique et médiateur communs à JavaChrist |
| `apps/cubelyo.json` | Exemple de configuration d’une application |
| `catalogs/cubelyo.json` | Exemple de catalogue des offres |
| `templates/` | Les cinq modèles communs |
| `scripts/generate.mjs` | Générateur |
| `docs/INTEGRATION.md` | Consignes techniques d’intégration |
| `docs/SOURCES_ET_VALIDATION.md` | Sources et points de contrôle |
| `examples/cubelyo-brouillon/` | Aperçu de documents générés, non destinés à une publication immédiate |
| `dist/` | Résultat de la génération, créé localement |

Les fichiers d’exemple Cubelyo restent des brouillons : les fonctionnalités décrites comme envisagées doivent être adaptées à ce qui est réellement activé.

## 4. Première utilisation sur une application

### Étape A — Fournir le projet et le kit à l’agent

Ouvrir le projet de l’application dans Codex, Claude Code ou Cursor. Indiquer le chemin local ou le lien GitHub du kit. Utiliser la consigne prête à copier en section 10.

### Étape B — Préparer une configuration propre à l’app

L’agent copie `apps/cubelyo.json` vers `apps/identifiant-app.json`, puis adapte :

- `id` : identifiant technique en minuscules, sans espace, avec tirets si nécessaire.
- `name` et `url` : nom et URL de production.
- `supportEmail` : adresse réellement utilisée.
- `version` et `effectiveDate` : version documentaire et date d’effet.
- `features` : fonctions réellement disponibles, pas celles seulement prévues.
- `processing` : finalités, données, bases légales, nécessité, destinataires, conservation et provenance.
- `providers` : prestataires réellement utilisés, rôles, lieux et transferts.
- `hosting` : coordonnées de l’hébergeur de cette application.
- `clauses` : fonctionnement, achats, droits et modalités propres à cette app.
- `catalog` : chemin du catalogue effectivement relié à l’offre commerciale.

Conserver les informations déjà renseignées dans `config/company.json`. Ne les changer que sur instruction de Christian ou sur la base d’une nouvelle information vérifiée. Ne pas demander de nouveau ces coordonnées pour chaque application.

L’agent lit le code et les configurations autorisées pour retrouver les informations techniques. Il distingue les informations prouvées des hypothèses et regroupe les seuls points qu’il ne peut pas déterminer.

### Étape C — Relier les offres et tarifs

Le catalogue doit alimenter à la fois l’affichage commercial et les documents. Selon le projet, l’agent réutilise son JSON existant ou crée un export depuis sa source réelle : TypeScript, base de données ou API.

Une copie manuelle de prix dans `catalogs/` ne devient pas automatiquement synchronisée avec l’app.

- Prix web : `priceSource: "catalog"`, prix en centimes entiers via `amountMinor`, devise, taxes et périodicité.
- Prix Play/App Store : `priceSource: "store"`, identifiant du produit et prix localisé présenté au client par le store au moment de l’achat.
- Offre prévue : `status: "planned"` ; elle ne doit pas être présentée comme commercialisée.
- Offre ouverte : `status: "active"`, uniquement si elle est réellement disponible.

Ne pas inventer de prix, de durée de droits, de prestataire ou de régime contractuel.

### Étape D — Générer et vérifier les brouillons

Depuis le dossier du kit, avec Node.js 20 ou supérieur :

```bash
npm run generate -- --app identifiant-app
npm test
```

Remplacer `identifiant-app` par l’identifiant réel, par exemple `cubelyo`.
Aucune dépendance externe n’est à installer pour le générateur actuel.

Les documents et le rapport sont créés dans :

```text
dist/identifiant-app/version-draft/
```

Le générateur affiche les champs manquants et l’empreinte de configuration. Lire les cinq documents et `rapport.json`, compléter les informations et corriger les incohérences avec le service réel.

Une génération n’écrase pas une version existante. Pour une nouvelle édition, incrémenter le champ `version` ; conserver les anciennes éditions utiles. Le champ `version` correspond ici aux documents, pas nécessairement au numéro de build de l’app.

## 5. Validation et sortie finale

Les textes générés doivent correspondre aux fonctionnalités réelles et aux engagements commerciaux. Les clauses sensibles encore marquées `À COMPLÉTER` ne sont pas prêtes à publier.

Après une validation effective des documents, renseigner dans `review` :

- `approved: true`.
- `reviewer` : personne ayant réellement validé.
- `reviewedAt` : date réelle de validation.
- `configurationSha256` : empreinte exacte affichée pour la configuration relue.

Ne pas faire remplir ces champs par l’agent dans le seul but de contourner le blocage. Cette trace de validation n’est pas une certification juridique.

Puis exécuter :

```bash
npm run generate -- --app identifiant-app --publish
```

Cette commande produit une sortie `version-reviewed`. **Elle ne publie aucune page et ne déploie aucune application.** Toute modification des informations, du catalogue ou des modèles invalide l’empreinte précédente et appelle une nouvelle revue de la version concernée.

Le moteur actuel est une base pour le français et les applications numériques B2C en France. Les activités B2B, réglementées, les marketplaces ou les autres pays nécessitent une adaptation ; ne pas forcer la validation d’un modèle inadapté.

## 6. Intégrer dans l’application

L’agent intègre uniquement les cinq documents publics au système de pages du projet. Il laisse les rapports et snapshots internes hors du répertoire public.

| Document | Route proposée |
| --- | --- |
| Confidentialité | `/confidentialite` |
| CGU | `/conditions-utilisation` |
| CGV | `/conditions-vente` |
| Mentions légales | `/mentions-legales` |
| Droits RGPD | `/droits-rgpd` |

Conserver les URL déjà utilisées par les stores et les contrats. Si une route change, préparer les redirections appropriées.

Ajouter les liens dans le pied de page et/ou le profil de l’app. Vérifier que les pages publiques sont consultables sans compte, lisibles sur mobile et ne montrent aucun champ non résolu.

Les fonctions annoncées doivent réellement exister : export, suppression, préférences de consentement, rétractation ou résiliation lorsque ces parcours sont applicables. Une page d’information ne réalise pas ces opérations à elle seule.

Ne pas remplacer automatiquement les textes déjà validés d’une app, notamment SousPli : présenter un diff pour conserver les clauses spécifiques utiles.

## 7. Utilisation dans le futur

| Changement | Intervention |
| --- | --- |
| Nouvelle app | Ajouter configuration et catalogue, générer et intégrer ses documents |
| Prix ou offre modifiés | Actualiser la source commerciale, régénérer et examiner les clauses affectées |
| Nouveau prestataire ou donnée collectée | Mettre à jour traitements, destinataires, conservation et transferts |
| Publicités ou IA activées | Activer et renseigner les modules correspondants avant mise en service |
| Identité JavaChrist ou médiateur modifiés | Corriger `config/company.json`, puis mettre à jour les apps concernées |
| Modèle commun corrigé | Examiner l’impact et régénérer les apps auxquelles la correction s’applique |

Après mise à jour : nouvelle version documentaire, génération, vérification, validation et redéploiement du projet dans le périmètre autorisé.

Le kit ne pousse pas tout seul ses changements dans les autres dépôts et ne met pas à jour automatiquement les sites en production.

## 8. Historique des achats et versions

Conserver les conditions effectivement remises au client, la version acceptée, les dates et les éléments de la commande. Le prix payé et les droits acquis ne doivent pas être réécrits lorsqu’un tarif change.

Le dossier `dist/` est ignoré par Git dans le kit actuel : ses sorties ne sont donc pas archivées automatiquement sur GitHub. Prévoir dans chaque projet un archivage durable des versions remises et des confirmations de commande. Ne pas compter sur un dossier local temporaire comme seul historique.

## 9. Compte rendu attendu de l’agent

En fin d’intégration, fournir :

- Les configurations et pages créées ou modifiées.
- La source exacte du catalogue et le mécanisme de mise à jour.
- La version du kit et la version documentaire utilisées.
- Les vérifications effectuées et leurs résultats.
- Les informations encore manquantes, regroupées en une liste courte.
- L’état réel : brouillon, relu, intégré localement ou déployé.

Ne pas présenter une simple génération de textes comme une mise en conformité complète de l’application.

## 10. Consigne prête à donner à Codex, Claude Code ou Cursor

Copier le texte suivant et ajouter le chemin du dossier ou le lien réel du dépôt :

> Intègre JavaChrist Legal Kit dans l’application actuellement ouverte. Lis d’abord CONSIGNES_UTILISATION.md, README.md et docs/INTEGRATION.md du kit ainsi que les instructions du projet. Conserve l’identité juridique JavaChrist et les coordonnées du médiateur déjà renseignées. Inspecte les fonctionnalités réellement activées, les données collectées, les prestataires et le catalogue commercial. Crée ou actualise la configuration de cette app et relie les tarifs à leur source réelle pour éviter une duplication manuelle. Génère les cinq documents, compare-les aux pages existantes et conserve les clauses spécifiques déjà validées. Prépare leur intégration et les liens de navigation. Vérifie aussi l’existence des parcours annoncés : accès/export/suppression, consentement et parcours commerciaux applicables. Ne transforme pas une hypothèse en fait et ne renseigne pas une approbation juridique à la place de Christian. Avance sur toutes les parties indépendantes, puis regroupe les seules informations impossibles à déterminer et les points nécessitant validation. Termine par les fichiers modifiés, la source des prix, les vérifications et l’état réel de publication. Le chemin du kit ou son lien GitHub est : [À REMPLACER].
