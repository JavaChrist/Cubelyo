import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "fr.javachrist.cubelyo",
  appName: "Cubelyo",
  webDir: "out",
  server: { androidScheme: "https", hostname: "localhost" },
  android: { allowMixedContent: false },
  plugins: {
    // Bord à bord (Android 15+) : la page utilise viewport-fit=cover et env(safe-area-inset-*).
    // Le jeu reste clair même en mode sombre : icônes sombres dans les barres système.
    SystemBars: {
      insetsHandling: "css",
      initialViewportFitValueHint: "cover",
      style: "LIGHT",
    },
  },
};
export default config;
