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
2. `BillingProvider.tsx` envoie `{productId, purchaseToken}` à `POST ${NEXT_PUBLIC_API_BASE_URL}/api/play/verify`
   (par défaut `https://cubelyo.vercel.app`).
3. `src/app/api/play/verify/route.server.ts` relit l'achat via l'API Android Publisher v3 (`src/server/google-play.ts`),
   décide (`src/features/billing/verify.ts`), puis consomme ou accuse réception, et renvoie le contenu à créditer. Rien n'est stocké.
4. `Game.tsx` crédite la file `cubelyo.purchases.v1` dans le profil, une seule fois par jeton.
5. Au lancement et via Réglages › Restaurer les achats : `queryPurchases` revérifie tout (paiements en attente devenus payés,
   droit « sans publicité » sur un nouvel appareil).

La route est un fichier `.server.ts` : elle n'existe que sur Vercel, jamais dans l'export statique Android (`pageExtensions`).

## Configuration (une fois)

1. Google Cloud : créer un compte de service, activer l'API « Google Play Android Developer API », créer une clé JSON.
2. Play Console › Utilisateurs et autorisations : inviter l'e-mail du compte de service, autorisations de l'application Cubelyo :
   « Afficher les données financières » et « Gérer les commandes et les abonnements ».
3. Vercel (projet Cubelyo, Production) : `GOOGLE_PLAY_CLIENT_EMAIL` = `client_email` du JSON, `GOOGLE_PLAY_PRIVATE_KEY` = `private_key`
   (les `\n` littéraux sont acceptés). Redéployer.
4. Play Console › Tests de licence : ajouter les comptes testeurs (achats de test sans débit).

Sans ces variables, la route répond 503 `unavailable` et l'achat reste en attente côté Google (remboursé au bout de 3 jours s'il n'est jamais accusé).
