# Cubelyo

Statut : actif — campagne de test de 100 niveaux, version 0.14.0.

Jeu de logique 3D de JavaChrist : libérer des flèches sur les six faces d'un cube, avec des trajets de sortie pouvant traverser plusieurs arêtes.

Brief : [CUBELYO_CAHIER_DE_TRAVAIL_CODEX.md](./CUBELYO_CAHIER_DE_TRAVAIL_CODEX.md).

## Firebase, Android et Vercel — 6 novembre 2026

- Christian crée le projet Firebase et active l’authentification anonyme ; paramètres attendus. Intégration préparée dans `src/features/cloud/`, `.env.local` local ignoré et `.env.example` documenté. Aucun projet Firebase réel ni déploiement distant effectué. Firebase reste désactivé par défaut.
- Sauvegarde anonyme par UID dans `players/{uid}/saves/prototype`. Copie locale conservée et import si aucun document distant, écritures regroupées avec transactions/révisions, conflits explicitement départagés sans addition de soldes. Pas de remplacement distant automatique pendant une partie. Réessai réseau/focus et pause/réactivation dans les réglages.
- Identité anonyme persistante sur le navigateur/installation ; ne fournit pas encore une identité récupérable entre appareils. Liaison à un compte et économie serveur restent à réaliser. Les sauvegardes de test ne certifient ni achats ni récompenses financières ; les autres collections sont refusées par les règles.
- Règles/index Firestore dans `firebase/`, commandes Firebase explicites sans alias de projet réel. Émulateurs limités au projet `demo-cubelyo`. Trois tests d’intégration Firebase et un parcours Chrome complet réussis : isolation, révisions, conflit, reprise après réseau coupé, export, effacement et suppression de l’identité. 123 tests unitaires et 15 parcours locaux du jeu réussis ; ESLint/TypeScript validés.
- Export JSON avec sauvegarde, UID/métadonnées de l’identité et document distant (sans jeton). Effacement confirmé du document puis du compte anonyme, puis de la copie locale ; pas de faux succès en cas d’échec. Synchronisation désactivée après effacement jusqu’à réactivation. Boutons des pages légales attendent le chargement des interactions avant d’être utilisables, correction vérifiée dans Chrome.
- Capacitor 8.6, projet Android créé avec identifiant proposé `fr.javachrist.cubelyo`, min SDK 24/target SDK 36. Bundle web local, sans `server.url`. Mise à jour web désactivée en natif ; plugins officiels Filesystem/Share pour l’export. Sauvegarde automatique Android désactivée. Icônes de modèle en attendant les assets définitifs ; aucune signature de publication.
- `android:sync` exporte vers `out/` et synchronise Capacitor ; `android:apk` compile aussi l’APK debug ; `android:open` ouvre Android Studio. Cette version de Next.js utilise `.next` comme intermédiaire même lors de l’export, donc compilations successives. Aucun essai physique Android effectué. Consignes : `docs/firebase-android.md`.
- `vercel.json` fixe `npm run build` pour inclure la génération des documents. Les paramètres Web publics sont figés à la compilation ; ni clé Admin ni secret store n’est requis pour cette sauvegarde de prototype.
- Documents légaux préparés pour modes local/Firebase, édition 0.2.0-pwa avec supplément Firebase seulement si activé. Éditions/variantes par empreinte conservées, `legal/current.json` sélectionne l’édition du build. Les paramètres de production, la région et les clauses restent à relire ; aucune approbation juridique ajoutée.

## Legal Kit — 6 novembre 2026

- GO pour l’intégration locale de JavaChrist Legal Kit v0.1, commit `b3345709d0ae1a3c5f8d358dfd50a2cd9cb2487c`. Sources et adaptations suivies dans `legal/README.md`. Version documentaire `0.1.0-pwa`, état brouillon, aucune approbation juridique renseignée.
- Cinq pages françaises sans compte : `/confidentialite`, `/conditions-utilisation`, `/conditions-vente`, `/mentions-legales`, `/droits-rgpd`. Liens dans les réglages et navigation entre documents. Cadre pastel existant conservé ; rendu Markdown limité sans HTML brut. Pages de brouillon non indexables.
- Identité juridique et médiateur du kit conservés. Configuration adaptée au fonctionnement local réel : sauvegarde navigateur, sans compte, publicité, analytics ou paiement actif. Hébergement/URL de production, public admis et revue des clauses restent à confirmer avant publication.
- `npm run legal:generate` exporte les dix offres depuis `src/features/shop/catalog.ts`, toutes prévues et non commercialisées, puis génère les documents. Exécuté également avant compilation. Les prix d’aperçu PWA ne sont pas des tarifs contractuels stores. L’empreinte d’une édition existante empêche un écrasement avec une configuration différente.
- Validation : 15 parcours Chrome réussis, puis les deux parcours légaux rejoués après correction du titre de confirmation ; export JSON vérifié et autre stockage conservé après effacement. TypeScript, ESLint et compilation réussis. Contrôle production des documents sur mobile, paysage et ordinateur, sans erreur de page ni débordement horizontal.
- Rapport, configuration figée et catalogue exporté sont archivés dans `legal/generated/`, hors répertoire public ; seules les cinq pages sont exposées. Le kit bloque encore la publication sur l’URL locale HTTP. Le nombre de points du rapport n’est pas une validation juridique.
- Droits RGPD : export JSON réel de la sauvegarde et effacement confirmé dans la modale commune. Suppression limitée à la clé Cubelyo de ce navigateur, sans effacer les autres apps ni les fichiers exportés. Aucun parcours de compte serveur ou réimportation annoncé.

