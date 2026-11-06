# Formes après le niveau 100

Préparation de conception, pas une fonctionnalité implémentée.

Le moteur actuel calcule la surface fermée d'un cube à six faces. Il ne faut pas simuler un décrochement uniquement dans le rendu : cela rendrait les routes et les collisions fausses.

## Modèle proposé

Construire une surface à partir d'un ensemble de voxels occupés. Chaque face de voxel sans voisin constitue une cellule extérieure ; les faces internes sont retirées. Une cellule porte un identifiant stable, son centre, sa normale et ses axes locaux orthonormés.

La surface expose une table de voisinage pour chacun des quatre déplacements locaux. Chaque transition transporte la direction vers la cellule suivante. Une jonction peut être coplanaire, convexe ou concave ; le calcul ne dépend jamais de la caméra. Les jonctions non-manifold et les volumes déconnectés sont rejetés.

Sur une arête : continuation explicite ou sortie explicite. Dans une concavité, un départ ne signifie pas nécessairement une sortie : il faut vérifier le balayage du corps contre le volume restant. Le modèle discret et l'animation doivent utiliser le même trajet, avec un traitement propre aux arêtes concaves, au lieu de réutiliser aveuglément l'arrondi convexe du cube.

Le moteur de commandes, les couleurs d'erreur et les récompenses pourront rester communs. Les adaptateurs à remplacer sont la topologie, la géométrie de la surface et le compilateur de niveaux. La forme et les règles seront versionnées dans chaque définition.

## Premier démonstrateur prévu

Un volume de deux étages avec une marche, puis un volume avec un creux ouvert. Pour chacun : une sortie simple, une continuation convexe, une continuation concave et un obstacle sur une surface ultérieure. Fournir un certificat qui vide chaque forme avant d'étendre la campagne au niveau 101.

Les passages inverses, les collisions avec le volume, la sélection des surfaces au premier plan et les routes cycliques devront être validés sur ces formes. Les niveaux 101+ n'apparaîtront pas comme disponibles avant cette validation.
