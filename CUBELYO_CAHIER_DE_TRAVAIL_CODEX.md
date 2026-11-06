# Cubelyo — Cahier de travail pour Codex

## Boutique validée — 6 novembre 2026

Reprendre la disposition et les prix des captures en français : Pack de départ 1,99 € (2 indices, 2 gommes, 2 baguettes), Pack sans publicité 9,99 € (3 indices, 3 gommes et suppression des publicités imposées), Sans publicité 8,99 €, Pack spécial 8,99 € (4 500 pièces, 3 indices, 3 gommes). Lots : 1 500 pièces / 1,99 €, 7 500 / 8,99 €, 20 000 / 14,99 €, 45 000 / 34,99 €, 80 000 / 59,99 €, 220 000 / 99,99 €. Cartes colorées, cadres dorés, boutons verts et grille de trois colonnes. Prix affichés uniquement en aperçu PWA ; achats réservés aux futurs stores.

## Tour illustrée validée — 6 novembre 2026

GO pour une refonte visuelle inspirée des références privées : tour avec portes et balcons, coffres en relief, ciel et nuages, montgolfière repérant le joueur, progression vers le haut. Retour et bouton d'information ouvrant une explication au gabarit commun. Conserver les règles existantes de progression permanente et d'attribution unique des récompenses.

## Accueil et économie validés — 6 novembre 2026

Page d'arrivée avec chemin de niveaux en boutons ronds 3D, verrouillage progressif et accès test libre. Haut : réglages, réserve de cinq étoiles, pièces, barre avec objectif bonus à définir. Bas : Accueil / Tour / Boutique. Une étoile consommée au démarrage d'une nouvelle partie ; reprise gratuite ; recharge une étoile toutes les 30 minutes jusqu'à cinq. Chaque partie offre trois cœurs. À zéro cœur, les pièces permettront de continuer ce même cube ; tarif à définir. Réaliser maintenant Indice, Gomme et Baguette. Prix et offres définis plus tard ; paiements exclusivement sur les stores. PWA uniquement pour les tests, sans paiement actif. Ces règles remplacent les décisions antérieures de redémarrage gratuit et d'achat d'indices à prix proposé.

## Interface et vies validées — 6 novembre 2026

GO de Christian : écran lumineux, niveau/difficulté, score, trois vies par niveau, boutons de retour/pause et atouts, tour de 100 étages, écran de victoire et sauvegarde locale. Chaque tentative bloquée coûte une vie ; à zéro, choix entre recommencer gratuitement avec trois vies et revenir aux niveaux. Cette décision remplace le fonctionnement antérieur sans vies. Les règles de zoom et rotation gestuels restent inchangées. Proposition de score retenue à l'implémentation : 10 points par flèche ; étoiles selon les vies restantes. Les montants sont ajustables dans le module de progression.

## Généralisation validée par Christian — 6 novembre 2026

Christian a terminé le niveau 18 et donné son GO pour appliquer sa construction aux autres niveaux. Conserver cette définition du niveau 18 et les démonstrations 1–3. Reconstruire les niveaux 4–100 restants avec des tracés imbriqués, des directions variées et des dépendances entre faces ; limiter les sorties faciles selon le palier. Garder les vagues moyen / difficile / très difficile et des arêtes jaunes rares, entières. La résolution est vérifiée automatiquement ; l'équilibrage humain reste à faire.

## Mise à jour validée par Christian — 5 novembre 2026

Version 0.5 : terme retenu « casse-tête ». Une bande jaune doit être une ligne continue occupant une arête entière. Pour le niveau 18 : une arête, deux au maximum ; la définition de référence utilise une seule arête. La difficulté doit venir de chaînes de déblocage et de bifurcations entre faces, obligeant à observer et tourner le cube. Un grand nombre de clics disponibles d'emblée n'est pas un critère de difficulté.

Complément 0.4.3 : éviter le dessin en petits blocs réguliers ; les chemins doivent s'imbriquer avec des contours et longueurs variés. Interdire toute sortie passant dans le corps initial de sa propre flèche, même si la queue aurait pu libérer la case. Ces formes sont rejetées à la génération et à la validation des niveaux.

Correction 0.4.1 : les flèches doivent être orientées dans les quatre directions sur chaque face et imposer des blocages croisés. Un niveau de référence n'est pas acceptable s'il se résout en vidant simplement les faces successivement. Vérifier le graphe des dépendances et simuler un joueur restant sur une seule face ; aucune face ne doit pouvoir être intégralement vidée de façon isolée au départ.

Référence version 0.4, validée par Christian : refaire d'abord le niveau 18 autour de 366 flèches mieux imbriquées, contre 494 petits tracés auparavant. Conserver le minimum de 300, mais mesurer aussi la couverture de la grille. Certains corps doivent commencer sur une face et se terminer sur une autre avant tout mouvement. Rotation plus vive et extractions plus rapides, avec une vitesse constante plutôt qu'une durée fixe par flèche.

Complément validé pour la version 0.3 : rotation libre sans arrêt aux pôles ; zone de toucher élargie sur l'ensemble des segments et de la queue à la pointe ; flèches courtes à plusieurs changements de direction et tracés imbriqués. Lors d'une tentative bloquée, la flèche avance jusqu'au premier obstacle, revient à sa place puis devient rouge. Le rouge reste acquis jusqu'à sa disparition. Trois grands plateaux d'essai sont livrés avant généralisation aux 100 niveaux.

Les décisions suivantes remplacent les valeurs incompatibles du brief initial ci-dessous :

