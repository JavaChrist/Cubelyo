import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { newProfile, SAVE_KEY } from "../src/features/progression/profile";

// Protects public access to the generated documents and prevents exposing internal snapshots.
test("documents accessibles depuis les réglages, lisibles sans compte et sans fichiers internes publics", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/");
  await page.getByRole("button", { name: "Réglages", exact: true }).click();
  await page
    .getByRole("link", { name: "Politique de confidentialité", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Politique de confidentialité",
    }),
  ).toBeVisible();
  const navigation = page.getByRole("navigation", { name: "Documents légaux" });
  for (const name of [
    "Conditions d’utilisation",
    "Conditions générales de vente",
    "Mentions légales",
    "Vos droits sur les données",
    "Politique de confidentialité",
  ]) {
    await navigation.getByRole("link", { name, exact: true }).click();
    await expect(
      page.getByRole("heading", { level: 1, name, exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("note")).toContainText("Brouillon");
    await expect(page.locator("article")).not.toContainText("À COMPLÉTER");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await expect(page.locator("article")).toContainText("Aucun SDK tiers");
  for (const file of ["snapshot.json", "rapport.json"]) {
    expect(
      (await request.get(`/legal/generated/0.1.0-pwa/${file}`)).status(),
    ).toBe(404);
  }
});

// Exercises actual downloaded bytes and deletion boundaries, not a mocked storage API.
test("export exact, annulation sans perte et effacement limité à Cubelyo", async ({
  page,
}) => {
  await page.goto("/droits-rgpd");
  const profile = { ...newProfile(), coins: 1234, hints: 7 };
  await page.evaluate(
    ({ key, profile }) => {
      localStorage.setItem(key, JSON.stringify(profile));
      localStorage.setItem("autre-app", "à conserver");
    },
    { key: SAVE_KEY, profile },
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter ma sauvegarde" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).not.toBeNull();
  const exported = JSON.parse(await readFile(path!, "utf8"));
  expect(exported.application).toBe("Cubelyo");
  expect(exported.profile).toEqual(profile);
  await page
    .getByRole("button", { name: "Effacer ma sauvegarde", exact: true })
    .click();
  const heading = await page
    .getByRole("dialog")
    .getByRole("heading")
    .boundingBox();
  const header = await page.locator("dialog .modal-header").boundingBox();
  expect(
    heading &&
      header &&
      heading.y >= header.y &&
      heading.y + heading.height <= header.y + header.height,
  ).toBe(true);
  await page.getByRole("button", { name: "Annuler", exact: true }).click();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).coins,
      SAVE_KEY,
    ),
  ).toBe(1234);
  await page
    .getByRole("button", { name: "Effacer ma sauvegarde", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmer l’effacement", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Jouer", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).coins,
      SAVE_KEY,
    ),
  ).toBe(0);
  expect(await page.evaluate(() => localStorage.getItem("autre-app"))).toBe(
    "à conserver",
  );
});
