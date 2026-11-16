import { useSyncExternalStore } from "react";
import { readPurchases, subscribePurchases } from "../billing/storage";

/**
 * Droits d'achat qui touchent à la publicité. Un seul droit, `adsRemoved`, coupe à la fois la bannière AdMob
 * et les promotions JavaChrist : offres « Sans publicité » (`noads`) et « Pack sans publicité » (`noads_pack`).
 * Lu dans `cubelyo.purchases.v1`, tenu à jour par BillingProvider (achats Google Play vérifiés par le serveur).
 * Au rendu serveur et à l'hydratation, `ready` est faux : aucune annonce dans le doute.
 */
export interface AdEntitlements {
  /** Droits lus. Tant qu'ils chargent, ni bannière ni promotion. */
  ready: boolean;
  /** Achat sans publicité vérifié sur cet appareil. */
  adsRemoved: boolean;
}

const LOADING: AdEntitlements = { ready: false, adsRemoved: false };
const FREE: AdEntitlements = { ready: true, adsRemoved: false };
const PAID: AdEntitlements = { ready: true, adsRemoved: true };

export function useAdEntitlements(): AdEntitlements {
  return useSyncExternalStore(
    subscribePurchases,
    () => (readPurchases().adsRemoved ? PAID : FREE),
    () => LOADING,
  );
}