- Au moins **100 niveaux**, avec grands cubes de **plus de 300 flèches dès le niveau 16**. Les anciennes cibles de 30 niveaux et de 64–80 flèches ne sont plus applicables.
- Difficulté **par vagues** : plusieurs niveaux moyens, un difficile, retour à des niveaux moyens, puis un très difficile. La taille du cube et la difficulté logique sont deux paramètres distincts.
- Après le niveau 100, extension vers des volumes à marches, décrochements et creux ; ces formes ne sont pas encore réalisées dans le prototype.
- Faces légèrement transparentes ; flèches arrière claires et atténuées, flèches avant contrastées et seules sélectionnables.
- Flèches plus fines et extraction environ trois fois plus rapide que le premier prototype.
- Une flèche tentée et bloquée devient rouge et **reste rouge jusqu'à sa disparition**, même après un indice ou la sortie d'une autre flèche.
- Bandes jaunes exactement sur l'arête géométrique, pouvant occuper toute sa longueur. Elles imposent la continuation du trajet sur la face voisine.
- Rotation à un doigt, zoom par pincement à deux doigts ; souris et molette sur ordinateur. Autour du cube, seuls les atouts restent disponibles : pas de boutons de zoom, recentrage, repérage ou redémarrage.
- La sélection libre des niveaux reste un outil de test de cette livraison ; progression, tour et économie seront recalées sur 100 niveaux lors de leur implémentation.

Captures fournies par Christian : références privées de mécanique et de rendu, pas des ressources graphiques réutilisables dans le jeu.

Version 1.0 — 5 novembre 2026
Porteur : Christian / JavaChrist. Assistant de conception : Léo. Réalisation : Codex.

## 1. Mission et manière de travailler

Développer un véritable jeu de logique 3D, soigné, jouable au tactile et à la souris, d’abord en PWA puis sur Android. Livrer un projet maintenable, des niveaux résolubles, une interface complète et une architecture prête pour les publicités et achats intégrés. Ce document constitue le brief de référence pour travailler en autonomie.

Commencer par inspecter le dépôt et ses instructions. Réutiliser le travail existant s’il existe ; ne pas écraser des fichiers ou configurations sans en comprendre le rôle. Sur un projet neuf, créer la structure ci-dessous. Choisir les détails réversibles en autonomie, consigner les décisions et avancer. Ne pas interrompre Christian pour chaque couleur, composant ou nom de fichier.

L’autonomie ne dispense pas de signaler une ambiguïté qui changerait la mécanique du jeu. Produire un petit prototype concret permettant de trancher, plutôt qu’un questionnaire abstrait. Ne jamais annoncer un test, un déploiement ou une intégration comme réalisés sans preuve.

### Statut des décisions

**Validé par Christian :**
- Nom retenu : Cubelyo. Disponibilité sur les stores vérifiée par Christian ; disponibilité juridique des marques non établie.
- Éditeur JavaChrist ; support `support@javachrist.fr`.
- Adresse prévue `https://cubelyo.javachrist.fr`, sans achat de domaine dédié.
- Puzzle de flèches tracées sur la surface d’un cube, qui glissent pour sortir si leur passage est libre.
- Cube véritablement 3D, manipulable sur ses six faces dès le premier niveau.
- Petit cube au début, puis augmentation de la taille et de la complexité.
- Selon la difficulté, le trajet de sortie traverse une ou plusieurs arêtes et plusieurs faces. Un obstacle sur une face ultérieure bloque toute la sortie.
- 30 niveaux pour commencer, difficulté croissante.
- Tour de progression liée aux niveaux terminés : plus le joueur monte, plus les lots deviennent intéressants. Ce n’est pas un second mode à risque.
- Jeu avec publicités et achats intégrés.
- Développement confié à Codex pour ce projet.
- Outils demandés : Firebase et Vercel.

**Valeurs de travail proposées dans ce document, modifiables après essais :**
- Direction artistique, navigation, paliers, quantités de récompenses, taille exacte des grilles, fréquence des pubs, catalogue et prix des achats.
- Français par défaut et anglais disponible.
- Essais illimités en mode principal, sans chrono et sans système de vies.
- PWA de test avant Android ; iOS préparé architecturalement, publication hors première livraison.

Ne pas présenter ces valeurs proposées comme ayant été explicitement approuvées par Christian.

## 2. Identité et périmètre

Titre affiché : **Cubelyo**. Sous-titre envisagé : **Puzzle 3D**.
Pitch : « Tourne le cube, trouve le passage et libère toutes les flèches. »
Public : amateurs de puzzles accessibles puis exigeants. Ne pas déclarer une cible enfants ou une classification d’âge sans décision et analyse des fonctionnalités réelles.

Livraison initiale : accueil, sélection des niveaux, partie 3D, tutoriel, résultats, tour et récompenses, boutique, réglages et informations légales, sauvegarde locale, connexion facultative pour synchronisation, 30 niveaux validés. Préparer les services réels de monétisation en mode test ; leur disponibilité commerciale dépend des comptes et produits configurés.

Hors périmètre initial : multijoueur, classement mondial, chat, abonnement, génération par IA en direct, tour avec mise ou perte de gains, achats aléatoires, nouveau back-office généraliste, intégration aux autres projets Firebase de Christian.

## 3. Stack et outillage

Base proposée : Next.js App Router, React, TypeScript strict, Tailwind CSS, Three.js avec React Three Fiber et contrôles adaptés. Le rendu 3D est chargé côté client, sans dépendance à WebGL lors du rendu serveur. Choisir des versions stables compatibles au démarrage, vérifier les documentations officielles actuelles et conserver le lockfile ; ne pas copier aveuglément un numéro de version du brief.

