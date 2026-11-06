import { tap } from "./cube-helpers";
import { expect, test, type Page } from "@playwright/test";
import { PerspectiveCamera, Vector3 } from "three";
import sharp from "sharp";
import {
  newProfile,
  SAVE_KEY,
  completeLevel,
} from "../src/features/progression/profile";
import { DEMOS } from "../src/features/levels/demos";
import {
  FRAMES,
  position,
  directionVector,
  type Arrow,
  type Level,
} from "../src/features/game/core/engine";
import { readFileSync } from "node:fs";
const reference18 = JSON.parse(
  readFileSync(
    new URL("../content/previews/level-18.json", import.meta.url),
    "utf8",
  ),
) as Level;
// Ces parcours isolent la manipulation 3D de l'économie d'indices.
test.beforeEach(async ({ page }) => {
  const profile = newProfile();
  profile.hints = 100;
  await page.addInitScript(
    ({ key, profile }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(profile));
    },
    { key: SAVE_KEY, profile },
  );
});
async function pixels(page: Page, kind: "red" | "surface") {
  const { data, info } = await sharp(await page.locator("canvas").screenshot())
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let count = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (
      kind === "red"
        ? r > 160 && g < 110 && b < 140
        : r > 110 &&
          r < 220 &&
          g > 110 &&
          g < 230 &&
          b > 110 &&
          b < 240 &&
          Math.max(r, g, b) - Math.min(r, g, b) < 35
    )
      count++;
  }
  return count;
}
async function canvasPixels(page: Page) {
  return sharp(await page.locator("canvas").screenshot())
    .removeAlpha()
    .raw()
    .toBuffer();
}
function changedPixels(a: Buffer, b: Buffer) {
  let count = 0;
  for (let i = 0; i < a.length; i += 3)
    if (
      Math.abs(a[i] - b[i]) +
        Math.abs(a[i + 1] - b[i + 1]) +
        Math.abs(a[i + 2] - b[i + 2]) >
      60
    )
      count++;
  return count;
}

