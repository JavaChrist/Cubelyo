import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
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
  setDoc,
  getDocFromServer,
  serverTimestamp,
  terminate,
  disableNetwork,
  enableNetwork,
  type Firestore,
} from "firebase/firestore";
import { cloudRepository } from "../src/features/cloud/repository";
import { SaveConflict } from "../src/features/cloud/contracts";
import { SaveSync } from "../src/features/cloud/sync";
import { SAVE_KEY, newProfile } from "../src/features/progression/profile";
import { exportCloudData, eraseCloudData } from "../src/features/cloud/account";
const projectId = "demo-cubelyo";
let environment: RulesTestEnvironment;
const clients: { app: FirebaseApp; db: Firestore }[] = [];
async function client(anonymous = true) {
  const app = initializeApp(
    { apiKey: "demo-api-key", projectId, appId: "demo-app" },
    `test-${crypto.randomUUID()}`,
  );
  const auth = getAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const db = initializeFirestore(app, {});
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  clients.push({ app, db });
  if (anonymous) await signInAnonymously(auth);
  return { auth, db, projectId };
}
beforeAll(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST)
    throw new Error(
      "Émulateurs requis ; ne jamais utiliser un projet réel pour ces tests.",
    );
  environment = await initializeTestEnvironment({
    projectId,
    firestore: { rules: readFileSync("firebase/firestore.rules", "utf8") },
  });
});
beforeEach(async () => {
  await environment.clearFirestore();
});
afterAll(async () => {
  for (const c of clients) {
    await terminate(c.db);
    await deleteApp(c.app);
  }
  await environment?.cleanup();
});
describe("Firebase réel sur émulateurs", () => {
  it("isole deux identités anonymes, refuse les écritures invalides et toute économie serveur", async () => {
    const a = await client(),
      b = await client(),
      guest = await client(false);
    const uid = a.auth.currentUser!.uid;
    const repo = cloudRepository(a.db, uid);
    await repo.write(JSON.stringify(newProfile()), 0);
    await assertFails(cloudRepository(b.db, uid).read());
    await assertFails(cloudRepository(b.db, uid).erase());
    await assertFails(cloudRepository(guest.db, uid).read());
    await assertFails(
      setDoc(doc(a.db, "players", uid, "saves", "prototype"), {
        schema: 1,
        profile: "x",
        revision: 99,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      setDoc(doc(a.db, "players", uid, "saves", "prototype"), {
        schema: 1,
        profile: "x",
        revision: 2,
        updatedAt: serverTimestamp(),
        admin: true,
      }),
    );
    await assertFails(setDoc(doc(a.db, "wallets", uid), { coins: 1000000 }));
    expect((await repo.read())?.revision).toBe(1);
  });
  it("importe le local, protège une révision concurrente et restaure le choix explicite sans addition de soldes", async () => {
    const a = await client(),
      repo = cloudRepository(a.db, a.auth.currentUser!.uid);
    const storage = new Map<string, string>();
    const browserStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    };
    const local = { ...newProfile(), coins: 120 };
    storage.set(SAVE_KEY, JSON.stringify(local));
    let state = "";
    const sync = new SaveSync(
      repo,
      "scope-a",
      browserStorage,
      (raw) => storage.set(SAVE_KEY, raw),
      (value) => {
        state = value;
      },
    );
    await sync.start();
    expect(JSON.parse((await repo.read())!.profile).coins).toBe(120);
    const concurrent = { ...local, coins: 600 };
    await repo.write(JSON.stringify(concurrent), 1);
    await expect(
      repo.write(JSON.stringify({ ...local, coins: 300 }), 1),
    ).rejects.toBeInstanceOf(SaveConflict);
    storage.set(SAVE_KEY, JSON.stringify({ ...local, coins: 200 }));
    await sync.retry();
    expect(state).toBe("conflict");
    expect(JSON.parse((await repo.read())!.profile).coins).toBe(600);
    expect(JSON.parse(storage.get(SAVE_KEY)!).coins).toBe(200);
    await sync.resolve("cloud");
    expect(JSON.parse(storage.get(SAVE_KEY)!).coins).toBe(600);
    expect(state).toBe("saved");
    storage.set(SAVE_KEY, JSON.stringify({ ...local, coins: 275 }));
    await disableNetwork(a.db);
    await sync.retry();
    expect(state).toBe("error");
    expect(JSON.parse(storage.get(SAVE_KEY)!).coins).toBe(275);
    await enableNetwork(a.db);
    await sync.retry();
    expect(JSON.parse((await repo.read())!.profile).coins).toBe(275);
    await sync.stop();
  });
  it("exporte le document du propriétaire puis supprime sa sauvegarde et son identité, sans toucher un autre joueur", async () => {
    const a = await client(),
      b = await client();
    const aUid = a.auth.currentUser!.uid,
      bUid = b.auth.currentUser!.uid;
    await cloudRepository(a.db, aUid).write(
      JSON.stringify({ ...newProfile(), hints: 9 }),
      0,
    );
    await cloudRepository(b.db, bUid).write(
      JSON.stringify({ ...newProfile(), hints: 11 }),
      0,
    );
    const exported = await exportCloudData(a);
    expect(exported?.uid).toBe(aUid);
    expect(JSON.parse(exported!.save!.profile).hints).toBe(9);
    await eraseCloudData(a);
    expect(a.auth.currentUser).toBeNull();
    await environment.withSecurityRulesDisabled(async (context) => {
      expect(
        (
          await getDocFromServer(
            doc(context.firestore(), "players", aUid, "saves", "prototype"),
          )
        ).exists(),
      ).toBe(false);
    });
    expect(
      JSON.parse((await cloudRepository(b.db, bUid).read())!.profile).hints,
    ).toBe(11);
  });
});
