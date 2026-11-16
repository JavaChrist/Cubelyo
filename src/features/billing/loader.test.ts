import { describe, expect, it } from "vitest";
import { loadNativePlugin } from "./loader";

/** Imite le Proxy de registerPlugin (Capacitor) : toute propriété, `then` compris, est une méthode native. */
const capacitorLikePlugin = () =>
  new Proxy(
    {},
    {
      get: (_, prop) =>
        prop === "then"
          ? () => {} // méthode native inexistante : ne rappelle jamais resolve/reject
          : async () => ({ prop: String(prop) }),
    },
  );

describe("chargement du plugin Google Play", () => {
  it("se termine même si le plugin répond à `then`", async () => {
    const { plugin } = await loadNativePlugin(
      async () => ({ PlayBilling: capacitorLikePlugin() }),
      (module) => module.PlayBilling as { getProducts: () => Promise<unknown> },
    );
    await expect(plugin.getProducts()).resolves.toEqual({
      prop: "getProducts",
    });
  });
});
