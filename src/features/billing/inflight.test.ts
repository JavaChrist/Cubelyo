import { describe, expect, it } from "vitest";
import { createInFlight } from "./inflight";

describe("vérification partagée d'un même achat", () => {
  it("lance une seule vérification pour deux appels simultanés", async () => {
    const share = createInFlight<string>();
    let calls = 0;
    const run = async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 5));
      return "granted";
    };
    const [a, b] = await Promise.all([share("t1", run), share("t1", run)]);
    expect([a, b]).toEqual(["granted", "granted"]);
    expect(calls).toBe(1);
  });

  it("relance après la fin ou l'échec de la précédente", async () => {
    const share = createInFlight<string>();
    await expect(
      share("t1", async () => {
        throw new Error("x");
      }),
    ).rejects.toThrow("x");
    await expect(share("t1", async () => "ok")).resolves.toBe("ok");
  });

  it("garde les achats différents séparés", async () => {
    const share = createInFlight<string>();
    let calls = 0;
    const run = async () => `${++calls}`;
    await Promise.all([share("a", run), share("b", run)]);
    expect(calls).toBe(2);
  });
});