test("sorties rapides, obstacle éloigné et indice sur les trois premiers niveaux", async ({
  page,
}) => {
  await page.clock.install();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  for (let i = 0; i < 3; i++) {
    await page.getByLabel("Choisir un niveau").selectOption(String(i));
    await expect(
      page.getByRole("heading", { name: DEMOS[i].title, exact: true }),
    ).toBeVisible();
    if (i) {
      await expect(page.locator(".scene-container")).toHaveAttribute(
        "aria-busy",
        "false",
      );
      const before = await canvasPixels(page);
      await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
      await tap(page, DEMOS[i].arrows[0], false);
      await expect(
        page.getByRole("button", { name: "Un indice" }),
      ).toBeDisabled();
      await page.clock.runFor(30);
      const during = await canvasPixels(page);
      expect(changedPixels(before, during)).toBeGreaterThan(20);
      await page.clock.runFor(1500);
      await page.clock.resume();
      await expect(page.getByRole("status")).toContainText("bloquée");
      await expect(
        page.getByRole("button", { name: "Un indice" }),
      ).toBeEnabled();
      expect(await pixels(page, "red")).toBeGreaterThan(10);
      const returned = await canvasPixels(page);
      let red = 0,
        overlap = 0;
      for (let p = 0; p < returned.length; p += 3)
        if (
          returned[p] > 160 &&
          returned[p + 1] < 110 &&
          returned[p + 2] < 140
        ) {
          red++;
          if (before[p] < 70 && before[p + 2] > before[p] + 10) overlap++;
        }
      expect(overlap / red).toBeGreaterThan(0.7);
      await page.screenshot({ path: `.tmp/error-level-${i + 1}.png` });
    }
    for (let remaining = 6; remaining > 0; remaining--) {
      await page.getByRole("button", { name: "Un indice" }).click();
      const text = await page.getByRole("status").innerText(),
        id = await page.evaluate(
          (key) =>
            JSON.parse(localStorage.getItem(key)!).session.hint as
              string | null,
          SAVE_KEY,
        );
      if (!id) throw Error(text);
      if (i && id === "A")
        expect(await pixels(page, "red")).toBeGreaterThan(10);
      await tap(
        page,
        DEMOS[i].arrows.find((a) => a.id === id)!,
        true,
        i === 0 && remaining === 6 ? 8 : 0,
        i === 0 && remaining === 6 ? 0.15 : 0.6,
      );
      await expect(page.locator(".remaining strong")).toHaveText(
        String(remaining - 1),
        { timeout: 3000 },
      );
      if (i && id === "A") expect(await pixels(page, "red")).toBe(0);
      if (i && remaining === 6)
        await page.screenshot({ path: `.tmp/persistent-red-${i + 1}.png` });
    }
    await expect(
      page.getByRole("heading", { name: "La voie est libre." }),
    ).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("la rotation verticale dépasse les pôles et reste active après plusieurs tours", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".scene-container")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  const images: Buffer[] = [];
  for (let i = 0; i < 7; i++) {
    const box = await page.locator("canvas").boundingBox();
    if (!box) throw Error("Canvas absent");
    const x = box.x + box.width / 2,
      y = box.y + box.height / 2;
    await page.mouse.move(x, y + 120);
    await page.mouse.down();
    await page.mouse.move(x, y - 120, { steps: 20 });
    await page.mouse.up();
    images.push(await canvasPixels(page));
  }
  expect(changedPixels(images[4], images[5])).toBeGreaterThan(500);
  expect(changedPixels(images[5], images[6])).toBeGreaterThan(500);
  await expect(page.locator(".remaining strong")).toHaveText("6");
  await page.screenshot({ path: ".tmp/free-rotation.png" });
});
test("grand cube mobile, pincement et interface limitée aux atouts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByLabel("Choisir un niveau").selectOption("15");
  await expect(page.locator(".remaining strong")).toHaveText("420");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Zoomer", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Voir la flèche/ }),
  ).toHaveCount(0);
  await expect(page.locator(".scene-container")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  const before = await pixels(page, "surface");
  const box = await page.locator("canvas").boundingBox();
  if (!box) throw Error("Canvas absent");
  await page.screenshot({ path: ".tmp/large-before.png", fullPage: true });
  const cdp = await page.context().newCDPSession(page),
    x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: x - 30, y, id: 0 },
      { x: x + 30, y, id: 1 },
    ],
  });
  for (let distance = 35; distance <= 100; distance += 5)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: x - distance, y, id: 0 },
        { x: x + distance, y, id: 1 },
      ],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.locator(".remaining strong")).toHaveText("420");
  expect(await pixels(page, "surface")).toBeGreaterThan(before * 1.3);
  await page.screenshot({ path: ".tmp/large-pinched.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByLabel("Choisir un niveau").selectOption("99");
  await expect(page.locator(".remaining strong")).toHaveText("540");
  await expect(page.locator(".scene-container")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await page.screenshot({ path: ".tmp/level-100.png", fullPage: true });
});

test("niveau 18 rempli : extraction réelle d’un corps réparti sur plusieurs faces", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByLabel("Choisir un niveau").selectOption("17");
  await expect(page.locator(".remaining strong")).toHaveText("366");
  await expect(page.locator(".scene-container")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await page.screenshot({
    path: ".tmp/reference-18-desktop.png",
    fullPage: true,
  });
  const bandImage = await sharp(await page.locator("canvas").screenshot())
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bandCamera = new PerspectiveCamera(
    40,
    bandImage.info.width / bandImage.info.height,
    0.1,
    1000,
  );
  bandCamera.position.set(6, 5.2, 7).normalize().multiplyScalar(9);
  bandCamera.lookAt(0, 0, 0);
  bandCamera.updateMatrixWorld();
  let visibleGold = 0;
  for (let i = 0; i < 120; i++) {
    const point = new Vector3(1.5, -1.4 + (2.8 * i) / 119, 1.5).project(
      bandCamera,
    );
    const x = Math.round(((point.x + 1) * bandImage.info.width) / 2),
      y = Math.round(((1 - point.y) * bandImage.info.height) / 2);
    let found = false;
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        const index =
          ((y + dy) * bandImage.info.width + x + dx) * bandImage.info.channels;
        const [r, g, b] = [
          bandImage.data[index],
          bandImage.data[index + 1],
          bandImage.data[index + 2],
        ];
        if (r > 170 && g > 120 && b < 120) found = true;
      }
    if (found) visibleGold++;
  }
  expect(
    visibleGold / 120,
    "ligne jaune visuellement continue",
  ).toBeGreaterThanOrEqual(0.98);
  let extracted = false;
  for (let attempt = 0; attempt < 160 && !extracted; attempt++) {
    await page.getByRole("button", { name: "Un indice" }).click();
    const text = await page.getByRole("status").innerText(),
      id = await page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key)!).session.hint as string | null,
        SAVE_KEY,
      );
    if (!id) throw Error(text);
    const arrow = reference18.arrows.find((a) => a.id === id)! as Arrow,
      head = arrow.cells.at(-1)!,
      f = FRAMES[head.face];
    const box = await page.locator("canvas").boundingBox();
    if (!box) throw Error("Canvas absent");
    const camera = new PerspectiveCamera(40, box.width / box.height, 0.1, 1000);
    camera.position
      .set(...f.n)
      .multiplyScalar(8.5)
      .addScaledVector(new Vector3(...f.u), 0.8)
      .addScaledVector(new Vector3(...f.v), 0.8)
      .normalize()
      .multiplyScalar(9);
    camera.up.set(...f.v);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    const point = new Vector3(...position(head, 24, 0.07))
      .addScaledVector(
        new Vector3(...directionVector(head.face, arrow.direction)),
        -0.15,
      )
      .multiplyScalar(3 / 24)
      .project(camera);
    await page.evaluate(
      () =>
        new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        ),
    );
    await page.touchscreen.tap(
      box.x + ((point.x + 1) * box.width) / 2,
      box.y + ((1 - point.y) * box.height) / 2,
    );
    await expect(page.locator(".remaining strong")).toHaveText(
      String(365 - attempt),
      { timeout: 2000 },
    );
    extracted = arrow.cells[0].face !== arrow.cells.at(-1)!.face;
  }
  expect(extracted).toBe(true);
  expect(errors).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Choisir un niveau").selectOption("0");
  await page.getByLabel("Choisir un niveau").selectOption("17");
  await expect(page.locator(".scene-container")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await page.screenshot({
    path: ".tmp/reference-18-mobile.png",
    fullPage: true,
  });
});

