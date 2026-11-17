import type { Grant, PlayProduct } from "./products";

/**
 * Décision sur un achat Google Play, sans réseau (testée). Seul compte le relevé officiel
 * `purchases.products.get` de l'API Google Play Developer, jamais ce que l'application transmet.
 */

/** Relevé `purchases.products.get` (API Google Play Developer v3), champs utilisés seulement. */
export interface PlayProductPurchase {
  /** 0 acheté, 1 annulé, 2 en attente. */
  purchaseState?: number;
  /** 0 à consommer, 1 consommé. */
  consumptionState?: number;
  /** 0 pas encore accusé, 1 accusé. */
  acknowledgementState?: number;
  /** 0 test (testeur de licence), 1 code promo, 2 récompense. Absent pour un achat réel. */
  purchaseType?: number;
}

/** Les jetons Play sont opaques ; on refuse l'absurde avant tout appel réseau. */
export const isPlausiblePurchaseToken = (token: unknown): token is string =>
  typeof token === "string" &&
  token.length >= 20 &&
  token.length <= 4096 &&
  /^[A-Za-z0-9._:-]+$/.test(token);

export const NO_GRANT: Grant = { coins: 0, hints: 0, erasers: 0, wands: 0 };

export type PlayDecision =
  | { status: "pending" | "canceled" | "rejected" }
  | {
      status: "owned";
      /** Déjà consommé (lot) ou accusé (sans publicité) chez Google : plus rien à finaliser. */
      finalized: boolean;
      /** Opération Google qui clôt l'achat, faite seulement après l'attribution (settle.ts). */
      finish: "consume" | "acknowledge";
    };

/**
 * État de l'achat chez Google. Le crédit n'est jamais décidé ici : il dépend du registre d'attribution
 * (src/server/settle.ts), pas de l'accusé de réception, qui ne prouve pas que le contenu a été enregistré.
 */
export function decidePlayPurchase(
  product: PlayProduct,
  purchase: PlayProductPurchase,
): PlayDecision {
  // Les récompenses (purchaseType 2) ne sont pas des achats ; test et code promo sont acceptés.
  if (purchase.purchaseType === 2) return { status: "rejected" };
  if (purchase.purchaseState === 2) return { status: "pending" };
  if (purchase.purchaseState !== 0) return { status: "canceled" };
  return product.consumable
    ? {
        status: "owned",
        finalized: purchase.consumptionState === 1,
        finish: "consume",
      }
    : {
        status: "owned",
        finalized: purchase.acknowledgementState === 1,
        finish: "acknowledge",
      };
}

export const isFinalized = (
  product: PlayProduct,
  purchase: PlayProductPurchase,
) =>
  product.consumable
    ? purchase.consumptionState === 1
    : purchase.acknowledgementState === 1;
