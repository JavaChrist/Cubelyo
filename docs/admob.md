# Annonces Google AdMob (application Android)

Bannière AdMob de Cubelyo, dans l'application Android Capacitor. Le service est repris de GéoFR (`Geo-Europe/docs/admob.md`), adapté à Cubelyo.

État : **identifiants de démonstration Google** (`src/features/ads/ads.json`, `mode: "test"`). Les vrais identifiants arrivent quand l'app AdMob et son bloc de bannière sont créés.

## Pile

| Élément | Version |
| --- | --- |
| `@capacitor-community/admob` | 8.4.0 (GéoFR : 8.3.0) |
| `play-services-ads` | 25.5.0 (`android/variables.gradle`) |
| User Messaging Platform | 4.0.0 |

`android/app/build.gradle` lit `androidAppId` dans `ads.json`, refuse un éditeur autre que JavaChrist (ou la démo Google) et le pose dans le manifeste (`APPLICATION_ID`). Le manifeste retire `AD_ID` et les permissions `adservices` : l'identifiant publicitaire Android n'est jamais collecté.

## Ce qui est affiché

| Élément | Règle |
| --- | --- |
| Bannière adaptative | Collée en bas de l'écran (margin 0), sur l'accueil, la tour et la boutique |
| Place réservée | `--ad-banner-h` remonte la barre de navigation flottante et réserve la hauteur dans les écrans (`globals.css`) |
| Masquée | Pendant un niveau, une modale, une carte de récompense, l'accueil de bienvenue, la question d'âge et la vidéo de promotion (`useHideAdBanner`) |
| Interstitiel, vidéo récompensée | Jamais. Aucune publicité récompensée |
| Web | Jamais : le plugin n'est chargé que dans l'application native |

À vérifier sur un vrai appareil : position au-dessus de la barre système Android.

## Qui voit une annonce

`mayRequestBanner` (`src/features/ads/rules.ts`), lu par `AdsProvider.tsx`. Aucune requête si :

- ce n'est pas l'application native ;
- `ads.json` est invalide (`adsConfigErrors`) ;
- les droits ne sont pas chargés ;
- `adsRemoved` est vrai (achat « Sans publicité » ou « Pack sans publicité » vérifié par le serveur, voir `docs/billing.md` et `entitlements.ts`).

Si `adsRemoved` passe à vrai, la bannière est retirée au rendu suivant.

## Âge et consentement

La réponse à « Avez-vous 18 ans ou plus ? » vient des promotions (`cubelyo.promotions.v1`, sur l'appareil).

| Réponse | Réglage des demandes |
| --- | --- |
| Adulte | SDK initialisé (classification G), formulaire UMP de Google résolu avant toute requête ; bannière seulement si `canRequestAds` ; bouton « Choix publicitaires » dans les réglages quand UMP l'exige |
| Mineur, « Plus tard » ou sans réponse (premier lancement compris) | AdMob désactivé : ni initialisation, ni UMP, ni requête. Promotions JavaChrist désactivées aussi |

La question d'âge n'est posée qu'avant la première promotion due (3 victoires) : aucune bannière avant une réponse « adulte ».
TFCD et TFUA ne sont plus transmis : dépréciés depuis le SDK Android 25.3.0 au profit de `setAgeRestrictedTreatment`, que le plugin
Capacitor 8.4 n'expose pas ; le public restreint n'atteint plus le SDK, ils sont donc inutiles.

## Passer en annonces réelles

1. Créer l'app Android « Cubelyo » dans AdMob (éditeur `ca-app-pub-8288172940135426`) et un bloc **Bannière**.
2. Mettre dans `ads.json` : `mode: "live"`, `androidAppId` (`~…`), `androidBannerAdUnitId` (`/…`). Ajouter l'identifiant du téléphone de test dans `testDevices`.
3. `public/app-ads.txt` est servi sur le domaine du site déclaré dans la fiche Play.
4. Tests : `npx vitest run src/features/ads`.
