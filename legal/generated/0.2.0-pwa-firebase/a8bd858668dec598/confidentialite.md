 > BROUILLON — informations et clauses à compléter et valider avant publication.

# Politique de confidentialité — Cubelyo

Version 0.2.0-pwa-firebase — 2026-11-06

## Responsable et périmètre

Christian Grohens, 5 rue Maurice Fonvieille, 31120 Portet-sur-Garonne, France, détermine les finalités et moyens des traitements décrits ici pour Cubelyo (http://127.0.0.1:3107). Contact données personnelles : support@javachrist.fr. Cette politique concerne l’application et les fonctionnalités effectivement disponibles.

## Données et usages

| Finalité | Données | Base légale | Nécessité / refus | Destinataires | Conservation | Provenance |
| --- | --- | --- | --- | --- | --- | --- |
| Conserver la partie, la progression, les récompenses et les préférences sur cet appareil | Niveaux terminés, scores, étoiles, cœurs, pièces de test, atouts, coffres, session en cours et réglages audio/vibration ; aucun compte ni identifiant nominatif demandé | Fonctionnement du jeu demandé par le joueur ; qualification juridique à confirmer lors de la revue avant publication | La sauvegarde permet de reprendre la partie. Son effacement remet la progression à zéro sur cet appareil. | Stockage du navigateur, sans synchronisation ni transmission de cette sauvegarde à JavaChrist par le jeu | Jusqu’à effacement par le joueur ou par le navigateur ; aucune durée automatique d’expiration de la sauvegarde | Actions du joueur et calculs locaux du jeu |
| Sauvegarder et retrouver la progression de la même identité anonyme | Identifiant anonyme Firebase, sauvegarde du jeu de test et révision ; données techniques de connexion traitées par Firebase | Qualification à confirmer avant publication pour le service de sauvegarde demandé | La copie locale continue en cas de panne. La sauvegarde en ligne peut être désactivée dans les réglages et les données effacées dans Droits RGPD. | JavaChrist et Google Firebase Authentication / Cloud Firestore | Jusqu’à suppression par le joueur pour la sauvegarde et l’identité ; règles de conservation et de sauvegarde des prestataires à confirmer avant publication | Actions du joueur, génération de l’identité anonyme et données techniques de connexion |

## Prestataires et circulation des données

Les destinataires et lieux de traitement sont décrits ci-dessous. Les accès depuis un pays tiers et les mesures d’encadrement des transferts doivent également y figurer, même lorsque le stockage principal est européen.

| Prestataire | Rôle | Données | Localisation | Transferts et garanties |
| --- | --- | --- | --- | --- |
| Google Firebase — Authentication et Cloud Firestore | Authentification anonyme et stockage de la sauvegarde ; engagements contractuels à confirmer avant publication | UID anonyme, sauvegarde et informations techniques nécessaires au service | Région Firestore et accès du prestataire à confirmer avant publication | Garanties et transferts éventuels à vérifier avant publication |

## Sécurité

La sauvegarde distante est isolée par l’UID Firebase : les règles prévues n’autorisent que son propriétaire à lire et modifier son document de test. Les écritures utilisent des révisions pour détecter les conflits. Ce document n’est ni un portefeuille serveur ni une preuve d’achat. Les règles doivent être déployées et vérifiées avant activation du projet réel. La copie locale reste accessible aux utilisateurs du même navigateur.

## Stockages sur le terminal

Le jeu utilise localStorage pour la sauvegarde Cubelyo (clé cubelyo.profile.v1), sans cookie publicitaire ni mesure d’audience intégrée. Les préférences sont conservées avec la partie. Le jeu consulte également son fichier /version.json sur la même origine pour détecter une mise à jour. Les ressources du jeu sont servies par cette origine. Aucun SDK tiers de publicité, d’analyse ou de paiement n’est actif. Les préférences de synchronisation préparées utilisent aussi cubelyo.cloud.v1 et cubelyo.cloud.disabled ; Firebase reste inactif tant que sa configuration n’est pas activée. Les métadonnées de synchronisation utilisent cubelyo.cloud.v1 et cubelyo.cloud.disabled ; Firebase Authentication conserve l’identité anonyme dans le stockage du navigateur. Firestore utilise un cache mémoire dans cette intégration, sans cache persistant de documents supplémentaire.

## Compte et sauvegardes

Une identité Firebase anonyme est créée pour la sauvegarde en ligne. Aucun nom, courriel ou mot de passe n’est demandé. Elle est conservée sur ce navigateur ou cette installation Android. Effacer les données de l’appareil ou changer d’appareil peut faire perdre l’accès à cette identité ; aucune liaison à un compte récupérable ni connexion entre appareils n’est encore proposée. Une connexion est nécessaire pour synchroniser. En cas de conflit, le joueur choisit la sauvegarde à conserver ; les soldes ne sont pas additionnés. Il peut désactiver la synchronisation dans les réglages sans effacer les données distantes.





## Profilage et décisions automatisées

Aucun profilage publicitaire ni décision produisant des effets juridiques n’est mis en œuvre dans cette version. Les scores, récompenses et difficultés sont des mécanismes locaux du jeu.

## Vos droits

Vous pouvez exercer les droits applicables à votre situation auprès de support@javachrist.fr : accès, rectification, effacement, limitation, opposition et portabilité sous leurs conditions respectives. Lorsque le traitement repose sur le consentement, vous pouvez le retirer sans remettre en cause la licéité du traitement antérieur. Vous pouvez adresser une réclamation à la CNIL : https://www.cnil.fr/fr/plaintes.

Les modalités pratiques et délais sont détaillés dans Droits RGPD. Toute évolution substantielle des traitements doit donner lieu à une information adaptée et, lorsque nécessaire, à un nouveau recueil du consentement.
