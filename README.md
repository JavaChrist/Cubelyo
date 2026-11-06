# Cubelyo — Casse-tête 3D

Campagne de test de 100 niveaux sur les six faces d'un cube. Le niveau 18 sert de référence pour valider l'observation, les chemins imbriqués et les déblocages entre faces avant généralisation.

## Démarrage

Node.js 24 LTS, npm 11.

```sh
npm ci
npm run dev
```

Ouvrir http://localhost:3107. Aucun fichier `.env` ni compte externe n'est nécessaire. Les niveaux sont accessibles librement pour les essais.

Glisser pour tourner, pincer à deux doigts pour zoomer ; souris et molette sur ordinateur. Toucher n'importe quelle partie du tracé pour tenter une sortie. Les atouts utilisent les réserves locales affichées.

## Accueil et progression — version 0.9

L'application arrive sur le chemin des niveaux : boutons ronds en relief, progression du bas vers le haut, niveaux terminés, niveau courant et suivants verrouillés. Un accès test ouvre les 100 niveaux ; il est activable sur l'accueil et dans les réglages. Navigation basse : Boutique / Accueil / Tour, avec Accueil au centre. Deux offres promotionnelles sont accessibles à gauche du chemin (coffre et ticket %) ; un raccourci à droite ouvre la tour. Les modales reprennent le catalogue de la boutique. Toutes les modales ont le même gabarit responsive, avec titre/croix fixes et contenu défilant. La barre compte les niveaux terminés ; l'objectif bonus sera défini plus tard.

Cinq étoiles maximum. Démarrer ou recommencer coûte une étoile et donne trois cœurs. Reprendre la partie sauvegardée ne coûte rien, même à zéro étoile. Une étoile revient toutes les 30 minutes, y compris après fermeture de la page. Une tentative bloquée coûte un cœur après son animation de retour. À zéro cœur, la continuation avec des pièces conservera le cube, mais son tarif est actuellement `null` : bouton indisponible et prix à définir.

Trois atouts fonctionnels : Indice, Gomme sur la flèche choisie, Baguette sur jusqu'à trois sorties successivement légales. Trois exemplaires de chaque pour les essais. Les coffres de la tour ajoutent des indices. Aucun achat d'atout avec les pièces ; les packs payants sont présentés dans la boutique.

La boutique prépare les achats futurs sur les stores. Les tarifs sont affichés en aperçu ; aucun paiement, aucune publicité active et aucune facturation simulée dans cette PWA réservée aux tests. Les réglages de musique, sons et vibrations sont persistants ; l'audio est synthétisé localement, les vibrations dépendent de l'appareil.

Sauvegarde locale versionnée : partie, cœurs, étoiles et horodatage de recharge, atouts, pièces, records et coffres. Le schéma 2 conserve la clé `cubelyo.profile.v1` pour migrer automatiquement les sauvegardes antérieures. Les anciennes notes à trois étoiles sont présentées comme des médailles. La sauvegarde locale n'est pas un portefeuille sécurisé de production.

Les récompenses locales de première victoire et les coffres restent attribués une seule fois. Les fonctions de progression et les tarifs en attente sont centralisés dans `src/features/progression/profile.ts`. Les définitions des cubes restent inchangées.

## Boutique — version 0.12

Catalogue en français avec offres colorées, cadres dorés, prix verts et lots de pièces en trois colonnes. Les données sont centralisées dans `src/features/shop/catalog.ts` et partagées avec les modales de l'accueil.

| Offre | Prix | Contenu |
|---|---:|---|
| Pack de départ | 1,99 € | 2 indices, 2 gommes, 2 baguettes |
| Pack sans publicité | 9,99 € | Sans publicités imposées, 3 indices, 3 gommes |
| Sans publicité | 8,99 € | Suppression des publicités imposées |
| Pack spécial | 8,99 € | 4 500 pièces, 3 indices, 3 gommes |

Lots de pièces : 1 500 à 1,99 € ; 7 500 à 8,99 € ; 20 000 à 14,99 € ; 45 000 à 34,99 € ; 80 000 à 59,99 € ; 220 000 à 99,99 €.

Ces offres sont des aperçus pour les futurs stores. Les prix sont visibles mais les achats restent désactivés dans la PWA de test : aucun paiement et aucun crédit simulé. Le tarif de continuation avec les pièces n'est pas défini par ces offres.

## Tour illustrée — version 0.11

La tour défile du sol vers le sommet : 100 étages, portes, balcons et coffres sur un fond de ciel. La montgolfière indique le nombre de premières victoires ; la vue revient à cette position à l'ouverture. Les coffres affichent leurs gains réels et ne peuvent être récupérés qu'une fois. Les récompenses et la progression permanente sont conservées.

