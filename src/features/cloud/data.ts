import { CLOUD_ENABLED, CLOUD_META_KEY } from "./config";
import { CLOUD_OPTOUT_KEY, stopActiveSync } from "./sync";
import { SAVE_KEY } from "../progression/profile";
export async function exportSaveData() {
  const raw = localStorage.getItem(SAVE_KEY);
  const result = {
    application: "Cubelyo",
    exportedAt: new Date().toISOString(),
    profile: raw ? JSON.parse(raw) : null,
    cloud: null as null | { uid: string; projectId: string; save: unknown },
  };
  if (CLOUD_ENABLED) {
    await stopActiveSync();
    const { firebaseClient } = await import("./firebase");
    const client = await firebaseClient(false);
    if (client?.auth.currentUser) {
      const { exportCloudData } = await import("./account");
      result.cloud = await exportCloudData(client);
    }
  }
  return result;
}
export async function eraseSaveData() {
  if (CLOUD_ENABLED) {
    localStorage.setItem(CLOUD_OPTOUT_KEY, "true");
    await stopActiveSync();
    const { firebaseClient } = await import("./firebase");
    const client = await firebaseClient(false);
    if (client?.auth.currentUser) {
      const { eraseCloudData } = await import("./account");
      await eraseCloudData(client);
    }
  }
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(CLOUD_META_KEY);
}
