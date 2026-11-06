import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "fr.javachrist.cubelyo",
  appName: "Cubelyo",
  webDir: "out",
  server: { androidScheme: "https", hostname: "localhost" },
  android: { allowMixedContent: false },
};
export default config;