- Git et GitHub : dépôt indépendant proposé `cubelyo`, uniquement si aucun dépôt n’est déjà fourni.
- Firebase : projet dédié à Cubelyo ; Auth, Firestore, Functions serveur pour économie/achats, App Check selon environnement. Storage seulement si des médias le justifient.
- Vercel : application Next.js et PWA ; previews isolées de la production.
- IndexedDB : parties et progression locale avec versionnement et migrations.
- Capacitor : enveloppe Android après validation PWA ; prévoir une stratégie de bundle web local avec API distante, à documenter et tester. Le site Next.js reste hébergé sur Vercel. Ne pas supposer que les routes serveur fonctionnent dans un export statique.
- AdMob sur Android : intégration native compatible avec Capacitor, gestion de consentement appropriée ; vérifier la maintenance du plugin avant sélection.
- Google Play Billing : achats Android validés côté serveur. Pour iOS futur, adaptateur StoreKit/App Store prévu sans prétendre qu’il est implémenté.
- Vitest pour moteur et économie ; Playwright pour parcours web ; émulateurs Firebase pour règles et fonctions ; Android Studio pour tests natifs.

Pas d’IA nécessaire pendant une partie. Pas d’envoi des coups à un LLM. Le moteur est déterministe et fonctionne hors ligne.

## 4. Règle centrale : trajet de sortie sur plusieurs faces

### 4.1 Objets à distinguer

1. **Corps de flèche** : tracé visible avec une queue, des segments orthogonaux et une pointe. Les virages du corps ne suffisent pas à décrire le trajet futur de la pointe.
2. **Route de sortie** : trajet que la pointe doit suivre pour quitter le puzzle ; il peut continuer au-delà d’une arête sur une autre face.
3. **Arête de continuation** : jonction imposant de poursuivre sur la face voisine. La ligne jaune des captures de référence illustre cette contrainte ; ce n’est pas une flèche ni un bonus.
4. **Sortie autorisée** : bord où la flèche peut finalement quitter le cube et disparaître.

Une surface de cube est fermée : traverser systématiquement toutes les arêtes sans sortie explicite créerait une boucle. Le niveau doit donc préciser les continuations et les sorties. Ne pas laisser ce choix dépendre de la caméra ou de la face visible.

### 4.2 Convention opérationnelle proposée pour lever cette ambiguïté

Chaque niveau définit, par segment d’arête et sens de traversée, une règle `continue` ou `exit`. Un segment `continue` est signalé clairement par une bande dorée cohérente sur les deux faces voisines. Un segment `exit` laisse la flèche décoller dans la direction locale après le bord. Un niveau peut utiliser une bande sur toute une arête, mais stocker les segments permet des niveaux plus précis.

La règle est commune à toutes les flèches qui rencontrent ce segment dans ce sens. Aucune sortie cachée propre à une flèche. Les deux sens d’une arête peuvent être configurés séparément uniquement si le visuel l’explique ; préférer des règles symétriques en V1.

**Cette convention est un choix d’implémentation proposé, à démontrer dans le prototype.** Si les captures ou un retour de Christian indiquent une autre convention, adapter cette couche sans refaire tout le moteur. Le comportement validé à préserver est : une sortie peut nécessiter plusieurs faces et tout son passage doit être libre.

### 4.3 Déroulement d’un toucher

- Détecter un tap sur une flèche visible, distinct d’un glissement de rotation.
- Calculer sa route complète à partir de la pointe et de sa direction dans le repère local de la face.
- À chaque arête `continue`, changer de face et transporter correctement la direction et les coordonnées.
- Contrôler les cellules et segments parcourus, sur toutes les faces, jusqu’à `exit`.
- Contrôler aussi le déplacement du corps pendant son extraction : pas de traversée d’un autre tracé pendant l’animation. Définir précisément cette occupation dans le modèle discret.
- Si un autre corps occupe le passage, bloquer sans retirer la flèche ni consommer d’indice ou de pièce. Retour visuel bref et vibration facultative.
- Si la route est libre, animer le glissement du corps suivant la route et la sortie finale, puis le supprimer du plateau.
- Pendant une extraction, sérialiser les actions de jeu pour éviter deux sorties qui se contredisent ; la rotation peut rester possible si stable.
- Une boucle sans sortie est un niveau invalide, détecté à la compilation des niveaux.

Cas pédagogique : A atteint une bande dorée, poursuit sur la face droite et rencontre B. A reste en place. Après libération de B, A peut traverser l’arête puis sortir. Plus tard : A traverse deux ou trois arêtes ; un obstacle sur la troisième face bloque A dès le départ.

### 4.4 Géométrie et sélection

Six faces nommées `front/back/left/right/top/bottom`, repères locaux orthonormés documentés, grille NxN par face, coordonnées entières. Une fonction pure assure les passages de bord et leur transformation inverse. Aucun calcul logique fondé sur les pixels ou l’orientation de la caméra.

Tracés orthogonaux sans intersections ambiguës. Si deux chemins se croisent, considérer le croisement comme occupé : aucun passage dessus/dessous en V1. Définir une propriété unique des cellules de bord pour éviter les collisions comptées deux fois. Une petite épaisseur de rendu ne modifie pas la règle discrète.

Le raycast sélectionne uniquement les objets visibles au premier plan ; pas de sélection à travers le cube. Zones de toucher élargies sans recouvrir abusivement les voisines. Accroche douce pour la rotation, zoom borné, bouton recentrer. Après rotation, aucun tap involontaire.

## 5. Expérience de partie

