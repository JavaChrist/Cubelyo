import { deleteUser, type Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { cloudRepository } from "./repository";
export type AccountClient = { auth: Auth; db: Firestore; projectId: string };
export async function exportCloudData(client: AccountClient) {
  const user = client.auth.currentUser;
  if (!user) return null;
  return {
    uid: user.uid,
    account: {
      anonymous: user.isAnonymous,
      createdAt: user.metadata.creationTime ?? null,
      lastSignInAt: user.metadata.lastSignInTime ?? null,
    },
    projectId: client.projectId,
    save: await cloudRepository(client.db, user.uid).read(),
  };
}
export async function eraseCloudData(client: AccountClient) {
  const user = client.auth.currentUser;
  if (!user) return;
  if (!user.isAnonymous) throw new Error("firebase/anonymous-only");
  await cloudRepository(client.db, user.uid).erase();
  await deleteUser(user);
}
