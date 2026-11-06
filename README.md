# Cubelyo — Casse-tête 3D

Campagne de test de 100 niveaux sur les six faces d'un cube. Le niveau 18 sert de référence pour valider l'observation, les chemins imbriqués et les déblocages entre faces avant généralisation.

## Démarrage

Node.js 24 LTS, npm 11.

```sh
npm ci
npm run dev
```

Ouvrir http://localhost:3107. Aucun fichier `.env` ni compte externe n'est nécessaire. Les niveaux sont accessibles librement pour les essais.

Glisser pour tourner, pincer à deux doigts pour zoomer ; souris et molette sur ordinateur. Toucher n'importe quelle partie du tracé pour tenter une sortie. L'indice utilise la réserve locale affichée.

## Interface de jeu — version 0.8

L'écran de jeu affiche le niveau, la difficulté, le score, les trois vies et les flèches restantes. Retour, pause et redémarrage confirmé ; zoom et rotation restent gestuels. Chaque flèche libérée vaut 10 points ; une tentative bloquée coûte une vie après le retour. À zéro, on peut recommencer gratuitement.

La partie et la progression sont sauvegardées dans ce navigateur : score, étoiles, pièces, indices et coffres de la tour. Une première victoire construit un étage et rapporte `20 + 2 × (niveau − 1)` pièces ; les replays ne redonnent pas ces pièces. Un coffre tous les cinq étages, jusqu'à 100, avec lots affichés et récupération unique. Les montants sont centralisés dans `src/features/progression/profile.ts`.

Trois indices au départ. Révéler à nouveau l'indice actif ne coûte rien ; un nouveau plateau ou une extraction permet un nouvel indice. Si la réserve est vide, un indice coûte 50 pièces virtuelles. Les coffres en contiennent aussi. Aucun paiement, publicité ni portefeuille connecté n'est implémenté. La sauvegarde locale ne constitue pas une économie serveur sécurisée.

Les anciennes parties jouées avant l'introduction de la sauvegarde n'ont pas d'historique récupérable. Les définitions des cubes restent inchangées par cette interface.

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