1. Accueil → Continuer ou Jouer.
2. Chargement du niveau et reprise éventuelle de la sauvegarde.
3. Vue de trois faces au départ ; les six sont accessibles par rotation.
4. Le joueur observe, tourne et touche les flèches qu’il pense libérables.
5. Chaque sortie réussie réduit le compteur « Flèches restantes ».
6. Quand il reste zéro flèche : victoire, sauvegarde, récompense unique, montée de la tour.
7. Écran de résultat : niveau terminé, pièces gagnées, progression du palier, bouton Niveau suivant et retour aux niveaux.

Pas de chrono en mode principal. Pas d’échec définitif ni d’énergie. Le bouton Recommencer demande confirmation dans une modale et conserve les achats et récompenses déjà acquis. Rejouer un niveau ne redonne pas les récompenses de première réussite.

Tutoriel interactif : niveau 1 pour toucher ; niveau 2 pour tourner ; premier niveau avec bande dorée pour les continuités ; premier niveau avec deux arêtes pour inspecter toute la route. Textes courts, le joueur effectue réellement l’action.

## 6. Les 30 niveaux

Le tableau est une cible de conception, pas une autorisation de livrer 30 variantes mécaniquement identiques. NxN désigne la grille de chaque face ; ajuster le cadrage pour conserver la lisibilité. Les nombres de flèches sont des fourchettes. Les arêtes indiquent le maximum franchi par certaines routes de sortie, pas par toutes.

| Niveau | Grille | Flèches cibles | Arêtes max | Intention |
|---|---|---|---|---|
| 1 | 3x3 | 6–8 | 0 | Toucher, sortie évidente, toutes les faces présentes |
| 2 | 3x3 | 8–10 | 0 | Apprendre la rotation |
| 3 | 3x3 | 10–12 | 0 | Premier blocage simple |
| 4 | 3x3 | 10–14 | 0 | Libérer un passage pour une autre flèche |
| 5 | 3x3 | 12–16 | 0 | Synthèse découverte, premier coffre |
| 6 | 4x4 | 14–18 | 0 | Cube agrandi et tracés plus longs |
| 7 | 4x4 | 16–20 | 1 | Première continuation dorée guidée |
| 8 | 4x4 | 18–22 | 1 | Obstacle sur la deuxième face |
| 9 | 4x4 | 20–24 | 1 | Plusieurs continuations indépendantes |
| 10 | 4x4 | 22–26 | 1 | Synthèse de deux faces |
| 11 | 5x5 | 24–30 | 1 | Augmenter la densité |
| 12 | 5x5 | 26–32 | 1 | Chaînes de dépendances |
| 13 | 5x5 | 28–34 | 2 | Première route avec deux arêtes, guidée |
| 14 | 5x5 | 30–36 | 2 | Obstacle au-delà de la deuxième arête |
| 15 | 5x5 | 32–38 | 2 | Synthèse intermédiaire |
| 16 | 6x6 | 34–42 | 2 | Cube agrandi, garder de l’espace visuel |
| 17 | 6x6 | 36–44 | 2 | Dépendances entre plusieurs faces |
| 18 | 6x6 | 38–46 | 2 | Niveau difficile avec routes lisibles |
| 19 | 6x6 | 40–48 | 2 | Multiples groupes à débloquer |
| 20 | 6x6 | 42–50 | 2 | Synthèse avancée |
| 21 | 7x7 | 44–54 | 3 | Première route avec trois arêtes |
| 22 | 7x7 | 46–56 | 3 | Observer une face cachée avant de jouer |
| 23 | 7x7 | 48–58 | 3 | Longues chaînes de libération |
| 24 | 7x7 | 50–60 | 3 | Mélanger sorties courtes et longues |
| 25 | 7x7 | 52–62 | 3 | Grand palier de progression |
| 26 | 8x8 | 54–66 | 3 | Cube expert, zoom utile |
| 27 | 8x8 | 56–68 | 3 | Plusieurs chaînes reliées |
| 28 | 8x8 | 58–70 | 3 | Densité et anticipation |
| 29 | 8x8 | 60–74 | 3 | Puzzle expert varié |
| 30 | 8x8 | 64–80 | 3 | Finale, meilleur coffre et thème débloqué |

La difficulté doit venir des dépendances et des routes, pas seulement du nombre de flèches. Ne pas atteindre une fourchette au prix de tracés illisibles ou d’un niveau impossible. Au-delà de trois arêtes : extension future possible, moteur sans limite arbitraire hormis détection de boucle et borne de sécurité.

### Fabrication et validation

Produire un générateur déterministe avec seed et/ou un outil interne de construction, puis figer les 30 définitions versionnées. Construire les niveaux par opérations qui préservent une solution, ou effectuer une recherche exhaustive/dirigée de solution. Chaque niveau livré contient un certificat de solution rejouable. Le solveur utilise les mêmes règles que le jeu, sans dépendance au renderer.

Vérifier : géométrie valide, flèches disjointes, sorties existantes, absence de boucle, route conforme au nombre d’arêtes attendu, au moins un coup légal à chaque étape de la solution, plateau entièrement vidé. Les niveaux avec plusieurs arêtes doivent comporter de vrais blocages sur des faces ultérieures, pas seulement une animation décorative.

Enregistrer : nombre de coups disponibles initialement, profondeur des dépendances, longueur des routes et répartition des faces. Jouer manuellement les transitions 1/7/13/21 et les niveaux 18/30. Ne pas générer 30 niveaux avant d’avoir validé le prototype de continuation.

## 7. Tour et économie proposées

La tour est une visualisation des **30 niveaux principaux terminés** : un étage par première réussite. Aucun puzzle séparé, aucune mise, aucun retrait des gains en cas de tentative bloquée.