## Boutique française — 6 novembre 2026

- GO pour les prix, quantités et disposition des captures : quatre offres en cartes colorées à cadres dorés, boutons verts en relief et six lots de pièces en grille de trois colonnes. Auvent décoratif bleu et blanc. Libellés français et prix au format français.
- Pack de départ : 1,99 € pour 2 indices, 2 gommes et 2 baguettes. Pack sans publicité : 9,99 € pour supprimer les publicités imposées, avec 3 indices et 3 gommes. Sans publicité seul : 8,99 €. Pack spécial : 8,99 € pour 4 500 pièces, 3 indices et 3 gommes.
- Pièces : 1 500 / 1,99 € ; 7 500 / 8,99 € ; 20 000 / 14,99 € ; 45 000 / 34,99 € ; 80 000 / 59,99 € ; 220 000 / 99,99 €.
- Catalogue unique dans `src/features/shop/catalog.ts`, utilisé par la boutique et les deux modales promotionnelles. Pas de duplication des prix ou des quantités. Le tarif de continuation avec des pièces reste à définir.
- Aperçu PWA uniquement : tous les boutons de prix sont désactivés et aucune offre ne crédite de pièce, d'atout ou de droit publicitaire. Paiements futurs exclusivement sur les stores ; aucun SDK de facturation ni fournisseur publicitaire actif.
- Contrôle Chrome du catalogue : tous les prix et quantités, trois colonnes sur mobile et ordinateur, correspondance des modales et absence de modification des soldes. Illustrations en CSS/Lucide réutilisant le coffre existant ; aucune dépendance ajoutée.

## Accueil, étoiles et atouts — 6 novembre 2026

