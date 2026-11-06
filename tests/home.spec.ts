import { expect, test } from "@playwright/test";
import { tap } from "./cube-helpers";
import { DEMOS } from "../src/features/levels/demos";
import { newProfile, SAVE_KEY } from "../src/features/progression/profile";
test("accueil, verrouillage, étoile au démarrage, reprise et recharge", async ({
  page,
}) => {
  await page.clock.install();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "5 étoiles sur 5", exact: true }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(
    page
      .getByRole("navigation", { name: "Navigation principale" })
      .getByRole("button"),
  ).toHaveText(["Boutique", "Accueil", "Tour"]);
  await expect(
    page.getByRole("button", {
      name: "Choisir le niveau 2, verrouillé",
      exact: true,
    }),
  ).toBeDisabled();
  const firstTop = await page
    .getByRole("button", { name: "Choisir le niveau 1", exact: true })
    .evaluate((el) => el.getBoundingClientRect().top);
  const secondTop = await page
    .getByRole("button", {
      name: "Choisir le niveau 2, verrouillé",
      exact: true,
    })
    .evaluate((el) => el.getBoundingClientRect().top);
  expect(secondTop, "Le niveau 2 doit être au-dessus du niveau 1").toBeLessThan(
    firstTop,
  );
  const playBox = await page
      .getByRole("button", { name: "Jouer", exact: true })
      .boundingBox(),
    navBox = await page
      .getByRole("navigation", { name: "Navigation principale" })
      .boundingBox();
  expect(playBox && navBox && playBox.y + playBox.height < navBox.y).toBe(true);
  const radius = await page
    .getByRole("button", { name: "Choisir le niveau 1", exact: true })
    .evaluate((e) => getComputedStyle(e).borderRadius);
  expect(radius).toBe("50%");
  await page.getByRole("button", { name: "Jouer", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "4 étoiles sur 5", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".scene-container")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await page
    .getByRole("button", { name: "Retour à l’accueil", exact: true })
    .click();
  await page.getByRole("button", { name: "Reprendre", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "4 étoiles sur 5", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Reprendre", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "4 étoiles sur 5", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".scene-container")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await page.clock.fastForward(30 * 60 * 1000 + 1000);
  await expect(
    page.getByRole("button", { name: "5 étoiles sur 5", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Retour à l’accueil", exact: true })
    .click();
  await page.screenshot({ path: ".tmp/home-mobile.png", fullPage: true });
});
test("réglages persistants, accès test et gomme sur une flèche bloquée, baguette sans perte de cœurs", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "Réglages", exact: true }).click();
  await page
    .getByRole("switch", { name: "Effets sonores", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Activer l’accès libre aux niveaux",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Fermer", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Choisir le niveau 18", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Jouer", exact: true }).click();
  await page.getByLabel("Choisir un niveau").selectOption("1");
  await page.getByRole("button", { name: "Gomme", exact: true }).click();
  await tap(page, DEMOS[1].arrows[0], false);
  await expect(page.locator(".remaining strong")).toHaveText("5");
  await expect(
    page.getByLabel("3 vies restantes", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Baguette", exact: true }).click();
  await expect(page.locator(".remaining strong")).toHaveText("2");
  await expect(
    page.getByLabel("3 vies restantes", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate((key) => {
      const p = JSON.parse(localStorage.getItem(key)!);
      return [p.erasers, p.wands, p.energy.stars];
    }, SAVE_KEY),
  ).toEqual([2, 2, 3]);
  await page.reload();
  await page.getByRole("button", { name: "Reprendre", exact: true }).click();
  await expect(page.locator(".remaining strong")).toHaveText("2");
  await page.getByRole("button", { name: "Réglages", exact: true }).click();
  await expect(
    page.getByRole("switch", { name: "Effets sonores", exact: true }),
  ).toHaveAttribute("aria-checked", "false");
  await page.screenshot({ path: ".tmp/home-settings.png" });
});
test("réserve vide interdit une nouvelle partie, boutique sans paiement dans la PWA", async ({
  page,
}) => {
  const p = newProfile();
  p.energy.stars = 0;
  await page.addInitScript(
    ({ p, key }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(p));
    },
    { p, key: SAVE_KEY },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Jouer", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Vos étoiles", exact: true }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "Compris", exact: true }).click();
  await page.getByRole("button", { name: "Boutique", exact: true }).click();
  await expect(
    page.getByText("Aucun paiement disponible ici", { exact: true }),
  ).toBeVisible();
  const prices = page.getByRole("button", {
    name: /disponible sur les stores/,
  });
  await expect(prices).toHaveCount(10);
  for (const button of await prices.all()) await expect(button).toBeDisabled();
  await page.screenshot({ path: ".tmp/home-shop.png", fullPage: true });
});

test("raccourcis latéraux et gabarit identique des modales", async ({
  page,
}) => {
  await page.goto("/");
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 1000 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    const chest = page.getByRole("button", {
        name: "Offre de départ",
        exact: true,
      }),
      special = page.getByRole("button", {
        name: "Offre du moment",
        exact: true,
      }),
      tower = page.getByRole("button", {
        name: "Tour des récompenses",
        exact: true,
      });
    const [left, other, right, map] = await Promise.all([
      chest.boundingBox(),
      special.boundingBox(),
      tower.boundingBox(),
      page.getByLabel("Chemin de progression", { exact: true }).boundingBox(),
    ]);
    expect(
      left &&
        other &&
        right &&
        map &&
        left.x + left.width <= map.x &&
        other.y > left.y &&
        right.x >= map.x + map.width - 1,
    ).toBe(true);
    await page.getByRole("button", { name: "Réglages", exact: true }).click();
    const settings = await page
        .getByRole("dialog", { name: "Réglages", exact: true })
        .boundingBox(),
      close = await page
        .getByRole("button", { name: "Fermer", exact: true })
        .boundingBox();
    if (!settings || !close) throw Error("Modale absente");
    expect(settings.height).toBeLessThan(viewport.height);
    expect(settings.height).toBeLessThanOrEqual(460);
    expect(settings.width).toBeLessThanOrEqual(340);
    await page.getByRole("button", { name: "Fermer", exact: true }).click();
    for (const [button, title] of [
      ["5 étoiles sur 5", "Vos étoiles"],
      ["Offre de départ", "Offre de départ"],
      ["Offre du moment", "Offre du moment"],
    ]) {
      await page.getByRole("button", { name: button, exact: true }).click();
      const dialog = page.getByRole("dialog", { name: title, exact: true }),
        box = await dialog.boundingBox(),
        cross = await page
          .getByRole("button", { name: "Fermer", exact: true })
          .boundingBox();
      if (!box || !cross) throw Error("Modale absente");
      for (const key of ["x", "y", "width", "height"] as const)
        expect(
          Math.abs(box[key] - settings[key]),
          `${title} · ${key}`,
        ).toBeLessThan(1);
      expect(
        Math.abs(cross.x - close.x) + Math.abs(cross.y - close.y),
      ).toBeLessThan(1);
      if (title.startsWith("Offre"))
        await expect(
          dialog.getByRole("button", { name: /disponible sur les stores/ }),
        ).toBeDisabled();
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: button, exact: true }),
      ).toBeFocused();
    }
    await page.getByRole("button", { name: "Réglages", exact: true }).click();
    await page
      .getByRole("button", { name: "Confidentialité", exact: true })
      .click();
    const privacy = await page
      .getByRole("dialog", { name: "Vos données", exact: true })
      .boundingBox();
    expect(privacy?.height).toBe(settings.height);
    await page.getByRole("button", { name: "Fermer", exact: true }).click();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Offre de départ", exact: true })
    .click();
  await page.screenshot({ path: ".tmp/promotion-starter.png" });
  await page.getByRole("button", { name: "Fermer", exact: true }).click();
  await page
    .getByRole("button", { name: "Offre du moment", exact: true })
    .click();
  await page.screenshot({ path: ".tmp/promotion-special.png" });
  await page
    .getByRole("button", { name: "Voir la boutique", exact: true })
    .click();
  await expect(
    page.getByText("Aucun paiement disponible ici", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Accueil", exact: true }).click();
  await page
    .getByRole("button", { name: "Tour des récompenses", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Tour Cubelyo", exact: true }),
  ).toBeVisible();
});
