import { spawnSync } from "node:child_process";
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

if (process.argv.includes("--apk")) {
  const windows = process.platform === "win32";
  const result = spawnSync(
    windows ? "cmd.exe" : "./gradlew",
    windows
      ? ["/d", "/s", "/c", "gradlew.bat assembleDebug --console=plain"]
      : ["assembleDebug", "--console=plain"],
    { cwd: new URL("../android/", import.meta.url), stdio: "inherit" },
  );
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}
