import { describe, expect, it } from "vitest";
import { PLAY_PRODUCT_IDS, playProduct } from "./products";
import { decidePlayPurchase, isPlausiblePurchaseToken } from "./verify";

describe("produits Google Play", () => {
  it("liste les 10 identifiants exacts de la Play Console", () => {
    expect(PLAY_PRODUCT_IDS).toEqual([
      "starter",
      "noads_pack",
      "noads",
      "special",
      "coins_1500",
      "coins_7500",
      "coins_20000",
      "coins_45000",
      "coins_80000",
      "coins_220000",
    ]);
    for (const id of PLAY_PRODUCT_IDS)
      expect(id).toMatch(/^[a-z0-9][a-z0-9._]*$/);
  });

  it("seules les offres sans publicité sont définitives", () => {
    expect(playProduct("noads")?.consumable).toBe(false);
    expect(playProduct("noads_pack")).toMatchObject({
      consumable: false,
      removesAds: true,
      grant: { hints: 3, erasers: 3, coins: 0, wands: 0 },
    });
    expect(playProduct("special")).toMatchObject({
      consumable: true,
      grant: { coins: 4500 },
    });
    expect(playProduct("coins_220000")?.grant.coins).toBe(220000);
    expect(playProduct("noads-pack")).toBeUndefined();
  });
});

describe("décision sur un achat", () => {
  const coins = playProduct("coins_1500")!;
  const noads = playProduct("noads_pack")!;

  it("consomme un lot payé et le crédite", () => {
    expect(
      decidePlayPurchase(coins, { purchaseState: 0, consumptionState: 0 }),
    ).toEqual({
      status: "granted",
      grant: coins.grant,
      adsRemoved: false,
      finish: "consume",
    });
  });

  it("ne crédite jamais un lot déjà consommé", () => {
    expect(
      decidePlayPurchase(coins, { purchaseState: 0, consumptionState: 1 })
        .status,
    ).toBe("consumed");
  });

  it("attend un paiement en attente, refuse un achat annulé ou une récompense", () => {
    expect(decidePlayPurchase(coins, { purchaseState: 2 }).status).toBe(
      "pending",
    );
    expect(decidePlayPurchase(coins, { purchaseState: 1 }).status).toBe(
      "canceled",
    );
    expect(
      decidePlayPurchase(coins, { purchaseState: 0, purchaseType: 2 }).status,
    ).toBe("rejected");
  });

  it("accepte les achats de test des testeurs de licence", () => {
    expect(
      decidePlayPurchase(coins, {
        purchaseState: 0,
        consumptionState: 0,
        purchaseType: 0,
      }).status,
    ).toBe("granted");
  });

  it("accuse réception d'un achat sans publicité, puis le restaure", () => {
    expect(
      decidePlayPurchase(noads, { purchaseState: 0, acknowledgementState: 0 }),
    ).toMatchObject({
      adsRemoved: true,
      finish: "acknowledge",
    });
    expect(
      decidePlayPurchase(noads, { purchaseState: 0, acknowledgementState: 1 }),
    ).toMatchObject({
      adsRemoved: true,
      finish: "none",
    });
  });

  it("refuse un jeton absurde", () => {
    expect(isPlausiblePurchaseToken("abc")).toBe(false);
    expect(isPlausiblePurchaseToken("a b".repeat(10))).toBe(false);
    expect(isPlausiblePurchaseToken("opaque.token-value_1234567890:x")).toBe(
      true,
    );
  });
});
