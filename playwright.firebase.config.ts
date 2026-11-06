import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests-firebase/browser",
  workers: 1,
  timeout: 90000,
  use: {
    baseURL: "http://127.0.0.1:3117",
    channel: "chrome",
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    launchOptions: {
      args: [
        "--enable-webgl",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
      ],
    },
  },
  webServer: {
    command:
      "npm run legal:generate && npx next dev --webpack --hostname 127.0.0.1 --port 3117",
    url: "http://127.0.0.1:3117",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      NEXT_PUBLIC_FIREBASE_ENABLED: "true",
      NEXT_PUBLIC_FIREBASE_EMULATORS: "true",
      NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-cubelyo.firebaseapp.com",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-cubelyo",
      NEXT_PUBLIC_FIREBASE_APP_ID: "demo-app",
    },
  },
});