- GO de Christian : véritable page d'arrivée, chemin sinueux de 100 boutons ronds en relief, bouton Jouer, navigation Boutique / Accueil / Tour, réglages, étoiles, pièces et barre de progression. La barre compte les niveaux terminés ; son objectif bonus reste explicitement à définir.
- Tour illustrée : château cylindrique sur fond de ciel et nuages, portes, balcons et coffres en relief ; 100 étages qui se parcourent en montant. La montgolfière marque le nombre de premières victoires et la vue se centre sur cette position à l'ouverture.
- En-tête Tour Cubelyo avec retour et bouton d'information. Aide au gabarit commun : terminer des niveaux, monter dans la tour, ouvrir les coffres. Les récompenses restent celles du prototype : coffre tous les cinq étages, attribution locale unique, progression permanente.
- Recentrage responsive : la vue suit la position du joueur après redimensionnement du cadre, notamment lors d'une rotation de téléphone. Régression reproduite à l'étage zéro, puis corrigée avec observation de la taille du cadre ; position entièrement visible sur les formats testés.
- Contrôle Chrome de la tour à l'étage 17 et au sommet : ordre des étages, position visible de la montgolfière, coffres disponibles/verrouillés, défilement et dimensions de l'aide. Les anciennes vérifications de coffre/rechargement restent valides.
- Raccourcis latéraux de l'accueil : coffre « Offre de départ » et ticket % « Offre du moment » à gauche, lien direct Tour à droite. Les offres ouvrent une modale ; les packs de départ et spécial reprennent les prix et contenus du catalogue, sans achat actif.
- Navigation basse réordonnée à la demande de Christian : Boutique à gauche, Accueil au centre et Tour à droite. Gabarit des modales compacté, illustrations promotionnelles et aide adaptées ; les contenus longs défilent dans le cadre.
- Toutes les modales partagent le même cadre bleu, un titre et une croix fixes, une largeur maximale de 320 px et une hauteur maximale de 440 px ajustées au viewport. Le contenu défile à l'intérieur, sans déplacer le titre ni la fermeture. La fermeture clavier restitue le focus au bouton appelant.
- Contrôle de non-régression du gabarit : échec observé entre Réglages et Vos étoiles avant correction ; dimensions et position de croix identiques après correction pour Réglages, étoiles et deux promotions, plus contrôle Confidentialité. Vérifié en portrait, paysage et ordinateur.
- Accueil épuré à la demande de Christian : suppression du slogan, du grand titre promotionnel, du titre et de la phrase au-dessus du chemin, ainsi que du texte sous Jouer/Reprendre. La surface libérée profite au chemin.
- Sens du chemin corrigé : niveau 1 en bas, niveaux suivants au-dessus, raccords courbes adaptés et centrage conservé sur le niveau courant. Régression vérifiée dans Chrome : le niveau 2 était en dessous du niveau 1 avant correction.
- Progression verrouillée, avec accès test libre activable sur l'accueil ou dans les réglages. Cet accès ouvre les niveaux mais continue à consommer les étoiles. Une partie sauvegardée peut être reprise même si la réserve d'étoiles est vide.
- Réserve de cinq étoiles ; une étoile débitée au démarrage d'une nouvelle partie ou d'un redémarrage. Reprise sans débit. Recharge d'une étoile toutes les 30 minutes jusqu'à cinq, calculée aussi à la réouverture après une fermeture. La fraction de recharge est conservée.
- Trois cœurs par cube : un perdu après le retour d'une tentative bloquée. Les anciens records de réussite sont affichés comme des médailles pour distinguer la notation de la réserve d'étoiles. Score conservé : 10 points par flèche libérée.
- À zéro cœur : continuer le même cube avec des pièces, tarif non défini. Bouton désactivé et tarif explicite « à définir » ; aucun prix inventé. Le mécanisme de continuation conserve les flèches déjà retirées et ne consomme pas d'étoile. Une nouvelle tentative coûte une étoile.
- Atouts : Indice (sortie légale révélée), Gomme (une flèche choisie, même bloquée), Baguette (jusqu'à trois sorties successivement légales). Trois exemplaires de chaque au départ pour les essais ; stocks réels décrémentés. Gomme débitée seulement lors de la suppression ; annuler sa sélection ne coûte rien. L'indice actif n'est pas refacturé sur le même plateau.
- Achats uniquement sur les stores ; prix et contenus du catalogue validés pour l'aperçu. La PWA est réservée aux tests et ne contient aucun paiement actif. L'ancien achat d'indice pour 50 pièces est retiré. Les pièces servent à la future continuation.
- Réglages persistants : musique d'ambiance synthétisée (off par défaut), effets sonores et vibrations si le navigateur les permet. Aucun nouvel asset externe ni nouvelle dépendance.
- Sauvegarde sous la clé existante `cubelyo.profile.v1`, schéma interne version 2. Migration des anciennes pièces, indices, records, coffres et partie en cours. Une ancienne partie entamée est reprise sans débit rétroactif. La réserve initiale et les nouveaux atouts sont ajoutés à la migration.
- Règles de la tour conservées : un étage par niveau terminé distinct, première victoire et coffres attribués une fois localement. Montants encore provisoires du prototype ; une future économie connectée et les achats des stores nécessiteront une validation serveur.
- Vérifications : 123 tests unitaires ; treize parcours Chrome couvrant accueil/verrouillage/recharge/reprise, réglages persistants, gomme et baguette, absence de paiement PWA, ainsi que les parcours 3D et coffres précédents. Contrôle de position du bouton Jouer au-dessus de la navigation mobile.

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
- Géométries immobiles instanciées ; une flèche animée séparément. Indice, Gomme et Baguette sont les atouts autour du cube. Sélection libre des niveaux et sauvegarde locale pour les essais.
- Application locale Next.js/React/TypeScript/Three.js. Icônes définitives attendues ; Lucide temporaire. Aucun service externe, publicité, paiement ou compte configuré. Aucun commit ni push.
- Formes complexes après le niveau 100 : toujours au stade de conception, non réalisées par cette généralisation.

## Validation courante — version 0.14.0, 6 novembre 2026

- Régression démontrée : les contrôles de campagne renforcés échouent sur 96 anciennes définitions, puis passent sur la campagne reconstruite.
- 123 tests réussis : topologie et moteur, les 100 certificats, densité supérieure à 300 dès le niveau 16, progression, couverture, interdépendance des faces et seuils de construction des 96 plateaux.
- `levels:validate` relit les 100 fichiers figés, vérifie leur égalité avec les définitions chargées par l’application et rejoue chaque certificat jusqu'au plateau vide.
- 13 parcours Chrome réussis : les scénarios précédents de rotation libre, erreur avec retour, rouge persistant, pincement et toucher élargi ; en plus, chargement du niveau 18 à 366 flèches et extraction réelle d’un corps dont la queue et la pointe sont sur des faces différentes. L’animation rapide est contrôlée avec l’horloge du navigateur dans le test de collision.
- TypeScript, ESLint et compilation de production réussis. Contrôle production aux formats 360 × 780, 430 × 932, 844 × 390 et 1440 × 1000 : aucune erreur de page ni débordement horizontal ; bouton Jouer accessible au-dessus de la navigation sur les vues portrait/ordinateur. Captures supplémentaires à 390 × 844. Captures dans `.tmp/`, non versionnées.
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

- 6 novembre 2026, décisions validées : étoiles globales (5 max, débit au démarrage, recharge 30 min), trois cœurs par partie, continuation avec pièces à tarif ultérieur ; achats réels exclusivement stores, PWA uniquement tests. Les prix, offres et objectif bonus de la barre ne sont pas inventés. Les définitions des cubes sont conservées.
