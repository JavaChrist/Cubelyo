# Firebase, Android et Vercel

Préparation locale version 0.14.0. Aucun projet Firebase réel, déploiement, achat ou publicité activé par cette préparation.

## Paramètres à fournir

Créer l’application Web dans le projet Firebase Cubelyo, activer Authentication > Anonyme, puis créer Cloud Firestore en mode production dans la région choisie. Fournir `apiKey`, `authDomain`, `projectId`, `appId` et la région choisie. Ni clé Admin ni compte de service ne sont nécessaires pour cette sauvegarde de test.

`.env.local` est déjà créé, ignoré par Git. Le modèle `.env.example` décrit toutes les variables réellement utilisées. Tant que `NEXT_PUBLIC_FIREBASE_ENABLED=false`, le jeu reste entièrement local, sans création d’identité ni appel Firebase. Avec `true`, les quatre paramètres Web sont obligatoires ; une configuration partielle affiche une erreur de synchronisation et conserve la copie locale. Après modification, redémarrer le serveur/recompiler.

Avant d’activer le projet réel, déployer les règles et index avec le bon identifiant explicite :

```powershell
npx firebase login
npx firebase deploy --only firestore:rules,firestore:indexes --project VOTRE_ID_CUBELYO
```

Aucun `.firebaserc` n’associe implicitement le dossier à un autre projet. Ajouter le domaine Vercel et les domaines de test nécessaires dans les paramètres Authentication. Ne jamais utiliser les règles ouvertes du mode test.

## Fonctionnement et limites

- Identité anonyme persistante dans le navigateur/WebView ; migration de la sauvegarde locale vers `players/{uid}/saves/prototype` si aucune sauvegarde distante n’existe.
- Copie locale toujours conservée. Écritures regroupées après les changements, transactions avec révision et conflit explicite. Une version distante différente ne remplace pas automatiquement une partie. Le choix ne cumule pas pièces/atouts.
- Réessai au retour du réseau ou au retour dans l’application et bouton de réessai dans les réglages. Pause/réactivation sans supprimer les données distantes.
- Cache Firestore mémoire ; pas de copie persistante IndexedDB supplémentaire des documents. L’identité Auth reste persistante. Sans réseau, la copie locale permet de continuer ; la synchronisation reprend ensuite. Une opération distante ne peut pas être annoncée réussie hors connexion.
- L’export JSON comprend copie locale et document distant actuel, avec UID mais sans jeton. L’effacement confirmé supprime le document puis l’identité anonyme, puis la copie locale ; il reste relançable en cas d’échec et n’efface pas les exports téléchargés. Il suspend la synchronisation sur cette origine. Ne pas poursuivre la même partie simultanément dans plusieurs onglets pendant un effacement.
- Anonyme ne signifie pas récupérable entre appareils : la liaison à un compte est une prochaine étape. Ne pas annoncer une restauration après perte de l’identité ou réinstallation. Ne pas activer un nettoyage automatique des comptes anonymes sans stratégie de suppression des documents associés.
- Le document contient des **données de jeu de test contrôlées par le client**. Les règles isolent les propriétaires, bornent la taille et vérifient la révision ; elles ne certifient pas une victoire. Tous les portefeuilles, achats, droits publicitaires et autres chemins sont refusés. Avant les achats réels : API serveur, vérification des achats, récompenses et économie autoritaire, App Check/anti-abus et revue adaptée.

## Vérifications Firebase

```powershell
npm run test:firebase
```

Utilise uniquement `demo-cubelyo` sur les émulateurs Auth 9099 et Firestore 8080, puis Chrome sur 3117. Les variables d’émulateur sont limitées à un projet `demo-*`. Aucun identifiant réel requis. Les tests couvrent isolation, écritures refusées, conflits/révisions, import local, export et effacement de l’identité, ainsi qu’un parcours navigateur réel.

## Vercel

Framework Next.js, installation `npm ci`, compilation `npm run build`, répertoire de sortie géré automatiquement par Next.js. `vercel.json` fixe la commande qui génère aussi les documents légaux.

Sans Firebase activé, aucune variable n’est obligatoire. Pour l’activer : recopier les quatre paramètres Web et `NEXT_PUBLIC_FIREBASE_ENABLED=true` dans Settings > Environment Variables, garder `NEXT_PUBLIC_FIREBASE_EMULATORS=false`, puis redéployer. Ne pas définir `CUBELYO_BUILD_TARGET` sur Vercel. `NEXT_PUBLIC_APP_URL` est facultatif et sert aux documents ; à défaut, le build Vercel utilise son URL de déploiement.

Les valeurs `NEXT_PUBLIC_*` sont publiques et figées à la compilation. Les règles Firestore et protections serveur protègent les données, pas la dissimulation de la configuration Web. Aucun secret store/clé Admin dans ces variables.

## Android Capacitor

Capacitor 8, identifiant proposé `fr.javachrist.cubelyo`, SDK Android 36, min SDK 24. Node 22+ et JDK 21+, Android Studio/SDK requis. Le projet natif est dans `android/`. Les icônes sont celles du modèle Capacitor, en attente des icônes définitives. Aucune signature de publication configurée.

```powershell
npm run android:sync
npm run android:open
# Compiler aussi un APK de test :
npm run android:apk
```

`android:sync` compile Next.js en export statique dans `out/`, puis copie les fichiers et synchronise les plugins. Next.js utilise `.next` comme intermédiaire pour les deux cibles : lancer les compilations successivement. Recompiler avec `npm run build` avant un `npm run start` web après un export Android. Pas de `server.url` vers Vercel et pas de téléchargement de code distant pour remplacer le bundle. L’alerte de mise à jour du site est désactivée en natif : les versions Android passent par un nouvel APK/AAB.

Les pages légales sont incluses. L’export JSON Android utilise le cache privé et la feuille de partage native via Filesystem/Share, sans permission d’accès au stockage partagé. Le SDK Firebase Web sert l’authentification anonyme et Firestore dans la WebView ; aucun `google-services.json` n’est requis à ce stade. Les plugins Firebase natifs, notifications, AdMob et Google Play Billing ne sont pas activés.

`android/local.properties`, fichiers compilés et clés de signature restent ignorés. Configurer le chemin SDK avec Android Studio sur une autre machine. Ne pas publier avant tests sur appareil, icônes définitives, revue des documents/traitements et sécurisation des achats réels.

## Documents légaux

Le générateur lit les mêmes paramètres que Next.js. Il ajoute le supplément Firebase uniquement lorsque Firebase est activé et complet. Éditions de brouillon archivées par version/empreinte dans `legal/generated/` ; `legal/current.json` sélectionne l’édition du build. Les documents sont toujours à relire. Région et conditions Firebase, hébergement, public et garanties restent à confirmer avant publication.

APK de test : `android/app/build/outputs/apk/debug/app-debug.apk`. Compilation Gradle réussie localement ; installation et gestes sur appareil Android réel non vérifiés.
