# Cubelyo

Statut : actif — campagne de test de 100 niveaux, version 0.8.0.

Jeu de logique 3D de JavaChrist : libérer des flèches sur les six faces d'un cube, avec des trajets de sortie pouvant traverser plusieurs arêtes.

Brief : [CUBELYO_CAHIER_DE_TRAVAIL_CODEX.md](./CUBELYO_CAHIER_DE_TRAVAIL_CODEX.md).

## Interface et progression locale — 6 novembre 2026

- GO de Christian pour l'écran de jeu lumineux, les boutons, le score, trois vies par niveau, la victoire et la tour des récompenses. Ce choix visuel remplace l'ancienne présentation sombre ; polices Geist et icônes Lucide conservées en attendant ses assets.
- Score : 10 points par flèche libérée ; les vies restantes donnent les étoiles. Une tentative bloquée coûte une vie après l'animation de retour. À zéro vie : recommencer gratuitement avec trois vies ou revenir aux niveaux. Pas d'énergie ni d'attente payante.
- Retour aux niveaux, pause, confirmation de redémarrage, indice actif et tour accessibles. Les commandes de zoom et de rotation restent gestuelles. Sélection libre des 100 niveaux conservée pour les essais.
- Sauvegarde locale versionnée `cubelyo.profile.v1` : partie actuelle, flèches retirées et rouges, vies, indice actif, pièces, indices, records et coffres réclamés. Rechargement : reprise de la partie. Aucun compte ni portefeuille serveur.
- Première victoire : `20 + 2 × (niveau − 1)` pièces, une seule fois. Rejouer améliore les records sans doubler le gain. Tour : un étage par niveau terminé distinct, 100 étages et un coffre tous les cinq. Attribution locale dédupliquée.
- Coffres 5–30 : montants du cahier. Après 30 : 650 + 20 × (étage − 30) pièces et 6 + plancher((étage − 30)/10) indices. Lots fixes affichés avant ouverture ; aucune récompense aléatoire ni apparence fictive.
- Départ : trois indices ; un indice révèle une sortie valide, sans nouveau débit tant qu'il reste actif sur le même plateau. Réserve vide : achat avec 50 pièces virtuelles ou accès aux coffres. Aucun paiement réel ni publicité simulée.
- Validation : 117 tests unitaires, dont récompenses et sauvegarde ; six parcours Chrome, dont vies épuisées/redémarrage, victoire, reprise et coffre sans double crédit. Contrôles mobiles et captures dans `.tmp/`. Les profils des tests 3D disposent d'indices supplémentaires pour isoler les gestes de l'économie.

## État

- Campagne de 100 niveaux. Les trois démonstrations et le niveau 18 terminé par Christian sont conservés ; les 96 autres plateaux sont reconstruits avec la méthode de référence.
- Niveaux 4–15 : grilles de 10 à 14 cellules par côté, 60–108 flèches. Dès le niveau 16 : grilles de 24 à 28, plus de 300 flèches, couverture complète des six faces.
- Construction propre à chaque niveau : variantes hamiltoniennes, échanges de branches entre chemins voisins, puis recomposition du graphe de verrous sans cycles. Pas de simple copie ou rotation du niveau 18. Graines retenues dans `content/campaign/generation.json`.
- Directions variées sur chaque face, corps réellement répartis sur plusieurs faces, empreintes irrégulières et simulation d'une face isolée obligatoirement bloquée. Auto-collision strictement interdite, y compris sur une cellule que la queue libérerait.
- Mesures des grands plateaux livrés : dix sorties initiales sur les moyens, six sur les difficiles et quatre sur les très difficiles ; chaînes de 32–88, 52–85 et 62–97 flèches respectivement. Ces valeurs seules ne définissent pas la difficulté humaine.
- Difficulté par vagues : moyens, difficiles aux multiples de cinq, très difficiles aux multiples de dix ; exception conservée au niveau 18. Plafonds de sorties initiales : dix, six et quatre. Chaînes minimales et disponibilité le long du certificat adaptées au palier. Les seuils de construction ne garantissent ni durée de jeu ni difficulté ressentie.
- Une arête jaune entière ; deux sur les très difficiles à partir du niveau 30. Niveau 18 : une seule arête front/right et définition inchangée (empreinte SHA-256 vérifiée).
- Niveau 18 conservé : 366 flèches, quatre sorties initiales, chaîne de 62 flèches sur les six faces, 290 flèches à plusieurs prérequis. Certificat avec au plus huit sorties disponibles à la fois.
- Rotation Trackball libre, pincement, sélection sur tout le corps (12 px souris, 16 px tactile), faces translucides, traits fins et animation rapide. Échec animé jusqu'à l'obstacle puis retour et rouge persistant.
- Géométries immobiles instanciées ; une flèche animée séparément. Seul l'indice reste en atout autour du cube. Sélection libre des niveaux et sauvegarde locale pour les essais.
- Application locale Next.js/React/TypeScript/Three.js. Icônes définitives attendues ; Lucide temporaire. Aucun service externe, publicité, paiement ou compte configuré. Aucun commit ni push.
- Formes complexes après le niveau 100 : toujours au stade de conception, non réalisées par cette généralisation.

