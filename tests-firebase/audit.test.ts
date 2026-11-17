import { afterAll, describe, expect, it } from "vitest";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, connectAuthEmulator, signInAnonymously } from "firebase/auth";
import { adminAuth } from "../src/server/firebase-admin";

/**
 * Vérifie le comportement réel de `lastRefreshTime` (indicateur d'activité de l'audit) sur l'émulateur Auth :
 * il doit avancer quand l'application renouvelle son jeton d'identité.
 */
process.env.FIREBASE_ADMIN_PROJECT_ID = "demo-cubelyo";
const app = initializeApp(
  { apiKey: "demo-api-key", projectId: "demo-cubelyo", appId: "demo-app" },
  `audit-${crypto.randomUUID()}`,
);
afterAll(() => deleteApp(app));

describe("lastRefreshTime (émulateur Auth)", () => {
  it("avance au renouvellement du jeton, sans autre suivi", async () => {
    const auth = getAuth(app);
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    const { user } = await signInAnonymously(auth);
    const first = (await adminAuth().getUser(user.uid)).metadata;
    console.log("audit-probe sign-in", JSON.stringify(first));
    await new Promise((r) => setTimeout(r, 1500));
    await user.getIdToken(true);
    const second = (await adminAuth().getUser(user.uid)).metadata;
    console.log("audit-probe refresh", JSON.stringify(second));
    expect(second.lastRefreshTime).toBeTruthy();
    expect(new Date(second.lastRefreshTime!).getTime()).toBeGreaterThan(
      new Date(first.lastRefreshTime ?? first.creationTime).getTime(),
    );
    expect(second.lastSignInTime).toBe(first.lastSignInTime);
  });
});
