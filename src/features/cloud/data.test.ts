import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();
const storage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};
vi.stubGlobal("localStorage", storage);
vi.stubGlobal("window", { localStorage: storage, setTimeout, clearTimeout });

const { exportSaveData, exportHasData } = await import("./data");
const { PROMOTIONS_KEY } = await import("../promotions/storage");

describe("export", () => {
  beforeEach(() => store.clear());
  it("contient la réponse d'âge et le compteur des promotions, sans le catalogue", async () => {
    store.set(
      PROMOTIONS_KEY,
      JSON.stringify({
        version: 1,
        state: { completedSinceLast: 2, lastShownId: "promo-a", adult: "minor" },
        catalog: { fetchedAt: 1, campaigns: [] },
      }),
    );
    const data = await exportSaveData();
    expect(data.promotions).toEqual({
      ageAnswer: "minor",
      gamesSinceLastPromotion: 2,
      lastPromotionShown: "promo-a",
    });
    expect(JSON.stringify(data)).not.toContain("campaigns");
    expect(exportHasData(data)).toBe(true);
  });
  it("appareil vierge : rien à exporter", async () => {
    expect(exportHasData(await exportSaveData())).toBe(false);
  });
  it("l'export n'arrête jamais la synchronisation", async () => {
    const { readFileSync } = await import("node:fs");
    const code = readFileSync(new URL("./data.ts", import.meta.url), "utf8");
    const body = code.slice(code.indexOf("export async function exportSaveData"), code.indexOf("export function exportHasData"));
    expect(body).not.toMatch(/stopActiveSync|CLOUD_OPTOUT_KEY, "true"/);
  });
});
