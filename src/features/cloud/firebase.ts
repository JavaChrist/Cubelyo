import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  signInAnonymously,
  connectAuthEmulator,
} from "firebase/auth";
import {
  initializeFirestore,
  memoryLocalCache,
  connectFirestoreEmulator,
} from "firebase/firestore";
import { cloudConfig } from "./config";

async function initialize() {
  const config = cloudConfig();
  if (!config) return null;
  const app = initializeApp(config, "cubelyo");
  const auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  });
  const db = initializeFirestore(app, { localCache: memoryLocalCache() });
  if (config.emulators) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  }
  await auth.authStateReady();
  return { auth, db, projectId: config.projectId! };
}
let initialization: ReturnType<typeof initialize> | undefined;
let signingIn: ReturnType<typeof signInAnonymously> | undefined;
export async function firebaseClient(createIdentity = true) {
  initialization ??= initialize();
  const client = await initialization;
  if (!client) return null;
  if (!client.auth.currentUser && createIdentity) {
    signingIn ??= signInAnonymously(client.auth);
    try {
      await signingIn;
    } finally {
      signingIn = undefined;
    }
  }
  if (signingIn) await signingIn;
  if (client.auth.currentUser && !client.auth.currentUser.isAnonymous)
    throw new Error("firebase/anonymous-only");
  return client;
}
