import { CLOUD_ENABLED, CLOUD_META_KEY } from "./config";
import { CLOUD_OPTOUT_KEY, stopActiveSync } from "./sync";
import { SAVE_KEY } from "../progression/profile";
import { clearPromotions, readPromoState } from "../promotions/storage";
import { forgetCreditedPurchases, readPurchases } from "../billing/storage";
import { ERASE_TIMEOUT_MS, EraseError, withTimeout } from "./erase";

/** Toutes les données personnelles conservées par l'application pour ce joueur. */
export async function exportSaveData() {
  const raw = localStorage.getItem(SAVE_KEY);
  const promo = readPromoState();
  const result = {
    application: "Cubelyo",
    exportedAt: new Date().toISOString(),
    profile: raw ? JSON.parse(raw) : null,
    /** Droits d'achat Google Play sur l'appareil (aucun paiement ni coordonnée). */
    purchases: readPurchases(),
    /** Réponse à la question d'âge et compteur des promotions JavaChrist (le catalogue public n'est pas personnel). */
    promotions: {
      ageAnswer: promo.adult,
      gamesSinceLastPromotion: promo.completedSinceLast,
      lastPromotionShown: promo.lastShownId,
    },
    preferences: {
      cloudSyncPaused: CLOUD_ENABLED
        ? localStorage.getItem(CLOUD_OPTOUT_KEY) === "true"
        : null,
    },
    cloud: null as null | { uid: string; projectId: string; save: unknown },
  };
  // Lecture seule du serveur : la synchronisation active n'est ni arrêtée ni modifiée.
  if (CLOUD_ENABLED) {
    const { firebaseClient } = await import("./firebase");
    const client = await firebaseClient(false);
    if (client?.auth.currentUser) {
      const { exportCloudData } = await import("./account");
      result.cloud = await exportCloudData(client);
    }
  }
  return result;
}
/** Vrai si l'export contient au moins une donnée du joueur. */
export function exportHasData(data: Awaited<ReturnType<typeof exportSaveData>>) {
  const p = data.promotions;
  return Boolean(
    data.profile ||
      data.cloud ||
      p.ageAnswer !== null ||
      p.gamesSinceLastPromotion > 0 ||
      p.lastPromotionShown !== null,
  );
}
/**
 * Hors ligne : EraseError("offline") avant toute modification.
 * Serveur muet : EraseError("timeout") ; la copie locale reste, la synchro reste suspendue.
 */
export async function eraseSaveData() {
  if (CLOUD_ENABLED) {
    if (typeof navigator !== "undefined" && navigator.onLine === false)
      throw new EraseError("offline");
    localStorage.setItem(CLOUD_OPTOUT_KEY, "true");
    await stopActiveSync();
    const { firebaseClient } = await import("./firebase");
    await withTimeout(
      (async () => {
        const client = await firebaseClient(false);
        if (client?.auth.currentUser) {
          const { eraseCloudData } = await import("./account");
          await eraseCloudData(client);
        }
      })(),
      ERASE_TIMEOUT_MS,
    );
  }
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(CLOUD_META_KEY);
  // Réponse à la question d'âge, compteur et catalogue des promotions.
  clearPromotions();
  // Achats déjà crédités : oubliés avec la sauvegarde ; le droit sans publicité reste (vérifié par Google Play).
  forgetCreditedPurchases();
}
