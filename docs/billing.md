# Achats Google Play (Billing)

Achats intégrés de l'application Android Cubelyo : Google Play Billing Library 8 (`com.android.billingclient:billing`), qui ajoute
la permission `com.android.vending.BILLING` au manifeste fusionné. La version web n'achète rien : prix de référence et boutons inactifs.

## Les 10 produits ponctuels

Play Console › Monétiser avec Play › Produits › Produits ponctuels. Identifiants exacts (source : `src/features/billing/products.ts`) :

| ID produit | Nom | Prix de référence | Type | Contenu crédité |
| --- | --- | --- | --- | --- |
| `starter` | Pack de départ | 1,99 € | Consommable | 2 indices + 2 gommes + 2 baguettes |
| `noads_pack` | Pack sans publicité | 9,99 € | Non consommable | suppression des pubs + 3 indices + 3 gommes |
| `noads` | Sans publicité | 8,99 € | Non consommable | suppression des pubs |
| `special` | Pack spécial | 8,99 € | Consommable | 4 500 pièces + 3 indices + 3 gommes |
| `coins_1500` | 1 500 pièces | 1,99 € | Consommable | 1 500 pièces |
| `coins_7500` | 7 500 pièces | 8,99 € | Consommable | 7 500 pièces |
| `coins_20000` | 20 000 pièces | 14,99 € | Consommable | 20 000 pièces |
| `coins_45000` | 45 000 pièces | 34,99 € | Consommable | 45 000 pièces |
| `coins_80000` | 80 000 pièces | 59,99 € | Consommable | 80 000 pièces |
| `coins_220000` | 220 000 pièces | 99,99 € | Consommable | 220 000 pièces |

« Consommable » ou non n'est pas un réglage de la Play Console : c'est le serveur qui consomme (lots) ou accuse réception (sans publicité).
Le jeu affiche le prix localisé rendu par Google Play.

## Parcours

1. `PlayBillingPlugin.java` (plugin Capacitor `PlayBilling`) : `getProducts`, `purchase`, `queryPurchases`, événement `purchaseUpdated`.
2. Achat de pièces ou de pack : la sauvegarde en ligne doit être active et à jour (`purchaseSession`,
   `src/features/cloud/purchase.ts`), sinon l'achat n'est pas lancé. `BillingProvider.tsx` envoie
   `{productId, purchaseToken}` et le jeton d'identité Firebase (`Authorization: Bearer`) à
   `POST ${NEXT_PUBLIC_API_BASE_URL}/api/play/verify` (par défaut `https://cubelyo.vercel.app`).
3. `src/app/api/play/verify/route.ts` → `settlePlayPurchase` (`src/server/settle.ts`) :
   1. relit l'achat chez Google (`src/server/google-play.ts`) ; `noads` : accusé de réception seul, sans base ;
   2. achat déjà consommé/accusé chez Google : jamais recrédité (ancien flux ou autre appareil) ;
   3. jeton d'identité vérifié (Firebase Admin) → UID ; sans UID : 401 `authRequired`, rien n'est finalisé ;
   4. **transaction Firestore** (`src/server/attribution-store.ts`) : si la preuve `playPurchases/{sha256(jeton)[:40]}`
      existe, rien ; sinon crédit de `players/{uid}/saves/prototype` (révision +1, entrée `profile.purchases`)
      **et** création de la preuve `{uid, productId, grant, attributedAt, finalizedAt: null}`, ensemble ou pas du tout ;
   5. consommation / accusé chez Google, puis `finalizedAt`. En cas d'échec, l'achat reste ouvert : le prochain essai
      (lancement, Restaurer) retrouve la preuve et finalise sans recréditer.
4. L'application relit la sauvegarde (`SaveSync.pull`) et reporte le crédit sur la copie locale une seule fois par entrée
   (`mergeGrants`), sans perdre la progression locale non envoyée. Réponse perdue : le crédit est repris au lancement
   suivant (`reconcile`). L'ancienne file `cubelyo.purchases.v1` n'est plus alimentée ; `Game.tsx` la crédite encore
   une fois par jeton pour les achats d'anciennes versions.
5. Au lancement et via Réglages › Restaurer les achats : `queryPurchases` revérifie tout (paiements en attente devenus payés,
   droit « sans publicité » sur un nouvel appareil).
6. Bonus du `noads_pack` (indices, gommes) : même registre que les pièces ; la restauration rend ensuite le droit sans
   publicité seulement. Tests de non-régression : `src/features/billing/cut.test.ts` (coupures, appels simultanés,
   réinstallation) et `tests-firebase/attribution.test.ts` (Firestore et Auth réels sur émulateurs).

Limites connues :
- Nouvelle identité anonyme (réinstallation, effacement des données Android, autre appareil) : les pièces et packs
  restent dans l'ancienne sauvegarde, inaccessible. Les rendre exigerait une identité récupérable (connexion Google /
  Play Games liée à Firebase) : non proposé.
- Même compte Google sur deux appareils : le premier qui vérifie un achat en reçoit le contenu.
- Anciennes versions de l'application (sans jeton d'identité) : 401, l'achat reste ouvert, Google le rembourse après
  3 jours s'il n'est pas finalisé.
- Finalisation interrompue et jamais reprise dans les 3 jours : Google rembourse, le crédit reste acquis.

La route est un fichier `.ts` : elle n'existe que sur Vercel ; l'export statique Android ne garde que les `.tsx` (`pageExtensions`).

## Configuration (une fois)

1. Google Cloud : créer un compte de service, activer l'API « Google Play Android Developer API », créer une clé JSON.
2. Play Console › Utilisateurs et autorisations : inviter l'e-mail du compte de service, autorisations de l'application Cubelyo :
   « Afficher les données financières » et « Gérer les commandes et les abonnements ».
3. Vercel (projet Cubelyo, Production) : `GOOGLE_PLAY_CLIENT_EMAIL` = `client_email` du JSON, `GOOGLE_PLAY_PRIVATE_KEY` = `private_key`
   (les `\n` littéraux sont acceptés). Redéployer.
4. Play Console › Tests de licence : ajouter les comptes testeurs (achats de test sans débit).

5. Vercel : `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` (compte de service
   Firebase, rôle limité à Firestore et Auth) — voir `docs/firebase-android.md`. Sans elles, les pièces et packs répondent
   503 `unavailable` ; `noads` fonctionne sans.

Sans ces variables, la route répond 503 `unavailable` et l'achat reste en attente côté Google (remboursé au bout de 3 jours s'il n'est jamais accusé).
