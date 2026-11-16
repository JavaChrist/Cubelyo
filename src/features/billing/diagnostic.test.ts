import { describe, expect, it } from "vitest";
import { describeBillingError, describeUnfetched } from "./diagnostic";

describe("diagnostic Google Play de la boutique", () => {
  it("reste vide quand tous les prix sont chargés", () => {
    expect(describeUnfetched([], 10)).toBe("");
  });

  it("résume les produits manquants par raison", () => {
    expect(
      describeUnfetched(
        [
          { productId: "starter", reason: "notFound" },
          { productId: "noads", reason: "notFound" },
          { productId: "special", reason: "noOffer" },
        ],
        7,
      ),
    ).toBe("Google Play : 2 produits introuvables, 1 produit sans offre active");
  });

  it("signale une réponse vide", () => {
    expect(describeUnfetched([], 0)).toBe(
      "Google Play : aucun produit renvoyé",
    );
  });

  it("traduit les codes d'erreur du plugin", () => {
    expect(describeBillingError({ code: "billing_3" })).toBe(
      "Google Play : facturation indisponible sur cet appareil ou ce compte (code 3)",
    );
    expect(describeBillingError({ code: "billing_-1" })).toBe(
      "Google Play : service déconnecté (code -1)",
    );
    expect(describeBillingError({ code: "billing_99" })).toBe(
      "Google Play : erreur (code 99)",
    );
    expect(describeBillingError({ code: "UNIMPLEMENTED" })).toBe(
      "Google Play : module d’achat absent de cette version",
    );
    expect(describeBillingError(new Error("x"))).toBe(
      "Google Play : connexion impossible",
    );
  });
});
