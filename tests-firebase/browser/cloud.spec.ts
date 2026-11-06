import { expect, test } from "@playwright/test";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import {
  doc,
  getDocFromServer,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { readFile } from "node:fs/promises";
import { CLOUD_META_KEY } from "../../src/features/cloud/config";
import { SAVE_KEY } from "../../src/features/progression/profile";
test("synchronisation réelle depuis le navigateur, conflit, export et suppression anonyme", async ({
  page,
}) => {
  const environment = await initializeTestEnvironment({
    projectId: "demo-cubelyo",
    firestore: { host: "127.0.0.1", port: 8080 },
  });
  try {
    await page.goto("/");
    await page.getByRole("button", { name: "Réglages", exact: true }).click();
    await expect(
      page.getByText("Sauvegarde synchronisée", { exact: true }),
    ).toBeVisible({ timeout: 30000 });
    const uid = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).scope.split("/")[1],
      CLOUD_META_KEY,
    );
    const db = environment.authenticatedContext(uid).firestore();
    const ref = doc(db, "players", uid, "saves", "prototype");
    await page.getByRole("button", { name: "Fermer", exact: true }).click();
    await page.getByRole("button", { name: "Jouer", exact: true }).click();
    await expect
      .poll(
        async () =>
          JSON.parse((await getDocFromServer(ref)).data()!.profile).energy
            .stars,
        { timeout: 15000 },
      )
      .toBe(4);
    await page.reload();
    await expect(
      page.getByRole("button", { name: "4 étoiles sur 5", exact: true }),
    ).toBeVisible();
    const remote = (await getDocFromServer(ref)).data()!;
    const profile = JSON.parse(remote.profile);
    profile.hints = 9;
    await setDoc(ref, {
      ...remote,
      profile: JSON.stringify(profile),
      revision: remote.revision + 1,
      updatedAt: serverTimestamp(),
    });
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await page
      .getByRole("button", {
        name: "Une autre sauvegarde est disponible · Vérifier",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", {
        name: "Restaurer la sauvegarde en ligne",
        exact: true,
      })
      .click();
    await expect
      .poll(() =>
        page.evaluate(
          (key) => JSON.parse(localStorage.getItem(key)!).hints,
          SAVE_KEY,
        ),
      )
      .toBe(9);
    await page.getByRole("button", { name: "Réglages", exact: true }).click();
    await page
      .getByRole("link", { name: "Droits RGPD et sauvegarde", exact: true })
      .click();
    const downloadPromise = page.waitForEvent("download", { timeout: 20000 });
    await page
      .getByRole("button", { name: "Exporter ma sauvegarde", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Export téléchargé", {
      timeout: 15000,
    });
    const downloaded = await downloadPromise;
    const exported = JSON.parse(
      await readFile((await downloaded.path())!, "utf8"),
    );
    expect(exported.cloud.uid).toBe(uid);
    expect(JSON.parse(exported.cloud.save.profile).hints).toBe(9);
    expect(exported.profile.hints).toBe(9);
    await page
      .getByRole("button", { name: "Effacer ma sauvegarde", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirmer l’effacement", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Jouer", exact: true }),
    ).toBeVisible();
    await expect
      .poll(() => getDocFromServer(ref).then((s) => s.exists()))
      .toBe(false);
    expect(
      await page.evaluate((key) => localStorage.getItem(key), CLOUD_META_KEY),
    ).toBeNull();
  } finally {
    await environment.cleanup();
  }
});