## Validation courante — version 0.8.0, 6 novembre 2026

- Régression démontrée : les contrôles de campagne renforcés échouent sur 96 anciennes définitions, puis passent sur la campagne reconstruite.
- 114 tests réussis : topologie et moteur, les 100 certificats, densité supérieure à 300 dès le niveau 16, progression, couverture, interdépendance des faces et seuils de construction des 96 plateaux.
- `levels:validate` relit les 100 fichiers figés, vérifie leur égalité avec les définitions chargées par l’application et rejoue chaque certificat jusqu'au plateau vide.
- 4 parcours Chrome réussis : les scénarios précédents de rotation libre, erreur avec retour, rouge persistant, pincement et toucher élargi ; en plus, chargement du niveau 18 à 366 flèches et extraction réelle d’un corps dont la queue et la pointe sont sur des faces différentes. L’animation rapide est contrôlée avec l’horloge du navigateur dans le test de collision.
- TypeScript, ESLint et compilation de production réussis. Contrôle mobile à 390 × 844, sans débordement horizontal. Captures dans `.tmp/`, non versionnées.
- Rendu automatisé SwiftShader ; aucune mesure de FPS ni validation sur appareil Android réel. L'équilibrage humain des 100 niveaux reste à réaliser.
- Alertes de développement déjà documentées dans README.md ; aucun service distant déployé, aucun commit ou push effectué.

## Décisions

- GO de Christian pour les rectifications : niveau 18 avec une arête jaune entière, deux au maximum, et des chaînes qui imposent observation et rotation. Les fragments jaunes répartis sur toutes les arêtes sont abandonnés pour cette livraison.
- Les corps peuvent déjà s'étendre sur plusieurs faces indépendamment du nombre de continuations jaunes. Les dépendances croisées reposent aussi sur ces corps et sur les retraits qui ouvrent réellement d'autres trajets.
- Le générateur privilégie les coups déverrouillés par des coups précédents et le brassage graphique ne transforme plus un coup bloqué en sortie gratuite. Garde-fous : au plus 24 choix initiaux, chaîne d'au moins 12 flèches sur au moins trois faces, déblocages multiples et déblocages entre faces.
- Nouveaux tests observés en échec sur l'ancienne définition : 12 arêtes fragmentées au lieu d'une entière ; 86 choix initiaux au lieu d'au plus 24. Après correction, tous les contrôles passent.

- Retours de Christian : le remplissage par petites régions restait visuellement trop rangé. Les régions ne définissent plus la forme finale ; une étape de brassage échange des branches entre flèches et réorganise les extrémités, tout en préservant les dépendances et la solution.
- Interdire une pointe dirigée vers son propre corps initial. L'ancienne simulation retirait d'abord la queue et autorisait certaines formes ambiguës ; cette tolérance est abandonnée. Le test en U échoue sur l'ancien moteur (extraction autorisée à tort), puis passe après correction.
- Le garde-fou sur les empreintes irrégulières échoue sur l'ancienne définition rectangulaire. Seuil de livraison du niveau 18 : au moins 90 % d'empreintes irrégulières, directions sur les six faces, dépendances croisées, couverture conservée et certificat intégral.

- Correction du générateur de référence : l'ancien tri spatial des régions favorisait un sens unique et permettait de vider les faces à la suite. Approche abandonnée. La densité et le certificat seuls ne prouvaient pas l'interdépendance demandée.
- Générateur version 5 : plusieurs variantes de corps et de direction par région, sélection par dépendances satisfaites, continuations symétriques variées sur toutes les arêtes du cube. Garde-fous : quatre directions par face, graphe des faces fortement connexe, simulation d'une face isolée obligatoirement bloquée, puis certificat intégral.
- Test de non-régression exécuté sur l'ancien fichier : échec sur une direction absente ; réussite après restauration de la nouvelle définition. Les mesures sont dans le catalogue des niveaux.

- Version 0.4, GO de Christian : priorité à la couverture et aux parcours imbriqués, plutôt qu’au seul nombre de flèches. Le minimum de 300 reste compatible. Le niveau 18 est refait comme référence autour de 366 flèches ; les corps doivent réellement commencer et finir sur des faces distinctes pour certains tracés.
- Générateur de référence version 4 : partition de la surface dépliée, chemins hamiltoniens et ordre de résolution validé. Le remplissage complet est une métrique logique ; difficulté et plaisir de jeu restent à comparer humainement.
- Vitesse d’animation constante normalisée par la taille du cube, remplaçant le délai fixe par flèche. Aucune nouvelle dépendance.

