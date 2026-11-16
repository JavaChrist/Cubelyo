import { describe, expect, it } from "vitest";
import { enqueueGrant, parsePurchases, settleGrant } from "./storage";

const grant = { coins: 1500, hints: 0, erasers: 0, wands: 0 };

describe("droits d'achat sur l'appareil", () => {
  it("lit un état absent ou abîmé comme vide", () => {
    expect(parsePurchases(null)).toEqual({
      adsRemoved: false,
      credited: [],
      queue: [],
    });
    expect(parsePurchases("{")).toEqual({
      adsRemoved: false,
      credited: [],
      queue: [],
    });
    expect(parsePurchases('{"adsRemoved":"yes"}').adsRemoved).toBe(false);
  });

  it("ne crédite un jeton qu'une fois", () => {
    let state = parsePurchases(null);
    state = enqueueGrant(state, {
      token: "t1",
      productId: "coins_1500",
      grant,
    });
    expect(
      enqueueGrant(state, { token: "t1", productId: "coins_1500", grant }),
    ).toBe(state);
    state = settleGrant(state, "t1");
    expect(state.queue).toEqual([]);
    expect(state.credited).toEqual(["t1"]);
    expect(
      enqueueGrant(state, { token: "t1", productId: "coins_1500", grant }),
    ).toBe(state);
  });

  it("un achat sans contenu est noté crédité sans passer par la file", () => {
    const state = enqueueGrant(parsePurchases(null), {
      token: "t2",
      productId: "noads",
      grant: { coins: 0, hints: 0, erasers: 0, wands: 0 },
    });
    expect(state.queue).toEqual([]);
    expect(state.credited).toEqual(["t2"]);
  });
});
