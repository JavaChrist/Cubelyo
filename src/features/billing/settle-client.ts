import { hasGrant } from "./attribution";
import { playProduct } from "./products";
import type { PlayPurchase } from "./plugin";
import {
  CloudRequiredError,
  type PurchaseSession,
} from "../cloud/purchase";

/**
 * Règlement d'un achat de l'appareil par l'application (sans React, testé avec des doublures).
 * Le serveur (/api/play/verify) décide ; l'application ne crédite jamais seule.
 */
export type Verified =
  | { status: "granted"; adsRemoved: boolean; credited: boolean }
  | { status: "pending" | "canceled" | "consumed" | "rejected" };

export type Settled = Verified["status"] | "skipped";

/** Réponse du serveur sans crédit possible pour l'instant (identité ou sauvegarde en ligne manquante). */
export class VerifyError extends Error {
  constructor(readonly status: number) {
    super(`verify-${status}`);
  }
}

export type SettleDeps = {
  verify: (
    productId: string,
    purchaseToken: string,
    idToken?: string,
  ) => Promise<Verified>;
  /** Sauvegarde en ligne prête pour un crédit ; lève CloudRequiredError sinon. */
  session: () => Promise<PurchaseSession>;
  /** Droit « sans publicité » confirmé par le serveur. */
  removeAds: () => void;
};

/**
 * Achat avec contenu (pièces, bonus) : le serveur crédite la sauvegarde en ligne et enregistre la preuve
 * d'attribution dans la même transaction, puis finalise l'achat chez Google. L'application reporte ensuite
 * le crédit depuis la sauvegarde (une fois par achat, voir cloud/sync.ts). Aucun crédit purement local.
 *
 * Sauvegarde en ligne indisponible : l'achat est tout de même présenté au serveur sans identité.
 * Déjà clos chez Google (consommé par le serveur, mais encore listé par le cache de Google Play),
 * il est réglé sans sauvegarde ; encore ouvert, le serveur exige l'identité (401) et l'erreur
 * de sauvegarde en ligne est remontée telle quelle, pour un message précis.
 */
export async function settleWith(
  deps: SettleDeps,
  purchase: PlayPurchase,
): Promise<Settled> {
  const productId = purchase.productIds.find((id) => playProduct(id));
  const product = productId ? playProduct(productId) : undefined;
  if (!productId || !product) return "skipped";
  if (purchase.state !== "PURCHASED") return "pending";
  const token = purchase.purchaseToken;
  let result: Verified;
  if (!hasGrant(product.grant)) result = await deps.verify(productId, token);
  else {
    let session: PurchaseSession;
    try {
      session = await deps.session();
    } catch (error) {
      if (!(error instanceof CloudRequiredError)) throw error;
      try {
        result = await deps.verify(productId, token);
      } catch (verifyError) {
        if (verifyError instanceof VerifyError && verifyError.status === 401)
          throw error;
        throw verifyError;
      }
      return finish(deps, result);
    }
    try {
      result = await deps.verify(productId, token, session.idToken);
    } catch (error) {
      // Sauvegarde en ligne pas encore créée côté serveur : envoi, puis un seul nouvel essai.
      if (!(error instanceof VerifyError) || error.status !== 409) throw error;
      if (!(await session.flush())) throw error;
      result = await deps.verify(productId, token, session.idToken);
    }
    if (result.status === "granted" || result.status === "consumed")
      await session.pull();
  }
  return finish(deps, result);
}

function finish(deps: SettleDeps, result: Verified): Settled {
  if (result.status === "granted" && result.adsRemoved) deps.removeAds();
  return result.status;
}
