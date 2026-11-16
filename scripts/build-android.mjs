import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
// Use npm's JavaScript entry point, avoiding shell-dependent environment assignments on Windows.
const npm = process.env.npm_execpath;
if (!npm) throw new Error("Exécuter via npm run android:sync");
for (const args of [
  ["run", "build"],
  ["exec", "--", "cap", "sync", "android"],
]) {
  const result = spawnSync(process.execPath, [npm, ...args], {
    stdio: "inherit",
    env: { ...process.env, CUBELYO_BUILD_TARGET: "android" },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// --apk : APK de test (debug) ; --bundle : AAB signé pour Google Play.
const task = process.argv.includes("--bundle")
  ? "bundleRelease"
  : process.argv.includes("--apk")
    ? "assembleDebug"
    : null;
if (
  task === "bundleRelease" &&
  !existsSync(new URL("../android/keystore.properties", import.meta.url))
) {
  console.error(
    "android/keystore.properties manquant : copiez keystore.properties.example et renseignez la clé d'envoi.",
  );
  process.exit(1);
}
if (task) {
  const windows = process.platform === "win32";
  const result = spawnSync(
    windows ? "cmd.exe" : "./gradlew",
    windows
      ? ["/d", "/s", "/c", `.\\gradlew.bat ${task} --console=plain`]
      : [task, "--console=plain"],
    {
      cwd: fileURLToPath(new URL("../android/", import.meta.url)),
      stdio: "inherit",
    },
  );
  if (result.error) throw result.error;
  if (result.status === 0 && task === "bundleRelease")
    console.log(
      "AAB prêt : android/app/build/outputs/bundle/release/app-release.aab",
    );
  process.exit(result.status ?? 1);
}
