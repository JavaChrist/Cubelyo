import { expect, test } from "@playwright/test";
import { SAVE_KEY } from "../src/features/progression/profile";
test("catalogue français : prix et quantités validés, grille de trois colonnes et achats inactifs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const balance = () =>
    page.evaluate((key) => {
      const p = JSON.parse(localStorage.getItem(key)!);
      return {
        coins: p.coins,
        hints: p.hints,
        erasers: p.erasers,
        wands: p.wands,
        stars: p.energy.stars,
      };
    }, SAVE_KEY);
  await expect(
    page.getByRole("button", { name: "Boutique", exact: true }),
  ).toBeVisible();
  const before = await balance();
  await page.getByRole("button", { name: "Boutique", exact: true }).click();
  for (const [title, price] of [
    ["Pack de départ", /1,99\s*€/],
    ["Pack sans publicité", /9,99\s*€/],
    ["Sans publicité", /8,99\s*€/],
    ["Pack spécial", /8,99\s*€/],
  ] as const) {
    const card = page.getByRole("article", { name: title, exact: true });
    await expect(
      card.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(card.getByRole("button")).toHaveText(price);
    await expect(card.getByRole("button")).toBeDisabled();
  }
  const starter = page.getByRole("article", {
    name: "Pack de départ",
    exact: true,
  });
  for (const label of ["2 indices", "2 gommes", "2 baguettes"])
    await expect(
      starter.getByRole("listitem", { name: label, exact: true }),
    ).toHaveCount(1);
  const noAds = page.getByRole("article", {
    name: "Pack sans publicité",
    exact: true,
  });
  for (const label of ["3 indices", "3 gommes"])
    await expect(
      noAds.getByRole("listitem", { name: label, exact: true }),
    ).toHaveCount(1);
  const special = page.getByRole("article", {
    name: "Pack spécial",
    exact: true,
  });
  await expect(special.getByText(/4\s*500/)).toBeVisible();
  for (const label of ["3 indices", "3 gommes"])
    await expect(
      special.getByRole("listitem", { name: label, exact: true }),
    ).toHaveCount(1);
  const coins = page.getByRole("region", {
    name: "Lots de pièces",
    exact: true,
  });
  const amounts = ["1 500", "7 500", "20 000", "45 000", "80 000", "220 000"],
    prices = [
      /1,99\s*€/,
      /8,99\s*€/,
      /14,99\s*€/,
      /34,99\s*€/,
      /59,99\s*€/,
      /99,99\s*€/,
    ];
  for (let i = 0; i < amounts.length; i++) {
    const card = coins.getByRole("article", {
      name: new RegExp(`^${amounts[i].replace(" ", "\\s")} pièces$`),
    });
    await expect(card.getByRole("button")).toHaveText(prices[i]);
    await expect(card.getByRole("button")).toBeDisabled();
  }
  for (const viewport of [
    { width: 360, height: 780 },
    { width: 430, height: 932 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    const cards = await coins.getByRole("article").all();
    const boxes = await Promise.all(
      cards.slice(0, 4).map((c) => c.boundingBox()),
    );
    if (boxes.some((b) => !b)) throw Error("Carte absente");
    const [a, b, c, d] = boxes;
    expect(
      a &&
        b &&
        c &&
        d &&
        Math.abs(a.y - b.y) < 1 &&
        Math.abs(a.y - c.y) < 1 &&
        a.x < b.x &&
        b.x < c.x &&
        d.y > a.y,
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: ".tmp/shop-fr-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Accueil", exact: true }).click();
  for (const [button, price, quantities] of [
    ["Offre de départ", /1,99\s*€/, ["2 indices", "2 gommes", "2 baguettes"]],
    ["Offre du moment", /8,99\s*€/, ["3 indices", "3 gommes"]],
  ] as const) {
    await page.getByRole("button", { name: button, exact: true }).click();
    const dialog = page.getByRole("dialog", { name: button, exact: true });
    const purchase = dialog.getByRole("button", {
      name: /disponible sur les stores/,
    });
    await expect(purchase).toHaveText(price);
    await expect(purchase).toBeDisabled();
    for (const quantity of quantities)
      await expect(
        dialog.getByRole("listitem", { name: quantity, exact: true }),
      ).toHaveCount(1);
    await page.screenshot({
      path: `.tmp/shop-fr-${button === "Offre de départ" ? "starter" : "special"}.png`,
    });
    await page.getByRole("button", { name: "Fermer", exact: true }).click();
  }
  expect(await balance()).toEqual(before);
});