test("victoire, reprise locale et coffre attribué une fois", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  const seeded = newProfile();
  let profile = seeded;
  for (const n of [2, 3, 4, 5]) profile = completeLevel(profile, n, 60, 3);
  profile.session.removed = DEMOS[0].arrows.slice(0, -1).map((a) => a.id);
  await page.evaluate(
    ({ key, profile }) => localStorage.setItem(key, JSON.stringify(profile)),
    { key: SAVE_KEY, profile },
  );
  await page.reload();
  await expect(page.locator(".remaining strong")).toHaveText("1");
  await page.getByRole("button", { name: "Un indice", exact: true }).click();
  const first = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).hints,
    SAVE_KEY,
  );
  await page.getByRole("button", { name: "Un indice", exact: true }).click();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).hints,
      SAVE_KEY,
    ),
  ).toBe(first);
  await tap(page, DEMOS[0].arrows.at(-1)!, true);
  await expect(
    page.getByRole("heading", { name: "La voie est libre." }),
  ).toBeVisible();
  await expect(page.getByLabel("120 pièces", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Tour des récompenses", exact: true })
    .click();
  await page.getByRole("button", { name: "Ouvrir", exact: true }).click();
  await expect(page.getByLabel("180 pièces", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Récupéré", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "La voie est libre." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Tour des récompenses", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Récupéré", exact: true }),
  ).toBeDisabled();
  await expect(page.getByLabel("180 pièces", { exact: true })).toBeVisible();
  await page.screenshot({ path: ".tmp/rewards-tower.png", fullPage: true });
});

test("trois tentatives bloquées épuisent les vies, puis un redémarrage les restaure", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByLabel("Choisir un niveau").selectOption("1");
  for (let lives = 2; lives >= 0; lives--) {
    await tap(page, DEMOS[1].arrows[0], false);
    await expect(
      page.getByLabel(`${lives} vies restantes`, { exact: true }),
    ).toBeVisible();
  }
  await expect(
    page.getByRole("dialog", { name: "Plus de vies pour ce cube." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Recommencer avec 3 vies", exact: true })
    .click();
  await expect(
    page.getByLabel("3 vies restantes", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".remaining strong")).toHaveText("6");
  await page
    .getByRole("button", { name: "Mettre en pause", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Un instant pour réfléchir." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reprendre", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
