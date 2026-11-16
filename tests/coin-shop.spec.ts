import { expect, test, type Page } from "@playwright/test";
import { tap } from "./cube-helpers";
import { DEMOS } from "../src/features/levels/demos";
import { newProfile, SAVE_KEY } from "../src/features/progression/profile";

const saved = (page: Page) =>
  page.evaluate((key) => {
    const p = JSON.parse(localStorage.getItem(key)!);
    return {
      coins: p.coins,
      hints: p.hints,
      erasers: p.erasers,
      wands: p.wands,
      stars: p.energy.stars,
      welcomed: p.welcomed,
    };
  }, SAVE_KEY);

const seed = (page: Page, profile: ReturnType<typeof newProfile>) =>
  page.addInitScript(
    ({ profile, key }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(profile));
    },
    { profile, key: SAVE_KEY },
  );

test("cadeau d’accueil affiché une seule fois à un nouveau joueur", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const card = page.getByRole("dialog", {
    name: "Bienvenue dans Cubelyo",
    exact: true,
  });
  await expect(card).toBeVisible();
  await expect(
    card.getByLabel("200 pièces, 3 indices, 2 gommes et 1 baguette", {
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({ path: ".tmp/welcome-gift.png" });
  await card.getByRole("button", { name: "Super", exact: true }).click();
  await expect(card).toHaveCount(0);
  expect(await saved(page)).toMatchObject({
    coins: 200,
    hints: 3,
    erasers: 2,
    wands: 1,
    welcomed: true,
  });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Jouer", exact: true }),
  ).toBeVisible();
  await expect(card).toHaveCount(0);
});

test("boutique : échange de pièces, bouton grisé si le solde manque, étoiles plafonnées", async ({
  page,
}) => {
  const profile = { ...newProfile(), welcomed: true, coins: 500 };
  await seed(page, profile);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Boutique", exact: true }).click();
  const shop = page.getByRole("list", {
    name: "Échanger vos pièces",
    exact: true,
  });
  await expect(shop).toBeVisible();
  await expect(
    shop.getByRole("button", {
      name: "Acheter 1 étoile pour 250 pièces",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(shop.getByText("Réserve pleine", { exact: true })).toBeVisible();
  await expect(
    shop.getByRole("button", {
      name: "Acheter 3 baguettes pour 1 150 pièces",
      exact: true,
    }),
  ).toBeDisabled();
  await page.screenshot({ path: ".tmp/coin-shop.png", fullPage: true });
  await shop
    .getByRole("button", {
      name: "Acheter 1 indice pour 150 pièces",
      exact: true,
    })
    .click();
  const card = page.getByRole("dialog", { name: "Achat réussi", exact: true });
  await expect(card).toBeVisible();
  await expect(card.getByText("1 indice pour 150 pièces")).toBeVisible();
  await card.getByRole("button", { name: "Super", exact: true }).click();
  expect(await saved(page)).toMatchObject({
    coins: 350,
    hints: profile.hints + 1,
  });
  // 350 pièces : la baguette (450) n’est plus accessible.
  await expect(
    shop.getByText("Il manque 100 pièces", { exact: true }),
  ).toBeVisible();
  await expect(
    shop.getByRole("button", {
      name: "Acheter 1 baguette pour 450 pièces",
      exact: true,
    }),
  ).toBeDisabled();
  await shop
    .getByRole("button", {
      name: "Acheter 1 gomme pour 300 pièces",
      exact: true,
    })
    .click();
  await page
    .getByRole("dialog", { name: "Achat réussi", exact: true })
    .getByRole("button", { name: "Super", exact: true })
    .click();
  expect(await saved(page)).toMatchObject({
    coins: 50,
    erasers: profile.erasers + 1,
  });
});

test("réserve vide : une étoile achetée depuis la modale des étoiles", async ({
  page,
}) => {
  const profile = { ...newProfile(), welcomed: true, coins: 300 };
  profile.energy.stars = 0;
  await seed(page, profile);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Jouer", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Vos étoiles", exact: true });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", {
      name: "Acheter 1 étoile pour 250 pièces",
      exact: true,
    })
    .click();
  await expect(dialog.getByRole("status")).toHaveText(
    "Achat réussi : 1 étoile pour 250 pièces.",
  );
  await page.screenshot({ path: ".tmp/coin-shop-stars.png" });
  expect(await saved(page)).toMatchObject({ coins: 50, stars: 1 });
  await expect(
    dialog.getByRole("button", {
      name: "Acheter 1 étoile pour 250 pièces",
      exact: true,
    }),
  ).toBeDisabled();
});

test("plus de cœurs ni d’étoile : une étoile achetée débloque « Continuer »", async ({
  page,
}) => {
  const profile = {
    ...newProfile(),
    welcomed: true,
    coins: 300,
    testAccess: true,
  };
  profile.energy.stars = 1;
  await seed(page, profile);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Jouer", exact: true }).click();
  await page.getByLabel("Choisir un niveau").selectOption("1");
  for (let lives = 2; lives >= 0; lives--) {
    await tap(page, DEMOS[1].arrows[0], false);
    await expect(
      page.getByLabel(`${lives} vies restantes`, { exact: true }),
    ).toBeVisible();
  }
  const lost = page.getByRole("dialog", {
    name: "Plus de cœurs pour ce cube.",
  });
  await expect(lost).toBeVisible();
  const resume = lost.getByRole("button", {
    name: "Continuer · 1 étoile",
    exact: true,
  });
  if ((await saved(page)).stars > 0) {
    await resume.click();
    for (let lives = 2; lives >= 0; lives--)
      await tap(page, DEMOS[1].arrows[0], false);
    await expect(lost).toBeVisible();
  }
  await expect(resume).toBeDisabled();
  await lost
    .getByRole("button", {
      name: "Acheter 1 étoile pour 250 pièces",
      exact: true,
    })
    .click();
  await expect(lost.getByRole("status")).toHaveText(
    "Achat réussi : 1 étoile pour 250 pièces.",
  );
  await page.screenshot({ path: ".tmp/coin-shop-lost.png" });
  await resume.click();
  await expect(
    page.getByLabel("3 vies restantes", { exact: true }),
  ).toBeVisible();
  expect(await saved(page)).toMatchObject({ coins: 50, stars: 0 });
});