Récompense de première réussite : `20 + 2 × (numéro du niveau − 1)` pièces. Rejouer : aucune pièce supplémentaire en V1. Stock initial proposé : 3 indices, 0 pièce.

| Étage atteint | Bonus additionnel proposé |
|---|---|
| 5 | 60 pièces + 1 indice |
| 10 | 120 pièces + 2 indices |
| 15 | 200 pièces + 3 indices |
| 20 | 300 pièces + 4 indices |
| 25 | 450 pièces + 5 indices |
| 30 | 650 pièces + 6 indices + apparence exclusive « Sommet » |

Lots fixes annoncés à l’avance, sans tirage aléatoire. Réclamation par bouton Ouvrir le coffre ; une seule fois par compte/profil. Rechargement, double clic ou synchronisation ne doivent jamais dupliquer un lot. Le prochain lot et la distance jusqu’à lui restent visibles.

Indice : met en évidence une flèche légalement libérable, y compris après plusieurs arêtes. L’aide n’invente pas une sortie et ne supprime pas un obstacle. Un seul indice actif à la fois ; ne pas facturer à nouveau le même indice tant que le plateau n’a pas changé. Prix proposé : 50 pièces. Aucun achat si stock ou solde insuffisant ; afficher une modale avec les possibilités réelles.

## 8. Publicités et achats intégrés

Les paramètres suivants sont proposés ; centraliser dans une configuration versionnée et prévoir un mode test. Ne jamais insérer un paiement fictif donnant l’impression d’un vrai achat.

### Publicités

- Interstitiel uniquement après résultat/transition, toutes les 3 premières réussites au maximum ; aucun pendant les cinq premiers niveaux ; intervalle minimal proposé de 120 secondes.
- Aucune pub pendant la manipulation, le chargement ou une modale de consentement.
- Pub récompensée volontaire : obtenir 1 indice ; plafond proposé de 5 par jour, calculé côté serveur pour l’économie connectée.
- Échec de chargement ou absence de réseau : continuer à jouer ; ne rien accorder sur simple fermeture de vidéo.
- Android : SDK natif, unités de test jusqu’à activation réelle, consentement avant requêtes selon les exigences applicables.
- PWA : aucune émulation trompeuse d’AdMob. En développement, adaptateur de test clairement identifié et inaccessible en production. En production web sans fournisseur, masquer les boutons de récompense publicitaire indisponibles.
- Les vidéos JavaChrist sont une extension facultative via un adaptateur distinct vers JavaChrist-Promotions, si une API est fournie. Elles ne constituent pas automatiquement des pubs rémunérées AdMob.
- Le retrait des pubs supprime les interstitiels et futures bannières, y compris les promotions imposées. Les vidéos récompensées restent facultatives et expliquées.
- Pas de bannière dans la première version ; prévoir un emplacement sûr si Christian en demande une.

### Boutique

| Produit logique | Type | Contenu proposé |
|---|---|---|
| `remove_ads` | Achat unique non consommable | Suppression durable des publicités automatiques |
| `hints_10` | Consommable | 10 indices |
| `hints_30` | Consommable | 30 indices |

Pas de prix figé dans le brief : afficher prix et devise fournis par le store. Pour la maquette, libellé « Bientôt disponible » tant que les produits ne sont pas configurés, sans prix fictif ni bouton d’achat actif.

Séparer `BillingProvider`, `AdsProvider`, `ConsentProvider`, `SaveProvider`. Google Play pour Android ; iOS futur via StoreKit ; aucun lien de paiement externe activé par défaut dans les versions stores. Les paiements web Mollie ne font pas partie de la V1 demandée ; ils peuvent être ajoutés sur décision ultérieure.

Validation serveur du package, du produit, de l’état d’achat, du jeton et de son propriétaire avant attribution. Gestion des achats en attente, annulation, perte de connexion, acknowledge/consume selon produit, notifications serveur, remboursements et révocations. Les consommables ne sont pas « restaurés » comme des achats durables : le serveur conserve leur attribution et leur consommation. Bouton Restaurer les achats pour droits durables.

Dédupliquer achat et récompense par identifiant unique, dans une transaction. Pour pubs récompensées connectées, vérifier les callbacks signés SSV et leur identifiant unique avant attribution serveur ; afficher En attente si nécessaire. Ne pas créditer une fois côté client puis une seconde fois côté serveur.

## 9. Direction artistique proposée et UI

Créer une identité originale ; les captures servent à comprendre la mécanique, sans reprendre logo, illustrations, sons ou niveaux du jeu cité.

Style : lumineux, élégant, satisfaisant ; cube ivoire légèrement translucide mais faces arrière suffisamment masquées pour éviter la confusion ; flèches bleu nuit très contrastées ; doré réservé aux arêtes de continuation et aux récompenses. Fond dégradé bleu doux, cartes arrondies et ombres discrètes. Exemple de tokens : fond `#EAF3FF`, texte `#152742`, accent `#4169E1`, arêtes `#F2C94C`, succès `#239B73`. Adapter pour contrastes accessibles.

Aucun emoji dans l’interface. Icônes SVG cohérentes. Pas de `alert`, `confirm` ou `prompt` natifs : modales accessibles. Sons brefs, musique facultative désactivée par défaut, vibrations réglables. Mode mouvement réduit : animations raccourcies et effets limités.

### Navigation

Hors partie : barre basse fixe à quatre entrées **Accueil / Niveaux / Tour / Boutique**. Réglages et profil via bouton en haut. En partie : masquer la barre basse pour agrandir le cube ; retour et pause clairement accessibles.

### Écrans

