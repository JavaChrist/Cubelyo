import { expect, test } from "@playwright/test";
import {
  completeLevel,
  newProfile,
  SAVE_KEY,
} from "../src/features/progression/profile";
test("tour illustrée montante, montgolfière sauvegardée et aide au gabarit commun", async ({
  page,
}) => {
  let profile = newProfile();
  for (let n = 1; n <= 17; n++) profile = completeLevel(profile, n, 60, 3);
  await page.addInitScript(
    ({ profile, key }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(profile));
    },
    { profile, key: SAVE_KEY },
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Réglages", exact: true }).click();
  const settings = await page
    .getByRole("dialog", { name: "Réglages", exact: true })
    .boundingBox();
  await page.getByRole("button", { name: "Fermer", exact: true }).click();
  await page
    .getByRole("button", { name: "Tour des récompenses", exact: true })
    .click();
  const world = page.getByRole("region", {
      name: "Tour à explorer, du bas vers le haut",
      exact: true,
    }),
    player = page.getByRole("img", {
      name: "Votre montgolfière, étage 17",
      exact: true,
    });
  await expect(player).toBeVisible();
  const [playerBox, worldBox] = await Promise.all([
    player.boundingBox(),
    world.boundingBox(),
  ]);
  expect(
    playerBox &&
      worldBox &&
      playerBox.y >= worldBox.y &&
      playerBox.y + playerBox.height <= worldBox.y + worldBox.height,
  ).toBe(true);
  const top20 = await page
      .getByRole("article", { name: "Coffre de l’étage 20", exact: true })
      .evaluate((el) => el.getBoundingClientRect().top),
    top15 = await page
      .getByRole("article", { name: "Coffre de l’étage 15", exact: true })
      .evaluate((el) => el.getBoundingClientRect().top);
  expect(top20).toBeLessThan(top15);
  await expect(
    page.getByRole("button", {
      name: "Ouvrir le coffre de l’étage 15",
      exact: true,
    }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", {
      name: "Coffre étage 20, verrouillé",
      exact: true,
    }),
  ).toBeDisabled();
  await page.screenshot({ path: ".tmp/tower-art-17.png", fullPage: true });
  await page
    .getByRole("button", { name: "Comment fonctionne la tour ?", exact: true })
    .click();
  const help = page.getByRole("dialog", {
      name: "La tour des récompenses",
      exact: true,
    }),
    box = await help.boundingBox();
  expect(box?.width).toBe(settings?.width);
  expect(box?.height).toBe(settings?.height);
  await expect(
    page.getByRole("heading", { name: "Terminez des niveaux", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Montez toujours plus haut",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ouvrez vos coffres", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: ".tmp/tower-help.png" });
  await page.getByRole("button", { name: "Compris", exact: true }).click();
  await expect(help).toHaveCount(0);
  await world.hover();
  await page.mouse.wheel(0, -12000);
  await expect.poll(() => world.evaluate((el) => el.scrollTop)).toBe(0);
  await expect(
    page.getByRole("article", { name: "Coffre de l’étage 100", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: ".tmp/tower-summit.png", fullPage: true });
});

test("la montgolfière du départ reste visible après un changement de format", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Tour des récompenses", exact: true })
    .click();
  const world = page.getByRole("region", {
      name: "Tour à explorer, du bas vers le haut",
      exact: true,
    }),
    player = page.getByRole("img", {
      name: "Votre montgolfière, étage 0",
      exact: true,
    });
  for (const viewport of [
    { width: 360, height: 780 },
    { width: 1440, height: 1000 },
    { width: 844, height: 390 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await expect
      .poll(async () => {
        const [w, p] = await Promise.all([
          world.boundingBox(),
          player.boundingBox(),
        ]);
        return !!w && !!p && p.y >= w.y && p.y + p.height <= w.y + w.height;
      })
      .toBe(true);
  }
});
