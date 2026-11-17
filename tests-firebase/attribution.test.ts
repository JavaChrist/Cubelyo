import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { initializeApp, deleteApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, signInAnonymously } from "firebase/auth";
import {
  initializeFirestore,
  connectFirestoreEmulator,
  doc,
  getDocFromServer,
  terminate,
  type Firestore,
} from "firebase/firestore";
import { cloudRepository } from "../src/features/cloud/repository";
import { SaveSync } from "../src/features/cloud/sync";
import { SAVE_KEY, newProfile } from "../src/features/progression/profile";
import { entriesOf } from "../src/features/billing/attribution";
import { playProduct } from "../src/features/billing/products";
import type { PlayProductPurchase } from "../src/features/billing/verify";
import {
  attributionId,
  settlePlayPurchase,
  type PlayGateway,
} from "../src/server/settle";
import { REGISTRY, firestoreAttributionStore } from "../src/server/attribution-store";
import { adminAuth, adminDb } from "../src/server/firebase-admin";

/**
 * Registre des achats avec Firebase Admin réel (émulateurs) : transactions Firestore véritables,
 * vérification du jeton d'identité, règles de sécurité de l'application.
 */
const projectId = "demo-cubelyo";
process.env.FIREBASE_ADMIN_PROJECT_ID = projectId;
let environment: RulesTestEnvironment;
const apps: { app: FirebaseApp; db: Firestore }[] = [];

async function player() {
  const app = initializeApp(
    { apiKey: "demo-api-key", projectId, appId: "demo-app" },
    `buyer-${crypto.randomUUID()}`,
  );
  const auth = getAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const db = initializeFirestore(app, {});
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  apps.push({ app, db });
  const { user } = await signInAnonymously(auth);
  const repo = cloudRepository(db, user.uid);
  const map = new Map<string, string>([[SAVE_KEY, JSON.stringify(newProfile())]]);
  const storage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  };
  const granted: unknown[] = [];
  const sync = new SaveSync(
    repo,
    `${projectId}/${user.uid}`,
    storage,
    (raw) => storage.setItem(SAVE_KEY, raw),
    () => {},
    (_raw, entries) => granted.push(entries),
  );
  return { user, db, repo, storage, sync, granted };
}

function google(): PlayGateway & { purchase: PlayProductPurchase } {
  const purchase: PlayProductPurchase = {
    purchaseState: 0,
    consumptionState: 0,
    acknowledgementState: 0,
  };
  return {
    purchase,
    async fetch() {
      return { ...purchase };
    },
    async consume() {
      if (purchase.consumptionState === 1) throw new Error("already");
      purchase.consumptionState = 1;
    },
    async acknowledge() {
      if (purchase.acknowledgementState === 1) throw new Error("already");
      purchase.acknowledgementState = 1;
    },
  };
}

beforeAll(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST)
    throw new Error("Émulateurs requis ; ne jamais utiliser un projet réel pour ces tests.");
  environment = await initializeTestEnvironment({
    projectId,
    firestore: { rules: readFileSync("firebase/firestore.rules", "utf8") },
  });
});
beforeEach(async () => {
  await environment.clearFirestore();
});
afterAll(async () => {
  for (const a of apps) {
    await terminate(a.db);
    await deleteApp(a.app);
  }
  await environment?.cleanup();
});

describe("registre d'attribution (Firebase Admin, émulateurs)", () => {
  const token = `emulator-token-${"y".repeat(40)}`;
  const product = playProduct("coins_220000")!;

  it("jeton d'identité vérifié, crédit et preuve atomiques, report sur l'appareil", async () => {
    const buyer = await player();
    await buyer.sync.start();
    const idToken = await buyer.user.getIdToken();
    const uid = (await adminAuth().verifyIdToken(idToken)).uid;
    expect(uid).toBe(buyer.user.uid);

    const play = google();
    const result = await settlePlayPurchase(
      { play, store: firestoreAttributionStore(adminDb()) },
      { product, token, uid },
    );
    expect(result).toMatchObject({ status: "granted", credited: true });
    expect(play.purchase.consumptionState).toBe(1);

    const proof = await adminDb().collection(REGISTRY).doc(attributionId(token)).get();
    expect(proof.data()).toMatchObject({ uid, productId: product.id });
    expect(proof.get("finalizedAt")).not.toBeNull();
    expect(JSON.stringify(proof.data())).not.toContain(token);

    await buyer.sync.pull();
    expect(buyer.granted).toHaveLength(1);
    const remote = await buyer.repo.read();
    expect(remote!.profile).toBe(buyer.storage.getItem(SAVE_KEY));
    expect(entriesOf(remote!.profile)).toHaveLength(1);
  });

  it("10 appels simultanés : une seule attribution réelle", async () => {
    const buyer = await player();
    await buyer.sync.start();
    const before = JSON.parse((await buyer.repo.read())!.profile).coins as number;
    const play = google();
    const store = firestoreAttributionStore(adminDb());
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        settlePlayPurchase({ play, store }, { product, token, uid: buyer.user.uid }),
      ),
    );
    expect(results.filter((r) => "credited" in r && r.credited)).toHaveLength(1);
    for (const r of results) expect("error" in r).toBe(false);
    const after = JSON.parse((await buyer.repo.read())!.profile);
    expect(after.coins).toBe(before + product.grant.coins);
    expect(after.purchases).toHaveLength(1);
  });

  it("l'application ne peut ni lire ni écrire le registre", async () => {
    const buyer = await player();
    await buyer.sync.start();
    await settlePlayPurchase(
      { play: google(), store: firestoreAttributionStore(adminDb()) },
      { product, token, uid: buyer.user.uid },
    );
    await assertFails(getDocFromServer(doc(buyer.db, REGISTRY, attributionId(token))));
  });

  it("nouvelle identité anonyme (réinstallation) : rien recrédité", async () => {
    const first = await player();
    await first.sync.start();
    const play = google();
    const store = firestoreAttributionStore(adminDb());
    await settlePlayPurchase({ play, store }, { product, token, uid: first.user.uid });
    const second = await player();
    await second.sync.start();
    const before = (await second.repo.read())!.profile;
    expect(
      await settlePlayPurchase({ play, store }, { product, token, uid: second.user.uid }),
    ).toEqual({ status: "consumed" });
    expect((await second.repo.read())!.profile).toBe(before);
  });
});
