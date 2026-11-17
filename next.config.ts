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
  // Pages et layouts en .tsx, routes serveur en .ts (route.ts) : l'export statique Android ne garde que les .tsx,
  // les routes serveur n'existent que sur Vercel.
  // Android : deux extensions, car Next 16 (webpack) plante sur un tableau à un seul élément (pageExtensions.flatMap).
  pageExtensions: android ? ["tsx", "jsx"] : ["tsx", "ts"],
  // firebase-admin est externe par défaut dans Next ; sur Vercel, son require() de jose 6 (ES Module, via jwks-rsa)
  // échoue (ERR_REQUIRE_ESM). Il est donc inclus dans le bundle ; Firestore (gRPC) reste externe.
  transpilePackages: android ? [] : ["firebase-admin"],
  serverExternalPackages: android ? [] : ["@google-cloud/firestore"],
  ...(android
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};
export default config;