Le bouton d'information ouvre l'aide en trois étapes, avec le même cadre que les autres modales. Illustration construite en CSS et composants, sans asset des captures ni dépendance supplémentaire. Les mouvements décoratifs respectent la préférence de mouvement réduit.

## Campagne généralisée — version 0.7

Les niveaux 4 à 100 utilisent désormais la construction à chemins imbriqués et verrous croisés du niveau 18. Les trois démonstrations et le niveau 18 terminé sont conservés à l'identique. Chaque autre plateau a sa propre graine et sa propre disposition.

- Niveaux 4–15 : petits cubes de 60 à 108 flèches, pour apprendre les dépendances entre faces.
- Dès le niveau 16 : surface entièrement occupée, plus de 300 flèches, quatre directions sur chaque face, corps traversant les arêtes et aucune face vidable isolément.
- Niveaux moyens : jusqu'à dix sorties initiales ; difficiles : jusqu'à six ; très difficiles : deux à quatre. Les niveaux difficiles reviennent aux multiples de cinq, les très difficiles aux multiples de dix ; le niveau 18 conserve son classement.
- Une arête jaune entière ; deux sur les très difficiles à partir du niveau 30. Aucune bande fragmentée.
- Les seuils portent aussi sur la longueur des chaînes, le nombre de prérequis, les empreintes irrégulières et les sorties disponibles le long du certificat. Ces derniers maxima concernent le parcours vérifié, pas tous les ordres possibles.

Les certificats prouvent la résolution complète, sans auto-collision. Le classement reste à confirmer par des essais humains ; aucune durée de jeu n'est garantie.

## Niveau 18 de référence — version 0.6

- Une seule arête jaune entière, entre front et right, symétrique. Le jaune impose de continuer le trajet de la pointe sur la face voisine.
- 366 flèches, grille 24 × 24 par face, 3 456 cellules occupées. Chemins de 4 à 33 cellules ; 357 empreintes irrégulières, 59 corps avec queue et pointe sur des faces différentes.
- Quatre directions présentes sur chaque face, avec dépendances croisées. Aucune face ne peut être vidée en jouant seulement sur les flèches qui la touchent.
- Niveau classé « Très difficile » : quatre sorties légales au départ, contre seize dans la version 0.5. Une chaîne de 62 flèches traverse les six faces, contre 24 sur trois faces auparavant.
- 290 flèches exigent plusieurs retraits préalables ; 144 dépendent de flèches dont les pointes se trouvent sur plusieurs faces.
- Dans le certificat vérifié, au maximum huit sorties sont disponibles simultanément (cinquante auparavant), et un retrait ouvre au plus quatre nouvelles sorties. Ces plafonds concernent ce parcours, pas tous les ordres de jeu possibles.

Ces mesures vérifient la construction et la résolution complète ; elles ne garantissent pas une durée de jeu. Le ressenti de difficulté reste à confirmer humainement. Cette définition du niveau 18 est la référence conservée pour la généralisation.

## Règles et rendu

La pointe ne peut jamais emprunter une cellule du corps initial de sa propre flèche, même si la queue aurait pu la libérer. Un tel tracé est rejeté par le générateur et le validateur. Les règles sont indépendantes de la caméra.

Une tentative bloquée avance jusqu'au premier obstacle, revient exactement à sa place puis devient rouge. Le rouge persiste jusqu'à disparition de la flèche, y compris après un indice. Les commandes sont verrouillées pendant le mouvement.

Rotation libre sans limite aux pôles, sensibilité 5. Sélection au plus proche du tracé visible, à 12 px souris et 16 px tactile ; pas de sélection au travers du cube ni après rotation/pincement. Faces translucides et tracés arrière atténués. Pointes plates et géométries instanciées, segments alignés fusionnés, pixel ratio limité à 1,25. Vitesse d'extraction : 48 unités de rendu par seconde, plancher de 45 ms (40 ms en mouvement réduit), avec pause au contact de 20 ms pour un échec. Rendu suspendu au repos.

## Vérifications

```sh
npm run typecheck
npm run lint
npm test
npm run levels:validate
npm run test:e2e
npm run build
npm run start
```

Les tests navigateur utilisent Chrome installé et leur propre serveur sur le port 3107, à laisser libre pendant leur exécution. Ils vérifient les sorties, retours et couleurs d'erreur, le toucher élargi, la rotation complète, le pincement et une extraction dont le corps est sur plusieurs faces. SwiftShader est utilisé : ce contrôle ne mesure pas les FPS sur un téléphone Android.

