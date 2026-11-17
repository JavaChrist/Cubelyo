import { describe, expect, it } from "vitest";
import { auditReport, lastActivity } from "./audit";

const NOW = new Date("2026-11-17T12:00:00Z");
const ago = (months: number) => {
  const d = new Date(NOW);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d;
};
const user = (uid: string, refreshMonthsAgo: number | null) => ({
  uid,
  creationTime: ago(30).toUTCString(),
  lastSignInTime: ago(30).toUTCString(),
  lastRefreshTime: refreshMonthsAgo === null ? null : ago(refreshMonthsAgo).toUTCString(),
});

describe("audit des sauvegardes inactives (lecture seule)", () => {
  it("inactive seulement si sauvegarde ET identité sans activité depuis 12 mois", () => {
    const report = auditReport(
      [
        { uid: "recent", updatedAt: ago(1), purchases: 0 },
        { uid: "old-but-active", updatedAt: ago(14), purchases: 0 }, // joue sans rien changer
        { uid: "gone", updatedAt: ago(13), purchases: 2 },
        { uid: "never-refreshed", updatedAt: ago(25), purchases: 0 },
        { uid: "orphan", updatedAt: ago(13), purchases: 0 },
        { uid: "undated", updatedAt: null, purchases: 0 },
      ],
      [
        user("recent", 0),
        user("old-but-active", 0),
        user("gone", 13),
        user("never-refreshed", null),
        user("undated", 20),
      ],
      NOW,
    );
    expect(report).toMatchObject({
      saves: 6,
      identities: 5,
      inactive: 3,
      inactiveWithPurchases: 1,
      orphanSaves: 1,
      undated: 1,
      ageBuckets: { "<3m": 1, "3-6m": 0, "6-12m": 0, "12-24m": 3, ">24m": 1 },
    });
  });

  it("le rapport ne contient aucun identifiant", () => {
    const text = JSON.stringify(
      auditReport([{ uid: "secret-uid", updatedAt: ago(20), purchases: 0 }], [], NOW),
    );
    expect(text).not.toContain("secret-uid");
  });

  it("dernière activité : renouvellement, sinon connexion, sinon création", () => {
    expect(lastActivity(user("a", 2))!.getTime()).toBe(new Date(ago(2).toUTCString()).getTime());
    expect(lastActivity({ uid: "b", creationTime: ago(5).toUTCString() })).not.toBeNull();
    expect(lastActivity({ uid: "c", creationTime: "n/a" })).toBeNull();
  });
});
