import { describe, expect, it, vi } from "vitest";
import { EraseError, eraseFailureMessage, withTimeout } from "./erase";

describe("effacement", () => {
  it("un serveur muet donne un échec explicite, pas une attente infinie", async () => {
    vi.useFakeTimers();
    const pending = withTimeout(new Promise(() => {}), 15000);
    const check = expect(pending).rejects.toMatchObject({ reason: "timeout" });
    await vi.advanceTimersByTimeAsync(15000);
    await check;
    vi.useRealTimers();
  });
  it("une réponse à temps passe, une erreur reste une erreur", async () => {
    await expect(withTimeout(Promise.resolve(1), 50)).resolves.toBe(1);
    await expect(withTimeout(Promise.reject(new Error("x")), 50)).rejects.toThrow("x");
  });
  it("messages : jamais de succès, état local décrit", () => {
    expect(eraseFailureMessage(new EraseError("offline"))).toMatch(/rien n’a été effacé/);
    expect(eraseFailureMessage(new EraseError("timeout"))).toMatch(/pas confirmé/);
    expect(eraseFailureMessage(new Error("firebase"))).toMatch(/non terminé/);
  });
});
