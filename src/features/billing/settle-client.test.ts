import { describe, expect, it, vi } from "vitest";
import { CloudRequiredError } from "../cloud/purchase";
import {
  VerifyError,
  settleWith,
  type SettleDeps,
  type Verified,
} from "./settle-client";
import type { PlayPurchase } from "./plugin";

const purchase = (productId: string): PlayPurchase =>
  ({
    productIds: [productId],
    purchaseToken: `token-${"z".repeat(40)}`,
    state: "PURCHASED",
  }) as PlayPurchase;

function deps(
  answer: (idToken?: string) => Verified,
  session: SettleDeps["session"] = async () => ({
    idToken: "id-token",
    flush: async () => true,
    pull: async () => {},
  }),
) {
  const calls: (string | undefined)[] = [];
  const d: SettleDeps = {
    verify: vi.fn(async (_p, _t, idToken) => {
      calls.push(idToken);
      return answer(idToken);
    }),
    session,
    removeAds: vi.fn(),
  };
  return { d, calls };
}

describe("règlement d'un achat par l'application", () => {
  it("pièces : identité envoyée, crédit reporté depuis la sauvegarde", async () => {
    const pull = vi.fn(async () => {});
    const { d, calls } = deps(
      () => ({ status: "granted", adsRemoved: false, credited: true }),
      async () => ({ idToken: "id-token", flush: async () => true, pull }),
    );
    expect(await settleWith(d, purchase("coins_220000"))).toBe("granted");
    expect(calls).toEqual(["id-token"]);
    expect(pull).toHaveBeenCalledOnce();
  });

  it("achat déjà consommé encore listé par Google Play, sauvegarde indisponible : réglé sans erreur", async () => {
    const { d, calls } = deps(
      () => ({ status: "consumed" }),
      async () => {
        throw new CloudRequiredError("cloud-not-synced");
      },
    );
    expect(await settleWith(d, purchase("coins_220000"))).toBe("consumed");
    expect(calls).toEqual([undefined]);
  });

  it("achat encore ouvert, sauvegarde indisponible : l'erreur de sauvegarde est remontée, rien crédité", async () => {
    const cloud = new CloudRequiredError("cloud-paused");
    const { d } = deps(
      () => {
        throw new VerifyError(401);
      },
      async () => {
        throw cloud;
      },
    );
    await expect(settleWith(d, purchase("coins_220000"))).rejects.toBe(cloud);
  });

  it("serveur injoignable sans sauvegarde : l'erreur serveur reste visible", async () => {
    const { d } = deps(
      () => {
        throw new VerifyError(503);
      },
      async () => {
        throw new CloudRequiredError("cloud-unavailable");
      },
    );
    await expect(settleWith(d, purchase("coins_220000"))).rejects.toMatchObject({
      status: 503,
    });
  });

  it("sauvegarde pas encore créée côté serveur (409) : envoi puis un seul nouvel essai", async () => {
    let first = true;
    const flush = vi.fn(async () => true);
    const pull = vi.fn(async () => {});
    const { d, calls } = deps(
      () => {
        if (first) {
          first = false;
          throw new VerifyError(409);
        }
        return { status: "granted", adsRemoved: false, credited: true };
      },
      async () => ({ idToken: "id-token", flush, pull }),
    );
    expect(await settleWith(d, purchase("coins_220000"))).toBe("granted");
    expect(calls).toEqual(["id-token", "id-token"]);
    expect(flush).toHaveBeenCalledOnce();
    expect(pull).toHaveBeenCalledOnce();
  });

  it("sans publicité : aucune session, droit confirmé", async () => {
    const session = vi.fn(async () => {
      throw new Error("ne doit pas être appelé");
    });
    const { d, calls } = deps(
      () => ({ status: "granted", adsRemoved: true, credited: false }),
      session,
    );
    expect(await settleWith(d, purchase("noads"))).toBe("granted");
    expect(session).not.toHaveBeenCalled();
    expect(calls).toEqual([undefined]);
    expect(d.removeAds).toHaveBeenCalledOnce();
  });

  it("paiement en attente : rien n'est envoyé", async () => {
    const { d } = deps(() => ({ status: "consumed" }));
    expect(
      await settleWith(d, { ...purchase("coins_220000"), state: "PENDING" } as PlayPurchase),
    ).toBe("pending");
    expect(d.verify).not.toHaveBeenCalled();
  });
});