- **Accueil** : logo Cubelyo, Continuer, niveau courant, raccourci tour et prochain coffre. Aucun mur de connexion.
- **Niveaux** : 30 cartes ou parcours ordonné, niveaux acquis rejouables, prochain niveau accessible, suivants verrouillés. État différencié autrement que par couleur.
- **Partie** : barre haute retour/pause, « Niveau X / 30 », pièces/indices ; compteur de flèches ; cube central ; boutons Indice, Recentrer, zoom +/- ; explication discrète des bandes lors de leur introduction.
- **Pause** : reprendre, recommencer, réglages audio, quitter en conservant la partie.
- **Résultat** : victoire, récompense unique, animation de montée d’un étage, coffre disponible, niveau suivant. Au niveau 30 : écran de fin et rejouer les niveaux.
- **Tour** : défilement vertical, position actuelle et étages acquis, coffres 5/10/15/20/25/30 ; possibilité d’ouvrir tous les coffres dus dans un ordre stable.
- **Boutique** : solde, indices, retrait pubs, restaurer achats ; droits acquis clairement affichés ; erreurs compréhensibles.
- **Profil/réglages** : langue FR/EN, sons, vibrations, mouvement réduit, synchronisation facultative, export et suppression des données, légales, support.

Cible tactile : boutons d’au moins 44–48 px, safe areas et clavier gérés. Formats 360–430 px portrait prioritaires, paysage et desktop fonctionnels, aucune commande masquée. Texte lisible à 200 %. Zoom du cube indépendant du zoom de la page dans la mesure du possible. Solution de repli explicite si WebGL indisponible ; ne pas prétendre rendre le puzzle entièrement accessible à un lecteur d’écran si cela n’est pas réalisé.

## 10. Architecture du dépôt

Structure indicative ; conserver les conventions du dépôt s’il existe :

```text
src/app/                       routes web et layouts
src/components/ui/             boutons, modales, navigation
src/features/game/core/        logique pure : topologie, occupation, sorties
src/features/game/render/      cube, flèches, animations, sélection
src/features/game/state/       état de partie et commandes
src/features/levels/           définitions, schémas et progression
src/features/tower/            paliers et réclamation
src/features/economy/          soldes, dépenses, adaptateurs
src/features/monetization/     ads, consent, billing
src/features/profile/          paramètres et synchronisation
src/lib/firebase/              initialisation client uniquement
src/lib/storage/               IndexedDB et migrations
src/locales/                   fr et en
functions/src/                 fonctions Firebase serveur
content/levels/                30 niveaux et certificats
scripts/                       génération et validation
public/                        PWA, icônes, assets originaux
 tests/                        tests transverses si convention retenue
 docs/                         architecture, décisions, installation, bilan
```

Le moteur pur ne dépend ni de React, ni de Three.js, ni de Firebase. Commandes explicites : `tryExtract`, `useHint`, `restartLevel`, `completeLevel`, `claimMilestone`. Les animations affichent une décision déjà calculée, elles ne décident pas du résultat.

Schéma minimal d’un niveau : `id`, `version`, `seed`, `gridSize`, `faceFrames`, `edgeRules`, `arrows`, `solution`, `difficultyMetrics`. Une flèche contient une suite ordonnée de cellules (queue vers pointe) et une direction de pointe. Les transitions doivent permettre un corps sur plusieurs faces si nécessaire. Versionner aussi le moteur pour reprendre les parties après mise à jour. Valider les données au chargement avec un schéma strict.

## 11. Sauvegarde et Firebase

### Hors ligne

Tout le parcours principal est jouable après téléchargement des assets. Sauvegarder après chaque extraction finalisée, dépense d’indice, victoire et ouverture de coffre. Reprise identique après fermeture. Mise à jour PWA proposée hors partie ; ne pas remplacer les assets au milieu d’une animation. Ne pas mettre en cache des réponses privées de paiement.

Progression locale : niveaux terminés, partie courante, paramètres, récompenses locales, schemaVersion. Les stocks achetés et droits durables vérifiés ne deviennent jamais modifiables par un simple import JSON.

### Identité et synchronisation

Jeu invité immédiat ; connexion facultative. En environnement connecté, Auth anonyme possible pour un UID technique, sans écran obligatoire. Prévoir liaison à un compte pour récupération. Si auth Google native est choisie, utiliser un flux compatible Android, pas un popup WebView supposé fonctionnel.

À la connexion, fusionner les niveaux terminés par union et conserver le meilleur avancement ; ne jamais additionner aveuglément les monnaies de deux appareils. Les gains locaux non encore réclamés sont soumis au serveur, vérifiés et dédupliqués par niveau/palier. Économie serveur autoritaire une fois connectée ; éviter toute double dépense hors ligne en séparant aides gratuites locales et aides serveur. La première version doit documenter précisément ce qui est utilisable hors ligne.

### Collections suggérées

| Chemin | Contenu | Écriture |
|---|---|---|
| `users/{uid}` | profil minimal, préférences autorisées | utilisateur sur champs autorisés |
| `users/{uid}/progress/{levelId}` | victoire, version, date, preuve éventuelle | fonction serveur pour état autoritaire |
| `users/{uid}/saves/{slot}` | partie courante bornée et versionnée | utilisateur propriétaire, validation stricte |
| `users/{uid}/wallet/main` | pièces, indices, révision | serveur uniquement |
| `users/{uid}/entitlements/main` | removeAds, apparences | serveur uniquement |
| `users/{uid}/claims/{claimId}` | gains déjà attribués | serveur uniquement |
| `users/{uid}/ledger/{entryId}` | crédits et débits | serveur uniquement |
| `purchases/{purchaseKey}` | preuve fournisseur et attribution | serveur uniquement |
| `adRewards/{transactionId}` | récompense publicitaire dédupliquée | serveur uniquement |
| `publicConfig/current` | catalogue public non sensible | lecture seule publique si nécessaire |