- Version 0.3, GO de Christian : corrections de rotation, sensibilité sur tout le corps, erreur animée et tracés courts à plusieurs coudes. Trois grands plateaux représentatifs à essayer avant de renouveler les autres niveaux.
- TrackballControls fourni par Three.js remplace OrbitControls : pas de nouvelle dépendance, pas de maintien forcé de l'axe vertical et pas d'inertie résiduelle après relâchement. Le cadrage d'un indice reste disponible.
- Le moteur fournit le premier point de collision et la route à l'animation. L'échec ne modifie jamais le plateau logique ; la couleur est enregistrée uniquement après le retour.
- Sélection calculée en pixels sur les segments projetés, avec choix du tracé visible le plus proche : tolérance indépendante de la finesse graphique et sans sélection au travers du cube.
- Générateur d'essai version 3 dans `scripts/build-tangled-previews.ts` ; générateur de base version 2 indépendant dans `campaign-base.ts`. Les fichiers d'essai sont intégrés à la campagne et validés comme les autres définitions.

- 2026-11-05, retours validés et GO de Christian : 100 niveaux minimum remplacent la cible de 30 ; grands cubes de plus de 300 flèches dès le niveau 16. Les exigences mises à jour sont en tête du brief.
- Mesures des grands plateaux livrés : dix sorties initiales sur les moyens, six sur les difficiles et quatre sur les très difficiles ; chaînes de 32–88, 52–85 et 62–97 flèches respectivement. Ces valeurs seules ne définissent pas la difficulté humaine.
- Difficulté par vagues : plusieurs moyens, un difficile, retour à des moyens, puis un très difficile. Première proposition : défis aux multiples de 5 et très difficiles aux multiples de 10. Le classement reste à équilibrer humainement ; les certificats prouvent la résolution, pas la difficulté ressentie.
- Générateur version 2 avec seed dérivée du numéro, frontières de sortie opposées sur les niveaux moyens et dépendances entre faces sur les défis. Le générateur et les fichiers figés doivent rester identiques, contrôlés par `levels:validate`.
- Formes à marches et creux après le niveau 100 : préparation dans `docs/complex-surfaces.md`. Pas encore implémentées ; elles nécessitent une topologie de surface et des collisions concaves réelles.
- Pas de nouveaux atouts fictifs : seul l'indice fonctionne aujourd'hui. Les références visuelles restent privées et ne sont pas intégrées comme assets.

- 2026-11-05 : commencer par les bases et trois démonstrateurs, avec l'accord de Christian. Ne pas produire les 30 niveaux avant validation de la mécanique.
- Bandes dorées symétriques par segment d'arête ; autres bords = sorties explicites par convention V1. Proposition à valider visuellement.
- Corps discret : liste queue → pointe ; chaque pas retire la cellule de queue puis ajoute la prochaine cellule de route. Les autres flèches restent immobiles pendant l'extraction. La file parcourt donc uniquement le corps initial et la route de pointe ; toute collision avec un autre corps sur cette route bloque le mouvement avant animation.
- Le renderer projette les passages sur les arêtes avant interpolation afin de ne pas couper dans le volume du cube.
- Interface Vercel sobre et sombre suivant les consignes globales ; cube ivoire, flèches bleu nuit et continuations dorées suivant le brief. Aucun branding graphique définitif.
- Polices Geist livrées localement via npm : pas de téléchargement Google Fonts au build.
- TypeScript 6.0.3 : TypeScript 7 n'est pas encore accepté par typescript-eslint. ESLint 9 est conservé pour les plages de compatibilité des plugins Next.js ; migration à suivre. Webpack est utilisé pour dev/build après échec reproductible du worker CSS de Turbopack dans cet environnement Windows.
- Port local 3107 dédié : le port 3000 héberge déjà GéoFR, qui n'a pas été modifié.
- Pas de génération d'icônes de marque, de sauvegarde ou de monétisation factice. Sauvegarde et économie prévues au lot 2 et suivants.

## Suite

Faire comparer les nouveaux tracés des plateaux 16/20/100 à Christian avant généralisation, recevoir les icônes et ajuster l'équilibrage ; puis sauvegarde IndexedDB, progression et tour adaptées à 100 niveaux. Aucun téléphone Android réel n'a encore été testé. Les accès externes ne sont pas nécessaires à cette campagne locale.

- Dernier GO : durcir réellement le niveau 18 sans ajouter de bandes jaunes. Recomposition déterministe des branches et du graphe de dépendances (graine 180828), avec rejet des cycles, auto-collisions et directions insuffisamment représentées. Générateur de référence version 8. Les autres niveaux conservent leurs définitions.

- 6 novembre 2026, GO de Christian après avoir terminé le niveau 18 : généraliser les corrections aux autres niveaux, conserver le niveau 18 et les démonstrations, garder des paliers de difficulté. Les niveaux de comparaison 16/20/100 et le générateur de base ne servent plus de définitions à l'application. Générateur de campagne version 9 ; niveau 18 version 8 inchangée. Aucune nouvelle dépendance.
