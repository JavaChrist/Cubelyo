# Fiche Google Play — Cubelyo

Textes et réponses à reprendre dans la Play Console. Images dans ce dossier :
`play-icon-512.png` (icône 512 × 512), `play-feature-1024x500.png` (image de présentation),
`screenshots/phone/` (téléphone 1080 × 1920), `screenshots/tablet-7/` (tablette 7" 1200 × 1920),
`screenshots/tablet-10/` (tablette 10" 1600 × 2560) : `node scripts/play-screenshots.mjs`. Régénérer les icônes : `npm run android:icons`.

## Identité

- Nom de l'application : **Cubelyo**
- Package : `fr.javachrist.cubelyo`
- Catégorie : Jeux › Réflexion
- Tags suggérés : casse-tête, logique, 3D, réflexion
- Langue par défaut : français (France)
- Adresse e-mail de contact : support@javachrist.fr
- Site web : https://cubelyo.vercel.app
- Règles de confidentialité : https://cubelyo.vercel.app/confidentialite/

## Description courte (80 caractères max)

> Libérez chaque flèche du cube 3D : un casse-tête malin, 100 niveaux à résoudre.

(78 caractères)

## Description complète (4 000 caractères max)

> Cubelyo est un casse-tête en 3D simple à prendre en main et difficile à lâcher.
>
> Chaque cube est couvert de flèches. Touchez une flèche : si son chemin est libre, elle glisse hors du cube. Si une autre flèche lui barre la route, elle revient à sa place et vous perdez un cœur. Faites tourner le cube, observez chaque face et trouvez le bon ordre pour tout libérer.
>
> **Comment jouer**
> • Faites pivoter le cube du doigt pour voir toutes ses faces.
> • Touchez une flèche pour la faire sortir dans sa direction.
> • Libérez toutes les flèches pour terminer le niveau.
> • Trois cœurs par cube : réfléchissez avant de toucher.
>
> **100 niveaux progressifs**
> Des premiers cubes pour apprendre les règles jusqu'aux grands cubes qui demandent de l'anticipation, la difficulté monte pas à pas.
>
> **Des atouts quand vous bloquez**
> • Indice : montre une flèche qui peut sortir.
> • Gomme : efface la flèche de votre choix, même bloquée.
> • Baguette : libère plusieurs flèches d'un coup.
>
> **La tour des récompenses**
> Gagnez des pièces en terminant les niveaux, montez les étages de la tour et ouvrez des coffres. Les saisons de 14 jours relancent la course aux récompenses. Échangez vos pièces contre des atouts et des étoiles dans la boutique.
>
> **Pensé pour jouer sereinement**
> • Une bannière discrète hors des niveaux, jamais pendant une partie.
> • Sans compte ni e-mail : votre progression est sauvegardée sur l'appareil, avec une sauvegarde en ligne anonyme que vous pouvez désactiver.
> • Sons, musique et vibrations réglables.
> • Achats facultatifs : lots de pièces, packs d'atouts et option sans publicité.
>
> Prêt à libérer le cube ?

## Sécurité des données (formulaire « Data safety »)

Réponses conformes à la politique de confidentialité en vigueur (`legal/current.json`).

- L'application collecte-t-elle ou partage-t-elle des données utilisateur ? **Oui** (collecte ; partage avec Google AdMob pour la publicité).
- Toutes les données collectées sont-elles chiffrées en transit ? **Oui** (HTTPS vers Firebase, AdMob et le serveur de vérification des achats).
- Proposez-vous un moyen de demander la suppression des données ? **Oui** : Réglages › Vos données, et https://cubelyo.vercel.app/droits-rgpd/
- Identifiant publicitaire : **non utilisé**. La permission `com.google.android.gms.permission.AD_ID` est retirée du manifeste (vérifié dans le manifeste fusionné de l'AAB) ; le SDK Google Mobile Ads ne lit donc pas l'identifiant publicitaire. Dans « Contenu de l'appli › Identifiant publicitaire », répondre **Non**.

| Type de données Play | Collectée | Partagée | Traitement éphémère | Obligatoire ou facultative | Finalités |
| --- | --- | --- | --- | --- | --- |
| Position › Position approximative (déduite de l'adresse IP par AdMob) | Oui | Oui | Non | Obligatoire | Publicité ou marketing, Analyse, Prévention des fraudes, sécurité et conformité |
| Activité dans l'application › Interactions avec l'application (affichages et clics sur les annonces) | Oui | Oui | Non | Obligatoire | Publicité ou marketing, Analyse, Prévention des fraudes, sécurité et conformité |
| Activité dans l'application › Autres actions dans l'application (progression, scores, réserve d'atouts, sauvegarde en ligne) | Oui | Non | Non | Facultative | Fonctionnalité de l'application |
| Infos et performances de l'application › Diagnostics (SDK Google Mobile Ads) | Oui | Oui | Non | Obligatoire | Publicité ou marketing, Analyse, Prévention des fraudes, sécurité et conformité |
| Identifiants de l'appareil ou autres (App Set ID, via le SDK Google Mobile Ads) | Oui | Oui | Non | Obligatoire | Publicité ou marketing, Analyse, Prévention des fraudes, sécurité et conformité |
| Identifiants de l'appareil ou autres (UID anonyme Firebase) | Oui | Non | Non | Facultative (sauvegarde en ligne désactivable) | Fonctionnalité de l'application |
| Informations financières › Historique des achats (produit et jeton Google Play, vérifiés par le serveur) | Oui | Non | Oui | Facultative (seulement en cas d'achat) | Fonctionnalité de l'application |

Une même catégorie « Identifiants de l'appareil ou autres » regroupe l'App Set ID et l'UID Firebase : cocher Collectée **et** Partagée, finalités = union des deux lignes (Fonctionnalité, Publicité, Analyse, Prévention des fraudes), Obligatoire.

Non collectés : nom, e-mail, localisation précise, contacts, photos, données de paiement (carte, compte bancaire : gérées par Google Play, jamais vues par l'application), données de santé, historique web, journaux de plantage. AdMob agit pour ses propres finalités : c'est un « partage ». Firebase et Vercel agissent comme sous-traitants : ce n'est pas un « partage » au sens de Google Play. La réponse à la question d'âge reste sur l'appareil. Source AdMob : page officielle « Data disclosure » du SDK Google Mobile Ads (Android).

## Classification du contenu (questionnaire IARC)

- Catégorie : Jeu (casse-tête).
- Violence, peur, sexualité, langage grossier, drogues : **Non**.
- Jeux d'argent simulés : **Non** (les coffres donnent des récompenses fixes indiquées, sans mise ni hasard payant).
- Interaction entre utilisateurs, partage de position, contenu généré par les utilisateurs : **Non**.
- Achats numériques : **Oui** (pièces, packs d'atouts et suppression des publicités, payés par Google Play).
- Résultat attendu : PEGI 3 / Tout public.

## Public cible et contenu

- Tranches d'âge cibles : **13–15, 16–17, 18 ans et plus** (ne pas cocher les moins de 13 ans pour éviter les exigences « Famille »).
- Annonces : **Oui, l'application contient des annonces** (bannière AdMob hors des niveaux, vidéos de promotion JavaChrist pour les adultes déclarés).
- Accès à l'application : **Toutes les fonctionnalités sont disponibles sans accès spécial** (pas de connexion).
- Application gouvernementale, financière, santé, actualités : **Non**.

## Notes de version (première publication)

> Première version de Cubelyo sur Google Play : 100 niveaux, la tour des récompenses, la boutique de pièces et la sauvegarde anonyme.

## Notes de version 0.17.0 (versionCode 1700)

Nom de la version : `1700 (0.17.0)`

```
<fr-FR>
Boutique : chargement des prix Google Play plus fiable, et message clair quand un achat n’est pas encore disponible sur votre appareil.
</fr-FR>
```

## Notes de version 0.16.0 (versionCode 1600)

Nom de la version : `1600 (0.16.0)`

```
<fr-FR>
Nouveau : la boutique accepte les achats Google Play. Lots de pièces, packs d'atouts et option sans publicité, payés en toute sécurité par Google Play. Les achats sans publicité se restaurent depuis Réglages › Restaurer les achats. Bannière discrète hors des niveaux, jamais pendant une partie.
</fr-FR>
```