Functions proposées : synchroniser une victoire, réclamer un palier, dépenser un indice, vérifier un achat, recevoir notifications d’achat, recevoir SSV, exporter/supprimer les données. Auth obligatoire, App Check quand applicable, validation de toutes les entrées, transactions et limites de fréquence. Pour victoire rémunérée, rejouer un journal de coups borné depuis le niveau versionné plutôt que croire un booléen `won` envoyé par le client. Une preuve de résolution ne prouve pas une action humaine ; garder l’économie sans conversion monétaire.

Règles Firestore : refus par défaut, lecture limitée à son UID, listes de champs autorisés, aucune écriture cliente des soldes/droits/achats. Admin SDK contourne les règles : l’authentification et les autorisations doivent aussi être contrôlées dans les Functions. Tests explicites contre accès croisés et falsification de portefeuille.

## 12. Environnements, secrets et Vercel

Aucun identifiant de projet Firebase, Vercel, AdMob ou produit store n’a encore été fourni pour Cubelyo. Ne pas inventer de valeur réelle ni réutiliser SousPli, Motissimo ou Géo. Créer `.env.example` avec placeholders et explication de chaque variable, et `.gitignore` adapté.

Variables publiques possibles : `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION`, clé publique App Check si utilisée.

Variables serveur selon hébergement choisi : identité de service/ADC, configuration package Android, paramètres de notifications et secrets requis par les fournisseurs. Privilégier identité gérée ou secrets du runtime ; si une clé privée est indispensable, stockage serveur uniquement. Ne jamais placer une clé Admin ou un secret sous `NEXT_PUBLIC_`. Les flags publics sont de l’UI, pas une autorisation de créditer un achat.

États de configuration distincts : ads disabled/test/live, billing disabled/test/live. Production ne doit pas permettre une simulation donnant des droits réels. Paramètres de sécurité et catalogue vérifiés serveur.

Vercel : branche de production main, previews pour branches, build reproductible, variables par environnement. Firebase dédié au développement ou émulateurs pour previews ; aucune preview ne doit modifier le portefeuille de production. Configurer le domaine prévu uniquement lorsque l’accès DNS est disponible. Restreindre les origines, domaines Auth et CSP sans casser le chargement 3D ou les SDK. Documenter les régions choisies et les coûts potentiels ; ne pas activer un service payant sans configuration autorisée.

Le manque de secrets ne bloque pas le moteur ni l’UI : terminer les parties indépendantes avec émulateurs. Les actions nécessitant Christian sont regroupées à la fin dans une liste courte, avec chemins console, valeurs attendues et raison. Ne pas publier sur un store, activer des encaissements réels ou modifier le DNS simplement parce que ce brief décrit leur architecture.

## 13. Confidentialité, support et pages légales

Préparer routes : `/confidentialite`, `/mentions-legales`, `/conditions`, `/suppression-compte` et gestion des préférences publicitaires. Informations inconnues de JavaChrist (adresse, SIRET, etc.) à obtenir depuis une source autorisée ; aucun faux contenu légal publié comme définitif.

Prévoir accès/export des données, suppression du profil et du compte, et information sur les éventuelles durées de conservation nécessaires aux achats. Le reset de progression et la suppression de compte sont deux actions distinctes avec modales explicites. Les exigences actuelles des stores, du consentement publicitaire et de protection des mineurs doivent être vérifiées avant sortie ; le brief n’est pas un avis juridique.

Analytique facultative et sobre : niveau commencé/terminé, aide utilisée, achat confirmé, erreur technique ; aucun e-mail, jeton d’achat ou identifiant sensible dans les logs ou événements publics. L’absence de consentement ne bloque pas le puzzle. Support via `mailto:support@javachrist.fr` avec version de l’application, sans joindre automatiquement des données privées.

## 14. Plan d’exécution autonome

### Lot 0 — Installation et décisions

Inspecter dépôt et outils ; installer versions compatibles ; créer structure, scripts, lockfile, `.env.example`, documentation et journal des décisions. Vérifier build minimal et page de démarrage. Pas de dépendance externe nécessaire pour jouer à la future démo locale.

### Lot 1 — Prototype de mécanique prioritaire

Créer un petit cube sur six faces, rotation tactile/souris, sélection, sortie simple, blocage, une continuation d’arête puis deux. Inclure trois puzzles démonstrateurs déterministes. Rendre les bandes de continuation compréhensibles. Vérifier route logique et animation sur plusieurs faces. Préparer un aperçu concret à montrer à Christian ; demander un retour seulement si la convention de sortie reste ambiguë.

### Lot 2 — Boucle complète

Tutoriel, chargement niveau, aide, pause, reprise locale, victoire, progression, tour et coffres locaux dédupliqués. Interface complète avec textes réels FR/EN. Aucune boutique factice active.

### Lot 3 — 30 niveaux

Générateur/constructeur, validation, certificats, métriques et équilibrage ; produire et figer 30 niveaux distincts. Tester lisibilité du grand cube et difficultés multi-arêtes. Réajuster les valeurs du tableau si nécessaire et documenter pourquoi.

### Lot 4 — Firebase et PWA

Auth facultative, règles testées, synchronisation et économie serveur, export/suppression, cache et installation PWA. Préparer déploiement Vercel et intégration continue. Si credentials manquent, livrer émulateurs fonctionnels et liste de configuration restante.

### Lot 5 — Android et monétisation test

