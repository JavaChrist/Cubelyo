export function cloudConfig() {
  if (process.env.NEXT_PUBLIC_FIREBASE_ENABLED !== "true") return null;
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  if (Object.values(config).some((value) => !value?.trim()))
    throw new Error("firebase/config-incomplete");
  const emulators = process.env.NEXT_PUBLIC_FIREBASE_EMULATORS === "true";
  if (emulators && !config.projectId!.startsWith("demo-"))
    throw new Error("firebase/emulator-project-required");
  return { ...config, emulators };
}
export const CLOUD_ENABLED =
  process.env.NEXT_PUBLIC_FIREBASE_ENABLED === "true";
export const CLOUD_META_KEY = "cubelyo.cloud.v1";
