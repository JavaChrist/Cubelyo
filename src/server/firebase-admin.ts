import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Firebase Admin, côté serveur uniquement (route /api/play/verify sur Vercel, scripts d'audit).
 * Variables du serveur, jamais dans l'application :
 * - `FIREBASE_ADMIN_PROJECT_ID` (sinon `NEXT_PUBLIC_FIREBASE_PROJECT_ID`) ;
 * - `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` : compte de service du projet Firebase.
 * Avec les émulateurs (`FIRESTORE_EMULATOR_HOST`), seul un projet `demo-*` est accepté, sans clé.
 */
export class AdminUnavailableError extends Error {}

const NAME = "cubelyo-admin";

export function adminApp(): App {
  const existing = getApps().find((app) => app.name === NAME);
  if (existing) return existing;
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new AdminUnavailableError("admin-project");
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    if (!projectId.startsWith("demo-"))
      throw new AdminUnavailableError("admin-emulator-project");
    return initializeApp({ projectId }, NAME);
  }
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );
  if (!clientEmail || !privateKey)
    throw new AdminUnavailableError("admin-config");
  return initializeApp(
    { credential: cert({ projectId, clientEmail, privateKey }), projectId },
    NAME,
  );
}

export const adminDb = () => getFirestore(adminApp());
export const adminAuth = () => getAuth(adminApp());
