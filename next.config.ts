import type { NextConfig } from "next";
const android = process.env.CUBELYO_BUILD_TARGET === "android";
// Serveur HTTPS (Vercel) qui porte /api/play/verify pour l'application Android. Aucun secret ici.
const apiBase = android
  ? (process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://cubelyo.vercel.app")
  : "";
if (apiBase && !/^https:\/\/[a-z0-9.-]+(:\d+)?$/.test(apiBase)) {
  throw new Error(
    `NEXT_PUBLIC_API_BASE_URL doit être une origine HTTPS sans chemin : "${apiBase}"`,
  );
}
const config: NextConfig = {
  env: { NEXT_PUBLIC_API_BASE_URL: apiBase },
  // Les routes serveur (*.server.ts) n'existent que sur Vercel, jamais dans l'export statique Android.
  pageExtensions: android ? ["tsx", "ts"] : ["tsx", "ts", "server.ts"],
  ...(android
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};
export default config;
