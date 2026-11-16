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
> • Sans publicité.
> • Sans compte ni e-mail : votre progression est sauvegardée sur l'appareil, avec une sauvegarde en ligne anonyme que vous pouvez désactiver.
> • Sons, musique et vibrations réglables.
>
> Prêt à libérer le cube ?

## Sécurité des données (formulaire « Data safety »)

Réponses conformes à la politique de confidentialité en vigueur (`legal/current.json`).

- L'application collecte-t-elle ou partage-t-elle des données utilisateur ? **Oui** (collecte, pas de partage).
- Les données sont-elles chiffrées en transit ? **Oui** (HTTPS vers Firebase).
- Les utilisateurs peuvent-ils demander la suppression ? **Oui** : réglages › Vos données, et https://cubelyo.vercel.app/droits-rgpd/

| Type de données Play | Collectée | Partagée | Facultative | Finalité |
| --- | --- | --- | --- | --- |
| Identifiants de l'appareil ou autres (UID anonyme Firebase) | Oui | Non | Oui (sauvegarde en ligne désactivable) | Fonctionnalité de l'application |
| Activité dans l'application › Autres actions (progression, scores, réserve d'atouts) | Oui | Non | Oui | Fonctionnalité de l'application |

Non collectés : nom, e-mail, localisation, contacts, photos, données financières, données de santé, historique web, données d'analyse ou publicitaires. Firebase agit comme sous-traitant : ce n'est pas un « partage » au sens de Google Play.

À revoir lors du lot achats en euros : Google Play Billing ajoute « Historique des achats ».

## Classification du contenu (questionnaire IARC)

- Catégorie : Jeu (casse-tête).
- Violence, peur, sexualité, langage grossier, drogues : **Non**.
- Jeux d'argent simulés : **Non** (les coffres donnent des récompenses fixes indiquées, sans mise ni hasard payant).
- Interaction entre utilisateurs, partage de position, contenu généré par les utilisateurs : **Non**.
- Achats numériques : **Non** pour l'instant (pièces gagnées en jouant uniquement). Répondre **Oui** quand les achats en euros arriveront.
- Résultat attendu : PEGI 3 / Tout public.

## Public cible et contenu

- Tranches d'âge cibles : **13–15, 16–17, 18 ans et plus** (ne pas cocher les moins de 13 ans pour éviter les exigences « Famille »).
- Annonces : **Non, l'application ne contient pas d'annonces**.
- Accès à l'application : **Toutes les fonctionnalités sont disponibles sans accès spécial** (pas de connexion).
- Application gouvernementale, financière, santé, actualités : **Non**.

## Notes de version (première publication)

> Première version de Cubelyo sur Google Play : 100 niveaux, la tour des récompenses, la boutique de pièces et la sauvegarde anonyme.
