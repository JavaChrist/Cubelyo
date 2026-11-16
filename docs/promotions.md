# Promotions JavaChrist (vidéos entre deux niveaux)

Courtes vidéos présentant les autres applications de JavaChrist. Même catalogue et mêmes règles que GéoFR (`Geo-Europe/docs/promotions.md`).

## Règles

| Règle | Valeur |
| --- | --- |
| Fréquence | Une vidéo toutes les 3 victoires (`PROMO_RULES.gamesBetween`) |
| Moment | Après la victoire, au premier moment calme : aucun niveau en cours, aucune modale ni carte de récompense, puis `resultDelayMs` |
| Public | Adultes déclarés seulement. Mineur ou sans réponse : jamais de vidéo, catalogue jamais chargé |
| Durée | 15 s au plus ; fermeture à la fin, plus tôt si la vidéo échoue, bloque ou passe en arrière-plan |
| Son | Coupé au départ, au choix du joueur |
| Achat sans publicité | Plus aucune vidéo (`adsRemoved`) |
| Une victoire compte | Seulement si le niveau n'était pas déjà gagné (pas au rechargement) |

## Question d'âge

Posée une seule fois, juste avant la première vidéo due. Trois choix : adulte, mineur, « Plus tard » (la question revient). La réponse reste sur l'appareil et règle aussi la bannière AdMob (`docs/admob.md`). Elle s'efface depuis Réglages › Confidentialité ou avec l'effacement de la sauvegarde (`eraseSaveData`).

## Catalogue

- Projet Firebase `motissimo-456ba`, lu en REST Firestore (lecture seule), `sourceAppId: "cubelyo"`, langue `fr`.
- Cache 15 min, copie de secours jusqu'à 1 h, délai réseau 3 s.
- Les campagnes se gèrent dans JavaChrist-Promotions : **ajouter `cubelyo` dans l'onglet Applications** pour qu'elles le ciblent.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `src/features/promotions/rules.ts` | Règles pures, validation des campagnes, choix de la campagne |
| `src/features/promotions/storage.ts` | État local `cubelyo.promotions.v1`, cache du catalogue |
| `src/features/promotions/PromotionProvider.tsx` | Enchaînement victoire → attente → question → vidéo |
| `src/features/promotions/AgeQuestion.tsx`, `PromoPlayer.tsx` | Interfaces |

Tests : `npx vitest run src/features/promotions`.
