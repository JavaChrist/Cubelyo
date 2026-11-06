import {
  doc,
  Timestamp,
  getDocFromServer,
  runTransaction,
  serverTimestamp,
  deleteDoc,
  type Firestore,
} from "firebase/firestore";
import { decodeProfile } from "../progression/profile";

import { SaveConflict, type CloudSave } from "./contracts";
export function decodeCloudSave(data: Record<string, unknown>): CloudSave {
  if (
    data.schema !== 1 ||
    typeof data.profile !== "string" ||
    data.profile.length > 250000 ||
    !Number.isSafeInteger(data.revision) ||
    (data.revision as number) < 1 ||
    !decodeProfile(data.profile)
  )
    throw new Error("cloud/invalid-save");
  return {
    profile: data.profile,
    revision: data.revision as number,
    schema: 1,
    ...(data.updatedAt instanceof Timestamp
      ? { updatedAt: data.updatedAt.toDate().toISOString() }
      : {}),
  };
}
/** This namespace holds test progress only. It never grants store purchases or server wallet balances. */
export function cloudRepository(db: Firestore, uid: string) {
  const ref = doc(db, "players", uid, "saves", "prototype");
  return {
    async read(): Promise<CloudSave | null> {
      const snapshot = await getDocFromServer(ref);
      return snapshot.exists() ? decodeCloudSave(snapshot.data()) : null;
    },
    async write(profile: string, expectedRevision: number): Promise<CloudSave> {
      if (!decodeProfile(profile) || profile.length > 250000)
        throw new Error("cloud/invalid-save");
      return runTransaction(db, async (tx) => {
        const snapshot = await tx.get(ref);
        const revision = snapshot.exists()
          ? decodeCloudSave(snapshot.data()).revision
          : 0;
        if (revision !== expectedRevision) throw new SaveConflict();
        const next = { profile, revision: revision + 1 };
        tx.set(ref, { schema: 1, ...next, updatedAt: serverTimestamp() });
        return next;
      });
    },
    async erase() {
      await deleteDoc(ref);
    },
  };
}
