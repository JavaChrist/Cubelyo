import { createHash } from "node:crypto";
import { hasGrant, type PurchaseEntry } from "../features/billing/attribution";
import type { PlayProduct } from "../features/billing/products";
import {
  decidePlayPurchase,
  isFinalized,
  type PlayProductPurchase,
} from "../features/billing/verify";

/**
 * Règlement d'un achat Google Play, sans dépendance réseau directe (testé avec des doublures).
 * Ordre imposé, pour qu'aucune coupure ne fasse perdre ni doubler le contenu :
 * 1. relevé Google (`purchases.products.get`) ;
 * 2. transaction Firestore : crédit dans la sauvegarde du joueur ET preuve d'attribution au jeton, ensemble ou rien ;
 * 3. seulement ensuite, consommation ou accusé de réception chez Google ;
 * 4. une coupure entre 2 et 3 laisse l'achat ouvert chez Google : le prochain essai trouve la preuve,
 *    ne recrédite pas et finalise (reprise).
 */
export type AttributionOutcome = "credited" | "exists" | "saveRequired";

export interface AttributionStore {
  /** Transaction : si le jeton n'a pas de preuve, crédite la sauvegarde de `uid` et écrit la preuve. */
  attribute(
    id: string,
    uid: string,
    entry: PurchaseEntry,
  ): Promise<AttributionOutcome>;
  /** Note la finalisation Google dans la preuve (information d'audit, sans effet sur le crédit). */
  finalized(id: string): Promise<void>;
}

export interface PlayGateway {
  fetch(productId: string, token: string): Promise<PlayProductPurchase | null>;
  consume(productId: string, token: string): Promise<void>;
  acknowledge(productId: string, token: string): Promise<void>;
}

export type SettleResult =
  | { status: "pending" | "canceled" | "rejected" | "consumed" }
  | { status: "granted"; adsRemoved: boolean; credited: boolean }
  | { error: "authRequired" | "saveRequired" };

/** Identifiant de la preuve : empreinte du jeton, le jeton lui-même n'est jamais conservé. */
export const attributionId = (token: string) =>
  createHash("sha256").update(token).digest("hex").slice(0, 40);

export async function settlePlayPurchase(
  deps: { play: PlayGateway; store: AttributionStore },
  input: { product: PlayProduct; token: string; uid: string | null },
): Promise<SettleResult> {
  const { product, token, uid } = input;
  const purchase = await deps.play.fetch(product.id, token);
  if (!purchase) return { status: "rejected" };
  const decision = decidePlayPurchase(product, purchase);
  if (decision.status !== "owned") return decision;

  const finish = async () => {
    try {
      if (decision.finish === "consume")
        await deps.play.consume(product.id, token);
      else await deps.play.acknowledge(product.id, token);
    } catch (error) {
      // Appel concurrent déjà passé : l'achat est clos, ce n'est pas un échec.
      const again = await deps.play.fetch(product.id, token);
      if (!again || !isFinalized(product, again)) throw error;
    }
  };

  // « Sans publicité » simple : aucun contenu à créditer, le droit est tenu par Google Play.
  if (!hasGrant(product.grant)) {
    if (!decision.finalized) await finish();
    return { status: "granted", adsRemoved: product.removesAds, credited: false };
  }

  // Déjà clos chez Google : attribué plus tôt (preuve au registre) ou par une version antérieure au registre.
  // Jamais recrédité ; le droit sans publicité est restauré.
  if (decision.finalized)
    return product.consumable
      ? { status: "consumed" }
      : { status: "granted", adsRemoved: product.removesAds, credited: false };

  // Le crédit va dans la sauvegarde en ligne : identité anonyme vérifiée obligatoire.
  if (!uid) return { error: "authRequired" };
  const id = attributionId(token);
  const outcome = await deps.store.attribute(id, uid, {
    id,
    product: product.id,
    grant: { ...product.grant },
  });
  if (outcome === "saveRequired") return { error: "saveRequired" };
  await finish();
  await deps.store.finalized(id).catch(() => {});
  return {
    status: "granted",
    adsRemoved: product.removesAds,
    credited: outcome === "credited",
  };
}
