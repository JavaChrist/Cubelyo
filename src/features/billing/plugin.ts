import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";

/** Plugin natif local `PlayBillingPlugin.java` (android/app/src/main/java/fr/javachrist/cubelyo). */
export interface PlayPurchase {
  purchaseToken: string;
  productIds: string[];
  orderId?: string | null;
  acknowledged: boolean;
  state: "PURCHASED" | "PENDING" | "UNSPECIFIED";
}

export type UnfetchedReason = "invalidId" | "notFound" | "noOffer" | "unknown";

export interface PlayBillingPlugin {
  getProducts(options: { productIds: string[] }): Promise<{
    products: {
      productId: string;
      formattedPrice: string;
      priceMicros: number;
      currency: string;
    }[];
    /** Produits non rendus par Google Play, avec la raison (diagnostic affiché dans la boutique). */
    unfetched?: { productId: string; reason: UnfetchedReason }[];
  }>;
  purchase(options: { productId: string }): Promise<{
    status: "purchased" | "pending" | "canceled" | "alreadyOwned" | "error";
    purchase?: PlayPurchase;
    code?: number;
  }>;
  queryPurchases(): Promise<{ purchases: PlayPurchase[] }>;
  addListener(
    event: "purchaseUpdated",
    listener: (purchase: PlayPurchase) => void,
  ): Promise<PluginListenerHandle>;
}

export const PlayBilling = registerPlugin<PlayBillingPlugin>("PlayBilling");
