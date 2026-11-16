 > BROUILLON — informations et clauses à compléter et valider avant publication.

# Politique de confidentialité — Cubelyo

Version 0.3.0-pwa-firebase — 2026-11-16

## Responsable et périmètre

Christian Grohens, 5 rue Maurice Fonvieille, 31120 Portet-sur-Garonne, France, détermine les finalités et moyens des traitements décrits ici pour Cubelyo (http://127.0.0.1:3107). Contact données personnelles : support@javachrist.fr. Cette politique concerne l’application et les fonctionnalités effectivement disponibles.

## Données et usages

| Finalité | Données | Base légale | Nécessité / refus | Destinataires | Conservation | Provenance |
| --- | --- | --- | --- | --- | --- | --- |
| Conserver la partie, la progression, les récompenses et les préférences sur cet appareil | Niveaux terminés, scores, étoiles, cœurs, pièces de test, atouts, coffres, session en cours et réglages audio/vibration ; aucun compte ni identifiant nominatif demandé | Fonctionnement du jeu demandé par le joueur ; qualification juridique à confirmer lors de la revue avant publication | La sauvegarde permet de reprendre la partie. Son effacement remet la progression à zéro sur cet appareil. | Stockage du navigateur, sans synchronisation ni transmission de cette sauvegarde à JavaChrist par le jeu | Jusqu’à effacement par le joueur ou par le navigateur ; aucune durée automatique d’expiration de la sauvegarde | Actions du joueur et calculs locaux du jeu |
| Adapter la bannière publicitaire et les vidéos de promotion à l’âge déclaré (application Android) | Réponse à la question « Avez-vous 18 ans ou plus ? » (adulte, mineur ou sans réponse), nombre de niveaux réussis depuis la dernière vidéo, dernière vidéo montrée, catalogue des vidéos en cache. Aucune date de naissance. | Obligation légale et intérêt légitime de l’éditeur à protéger les mineurs : aucune publicité personnalisée ni vidéo de promotion pour un joueur mineur ou sans réponse | Facultatif : sans réponse, le joueur est traité comme un mineur | Aucun : la réponse reste sur l’appareil (clé cubelyo.promotions.v1). Seul le réglage qui en découle accompagne les demandes d’annonces envoyées à Google | Jusqu’à l’effacement depuis Réglages › Confidentialité, Droits RGPD, ou en vidant les données de l’application | Déclarée par le joueur sur l’appareil |
| Afficher une bannière publicitaire Google AdMob dans l’application Android | Adresse IP, identifiant de groupe d’applications (App Set ID), modèle et version de l’appareil et du système, langue, application et emplacement de l’annonce, interactions avec l’annonce, choix de consentement (chaîne TCF). L’identifiant publicitaire Android n’est pas collecté. | Consentement recueilli par le formulaire Google (UMP) pour les joueurs adultes de l’Espace économique européen et du Royaume-Uni ; pour les joueurs mineurs ou sans réponse, annonces non personnalisées traitées comme destinées aux enfants | Facultatif : un adulte peut refuser ou modifier son choix depuis Réglages › Choix publicitaires. L’achat sans publicité arrête toute demande d’annonce | Google Ireland Limited (Google AdMob et User Messaging Platform), responsable de traitement pour ses propres finalités publicitaires | Selon les règles de conservation de Google : https://policies.google.com/technologies/retention | Collecte par le SDK Google Mobile Ads intégré à l’application Android |
| Présenter les autres applications de JavaChrist en vidéo entre deux niveaux (adultes déclarés) | Données techniques de la requête reçues par Google lors du chargement du catalogue et de la vidéo : adresse IP, date et heure, type d’appareil. Le jeu n’envoie aucun identifiant, compteur ni clic à JavaChrist. | Intérêt légitime de l’éditeur à faire connaître ses autres applications | Facultatif : aucune vidéo pour un joueur mineur ou sans réponse, ni après l’achat sans publicité | Google Ireland Limited (Cloud Firestore et Cloud Storage for Firebase), hébergeur du catalogue, sous-traitant | Catalogue gardé en cache sur l’appareil ; journaux techniques selon les règles de conservation de Google | Collecte directe par Google lors du chargement |
| Sauvegarder et retrouver la progression de la même identité anonyme | Identifiant anonyme Firebase, sauvegarde du jeu de test et révision ; données techniques de connexion traitées par Firebase | Qualification à confirmer avant publication pour le service de sauvegarde demandé | La copie locale continue en cas de panne. La sauvegarde en ligne peut être désactivée dans les réglages et les données effacées dans Droits RGPD. | JavaChrist et Google Firebase Authentication / Cloud Firestore | Jusqu’à suppression par le joueur pour la sauvegarde et l’identité ; règles de conservation et de sauvegarde des prestataires à confirmer avant publication | Actions du joueur, génération de l’identité anonyme et données techniques de connexion |

## Prestataires et circulation des données

Les destinataires et lieux de traitement sont décrits ci-dessous. Les accès depuis un pays tiers et les mesures d’encadrement des transferts doivent également y figurer, même lorsque le stockage principal est européen.

| Prestataire | Rôle | Données | Localisation | Transferts et garanties |
| --- | --- | --- | --- | --- |
| Google Ireland Limited — Google AdMob et User Messaging Platform | Bannière publicitaire et recueil du consentement dans l’application Android, responsable de traitement pour ses propres finalités | Données publicitaires décrites dans le tableau des traitements (adresse IP, App Set ID, appareil, interactions, choix de consentement) | Infrastructure Google, notamment aux États-Unis | Google peut traiter ces données hors de l’Espace économique européen, notamment aux États-Unis. Les transferts sont encadrés par le cadre de protection des données UE–États-Unis (EU-US Data Privacy Framework), auquel Google LLC adhère, et par les clauses contractuelles types de la Commission européenne (article 46 du RGPD). Règles de Google : https://policies.google.com/privacy et https://business.safety.google/privacy/ |
| Google Ireland Limited — Firebase (catalogue des promotions JavaChrist) | Hébergement du catalogue et des vidéos de promotion, en lecture seule, sous-traitant | Données techniques de la requête (adresse IP, date et heure, type d’appareil) | Infrastructure Google, notamment aux États-Unis | Google peut traiter ces données hors de l’Espace économique européen, notamment aux États-Unis. Les transferts sont encadrés par le cadre de protection des données UE–États-Unis (EU-US Data Privacy Framework), auquel Google LLC adhère, et par les clauses contractuelles types de la Commission européenne (article 46 du RGPD). Conditions applicables : https://firebase.google.com/terms/data-processing-terms |
| Google Firebase — Authentication et Cloud Firestore | Authentification anonyme et stockage de la sauvegarde ; engagements contractuels à confirmer avant publication | UID anonyme, sauvegarde et informations techniques nécessaires au service | Cloud Firestore : Paris (europe-west9). Traitements et accès liés à Firebase Authentication à confirmer avant publication. | Garanties et transferts éventuels à vérifier avant publication |

## Sécurité

La sauvegarde distante est isolée par l’UID Firebase : les règles déployées n’autorisent que son propriétaire à lire et modifier son document de test. Les écritures utilisent des révisions pour détecter les conflits. Ce document n’est ni un portefeuille serveur ni une preuve d’achat. Les règles sont déployées sur le projet Cubelyo ; leur portée concerne la sauvegarde de test. La copie locale reste accessible aux utilisateurs du même navigateur.

## Stockages sur le terminal

Le jeu utilise localStorage pour la sauvegarde Cubelyo (clé cubelyo.profile.v1), sans mesure d’audience intégrée. Les préférences sont conservées avec la partie. Le jeu consulte également son fichier /version.json sur la même origine pour détecter une mise à jour. Les ressources du jeu sont servies par cette origine. La réponse à la question d’âge et l’état des vidéos de promotion sont conservés sous la clé cubelyo.promotions.v1. Dans l’application Android, le SDK Google Mobile Ads et le formulaire de consentement de Google enregistrent en outre les choix publicitaires et des données techniques (voir Publicité). Aucun SDK d’analyse ni de paiement n’est actif. Les préférences de synchronisation préparées utilisent aussi cubelyo.cloud.v1 et cubelyo.cloud.disabled ; Firebase reste inactif tant que sa configuration n’est pas activée. Les métadonnées de synchronisation utilisent cubelyo.cloud.v1 et cubelyo.cloud.disabled ; Firebase Authentication conserve l’identité anonyme dans le stockage du navigateur. Firestore utilise un cache mémoire dans cette intégration, sans cache persistant de documents supplémentaire.

## Compte et sauvegardes

Une identité Firebase anonyme est créée pour la sauvegarde en ligne. Aucun nom, courriel ou mot de passe n’est demandé. Elle est conservée sur ce navigateur ou cette installation Android. Effacer les données de l’appareil ou changer d’appareil peut faire perdre l’accès à cette identité ; aucune liaison à un compte récupérable ni connexion entre appareils n’est encore proposée. Une connexion est nécessaire pour synchroniser. En cas de conflit, le joueur choisit la sauvegarde à conserver ; les soldes ne sont pas additionnés. Il peut désactiver la synchronisation dans les réglages sans effacer les données distantes.

## Publicité

La version web n’affiche aucune publicité tierce. L’application Android affiche une bannière Google AdMob en bas de l’accueil, de la tour et de la boutique, jamais pendant un niveau. Pour un joueur adulte de l’Espace économique européen ou du Royaume-Uni, Google recueille son consentement par son formulaire (User Messaging Platform) avant la première annonce ; il peut le modifier à tout moment depuis Réglages › Choix publicitaires. Pour un joueur déclaré mineur ou sans réponse à la question d’âge, les demandes d’annonces sont marquées comme destinées aux enfants et à un public n’ayant pas l’âge du consentement, et les annonces sont non personnalisées. L’identifiant publicitaire Android n’est pas collecté. Toutes les trois victoires, un adulte déclaré peut voir une courte vidéo présentant une autre application de JavaChrist ; elle se ferme à sa fin. L’achat sans publicité (lorsqu’il sera proposé) supprime la bannière et ces vidéos. Le jeu ne propose aucune publicité récompensée. Effacer les données du jeu ne supprime pas les données déjà transmises à Google et ne retire pas le consentement donné à Google : ce choix se modifie depuis Choix publicitaires.


## Mineurs

Le jeu s’adresse à tous, enfants compris, et se joue sans compte. Une question unique demande si le joueur a 18 ans ou plus ; aucune date de naissance n’est demandée et la réponse reste sur l’appareil. Un joueur mineur ou sans réponse ne voit ni publicité personnalisée ni vidéo de promotion. Les achats doivent être effectués par une personne majeure ou avec l’accord d’un représentant légal.


## Profilage et décisions automatisées

Aucune décision produisant des effets juridiques n’est mise en œuvre. Les scores, récompenses et difficultés sont des mécanismes locaux du jeu. Pour un adulte qui y consent, Google peut personnaliser les annonces de la bannière selon ses propres règles (voir Publicité).

## Vos droits

Vous pouvez exercer les droits applicables à votre situation auprès de support@javachrist.fr : accès, rectification, effacement, limitation, opposition et portabilité sous leurs conditions respectives. Lorsque le traitement repose sur le consentement, vous pouvez le retirer sans remettre en cause la licéité du traitement antérieur. Vous pouvez adresser une réclamation à la CNIL : https://www.cnil.fr/fr/plaintes.

Les modalités pratiques et délais sont détaillés dans Droits RGPD. Toute évolution substantielle des traitements doit donner lieu à une information adaptée et, lorsque nécessaire, à un nouveau recueil du consentement.