Projet Capacitor, build Android de test, consentement, unités de pubs de test, billing test, vérification serveur, restauration et notifications. Vérifier les flux sur appareil réel dès qu’il est accessible. Si consoles absentes, livrer adaptateurs réels configurables et état indisponible propre ; distinguer intégration prête et intégration testée.

### Lot 6 — Livraison

Audit des parcours, corrections, README d’installation, commandes exactes, bilan des validations et limites, procédure de publication et retour arrière. Ne pas laisser des TODO silencieux sur un parcours annoncé terminé.

Après chaque lot : bref résultat, ce qui fonctionne, preuve de validation, limite restante et prochaine action. Continuer les travaux indépendants sans redemander une autorisation générale.

## 15. Tests et critères d’acceptation

### Moteur — tests indispensables

- Passage des 12 arêtes dans les deux sens et transformation inverse ; orientation correcte autour des six faces.
- Extraction simple et blocage local.
- Blocage sur deuxième puis troisième face malgré première face libre.
- Réussite après suppression de l’obstacle lointain.
- Route sans sortie ou cyclique rejetée, jamais une boucle infinie.
- Collisions du corps pendant l’extraction, pas seulement de la pointe.
- Caméra sans influence sur les coups autorisés.
- Les 30 certificats vident intégralement les 30 niveaux.
- Aucun mouvement double pendant animation, compteur et plateau cohérents.

### Progression et économie

- Fermeture/reprise après une extraction ; migration de sauvegarde.
- Victoire, coffre et récompense d’achat attribués exactement une fois, même après double requête.
- Rejouer sans crédit de première réussite supplémentaire.
- Dépense atomique, solde jamais négatif, fusion sans multiplication des pièces.
- Refus accès croisé et modifications clientes du portefeuille.
- Achat en attente/annulé/remboursé, restauration, callback dupliqué, pub interrompue/non chargée.

### Parcours et performance

Premier lancement → tutoriel → victoire → niveau suivant ; reprendre une partie ; tour → coffre ; boutique indisponible puis test ; connexion facultative ; export/suppression. Tactile et souris, portrait et paysage. Tester le niveau 30 sur Android cible ; viser 60 FPS, accepter 30 FPS stables avec réglage graphique réduit. Mesurer et rapporter appareil, FPS et chargement réels ; ne pas prétendre une garantie sur tout appareil.

Chargement différé de la 3D, géométries mutualisées, limiter draw calls, plafonner le pixel ratio, libérer ressources WebGL, suspendre rendu au repos/en arrière-plan, pas de polling permanent Firestore.

Scripts attendus, à implémenter et documenter : `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `levels:validate`, `emulators`, puis commandes Android selon structure choisie. CI : types, lint, tests moteur/économie, validation des niveaux, build ; tests navigateurs ciblés.

## 16. Définition de terminé et livrables

- Source Git propre, dépendances et lockfile ; aucune clé privée ou secret commité.
- Jeu réellement jouable sur six faces, avec 0/1/2/3 arêtes de continuation selon niveau.
- 30 niveaux terminables, aucun plateau décoratif remplaçant une logique réelle.
- Tour directement liée aux victoires, lots croissants dédupliqués.
- UI complète, sauvegarde, reprise, mode hors ligne documenté et connexion facultative.
- Firebase sécurisé et testé ; Vercel prêt ou déployé seulement dans le périmètre autorisé.
- PWA installable et ressources originales/licenciées avec registre des licences.
- Android et monétisation : indiquer séparément « préparé », « intégré », « testé » et « activé ». Une console non configurée interdit de déclarer la monétisation terminée.
- Documentation : README, architecture, mécanique des arêtes, schéma des niveaux, décisions, configuration Firebase/Vercel/stores, procédure de tests, limites connues et reprise de travail.
- Bilan final concret : commit, URL si existante, commandes exécutées et résultats, étapes manuelles restantes regroupées.

## 17. Références techniques à consulter au moment d’implémenter

Documentation officielle, versions à revérifier plutôt que supposer :
- Next.js : https://nextjs.org/docs
- Three.js OrbitControls : https://threejs.org/docs/pages/OrbitControls
- Three.js Raycaster : https://threejs.org/docs/pages/Raycaster
- Firebase règles : https://firebase.google.com/docs/firestore/security/overview
- Conditions des règles : https://firebase.google.com/docs/firestore/security/rules-conditions
- Firebase Emulator Suite : https://firebase.google.com/docs/emulator-suite
- Vercel environnements : https://vercel.com/docs/deployments/environments
- Vercel variables : https://vercel.com/docs/environment-variables
- Capacitor : https://capacitorjs.com/docs
- AdMob récompenses : https://developers.google.com/admob/android/rewarded
- AdMob validation serveur : https://developers.google.com/admob/android/ssv
- Google Play Billing : https://developer.android.com/google/play/billing
- App Store achats : https://developer.apple.com/in-app-purchase/

Les références visuelles échangées montrent des flèches sur un cube et une arête soulignée en jaune. Elles ne sont pas nécessaires à l’exécution de ce brief et ne sont pas incluses dans ce fichier. Si elles sont fournies au dépôt, les conserver comme références privées de mécanique, sans les publier comme assets.

## Instruction de démarrage pour Codex

Lis ce document en entier et les instructions du dépôt. Commence par les lots 0 et 1. Construis d’abord la logique des faces, des arêtes de continuation et des sorties, avec tests et une démo jouable. Ensuite déroule les lots suivants en autonomie. Centralise les valeurs proposées pour pouvoir les ajuster. Quand un accès externe manque, continue tout ce qui peut être terminé localement et regroupe les besoins de configuration. Ne remplace jamais une règle multi-faces par une simple sortie au premier bord rencontré.