`levels:validate` relit les 100 définitions figées, vérifie leur égalité avec les définitions du jeu et rejoue les certificats jusqu'au plateau vide. Les métriques et empreintes sont dans `content/levels/catalog.json`.

## Génération et architecture

- `src/features/game/core/engine.ts` : topologie, routes, occupation et validation pures.
- `src/features/game/render/CubeScene.tsx` : géométrie, sélection et animations.
- `src/features/levels/quality.ts` : bandes, contours, dépendances et déblocages effectifs.
- `levels:previews` : ancien générateur de comparaison 16/20/100, non utilisé par la campagne actuelle.
- `levels:campaign` : reconstruit les 96 autres plateaux ; partition, brassage des branches, recomposition des verrous, rejet des cycles et sélection par seuils de progression. Les graines retenues sont dans `content/campaign/generation.json`.
- `levels:reference` : reconstruit le niveau 18 ; variantes de chemins, sélection par dépendances satisfaites puis échange de branches entre chemins voisins, sans conserver de blocs rectangulaires comme forme finale.
- `levels:freeze` : fige définitions, certificats et catalogue après validation. À lancer uniquement après une modification intentionnelle, jamais pour masquer un échec du validateur.

Le générateur de référence rejette une arête jaune fragmentée, trop de choix initiaux, des chaînes trop courtes, l'absence de déblocages multiples ou de dépendances entre faces, les auto-collisions et les définitions insolubles. Les niveaux moyens et difficiles sont alternés par vagues ; les autres niveaux n'ont pas encore tous été équilibrés selon cette référence.

Les repères locaux satisfont u × v = normale, avec x vers la droite et y vers le haut. Normales : front +Z, right +X, back −Z, left −X, top +Y, bottom −Y. Chaque cellule appartient à une seule face. Les arêtes n'ajoutent aucune cellule logique ; le rendu ajoute les points de passage.

## Limites

Pas encore de sauvegarde persistante, de PWA hors ligne, de tour, boutique, Firebase, Android ou monétisation. Changer de niveau ou recharger réinitialise la partie. Aucun service distant n'est déployé. Icônes définitives attendues de Christian. Les volumes après le niveau 100 sont préparés dans `docs/complex-surfaces.md`, pas encore implémentés.

Versions figées dans le lockfile. TypeScript 6 et ESLint 9 respectent les compatibilités des plugins installés. Webpack est utilisé après un échec du worker CSS Turbopack sous Windows. L'audit initial signale 8 alertes modérées dans les outils de développement, aucune dans les dépendances de production. Ne pas appliquer automatiquement `npm audit fix --force`. L'avertissement Three.js sur Clock provient du renderer installé.

Incrémenter `public/version.json` à chaque livraison : une modale propose « Mettre à jour » ou « Plus tard ».

## Ressources

Géométrie, tracés et interface créés pour Cubelyo. Aucune capture de référence n'est publiée comme asset. Lucide : ISC ; Geist : SIL Open Font License 1.1 ; Three.js, React Three Fiber, React, Next.js et Tailwind : MIT. Licences intégrales dans les paquets installés.

## Documents légaux (brouillons locaux)

JavaChrist Legal Kit est intégré dans `legal/` : voir [le suivi d’intégration](legal/README.md). Les cinq documents sont accessibles dans les réglages et directement par leurs routes publiques. Les pages restent marquées brouillon ; aucune validation juridique ni publication distante n’a été effectuée.

`npm run legal:generate` adapte le catalogue TypeScript du jeu et génère les cinq documents. Cette commande est aussi exécutée avant `npm run build`. Incrémenter la version dans `legal/cubelyo.json` lors d’un changement de contenu pour conserver l’édition précédente. Les rapports/snapshots ne sont pas exposés publiquement. La page `/droits-rgpd` propose l’export JSON et la suppression confirmée de la seule sauvegarde locale Cubelyo.

## Firebase et Android — préparation 0.14.0

Consulter [Firebase, Android et Vercel](docs/firebase-android.md). `.env.local` est préparé et ignoré ; Firebase reste désactivé jusqu’à réception de la configuration Web. Les règles Firestore, la synchronisation anonyme avec révisions et l’export/effacement sont prêts et testables sur émulateurs (`npm run test:firebase`). Ne pas activer le projet réel avant déploiement des règles.

Le projet Android Capacitor est dans `android/`, bundle local exporté par `npm run android:sync`, ouverture par `npm run android:open`. Le déploiement Vercel conserve le build Next.js standard. Les opérations natives, icônes et signature de publication restent à vérifier sur appareil avant distribution.
