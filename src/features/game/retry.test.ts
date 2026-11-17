import { describe, expect, it } from "vitest";
import { isFreeRetry } from "./retry";

const session = { index: 4, removed: ["a", "b"], blocked: ["r1"] };
const last = { index: 4, id: "r1", removed: 2 };

describe("isFreeRetry", () => {
  it("ne retire pas de cœur pour la même flèche rouge, cube inchangé", () => {
    expect(isFreeRetry(last, session, "r1")).toBe(true);
  });
  it("première erreur : un cœur", () => {
    expect(isFreeRetry(null, session, "r1")).toBe(false);
  });
  it("autre flèche : un cœur", () => {
    expect(isFreeRetry(last, { ...session, blocked: ["r1", "r2"] }, "r2")).toBe(
      false,
    );
  });
  it("une flèche est sortie depuis : nouvelle erreur", () => {
    expect(
      isFreeRetry(last, { ...session, removed: ["a", "b", "c"] }, "r1"),
    ).toBe(false);
  });
  it("cube recommencé ou autre niveau : nouvelle erreur", () => {
    expect(isFreeRetry(last, { ...session, blocked: [] }, "r1")).toBe(false);
    expect(isFreeRetry(last, { ...session, index: 5 }, "r1")).toBe(false);
  });
});
