// Captures téléphone pour la fiche Google Play (1080 × 1920, format 9:16).
// Serveur de dev hors ligne lancé sur le port 3107, puis : node scripts/play-screenshots.mjs
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const BASE = process.env.CUBELYO_URL ?? "http://127.0.0.1:3107";
const OUT = fileURLToPath(
  new URL("../android/store/screenshots/", import.meta.url),
);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 360, height: 640 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
// Masque l'indicateur du serveur de dev Next.js avant chaque capture.
const shot = async (name) => {
  for (const text of ["Préparation de votre aventure…", "Préparation du cube…"])
    await page.getByText(text).waitFor({ state: "detached", timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.screenshot({ path: `${OUT}${name}.png` });
};
const button = (name) => page.getByRole("button", { name, exact: true });

await page.goto(BASE);
// Nouveau joueur : cadeau d'accueil, puis accueil.
await page.getByRole("dialog", { name: "Bienvenue dans Cubelyo" }).waitFor();
await shot("01-bienvenue");
await button("Super").click();
await shot("02-accueil");
await page.getByRole("button", { name: /^Jouer/ }).click();
await page
  .getByText("Préparation du cube…")
  .waitFor({ state: "detached", timeout: 30000 })
  .catch(() => {});
await page.waitForTimeout(2500);
await shot("03-niveau");
await page.goto(BASE); // retour à l'accueil (la partie reste sauvegardée)
await button("Tour").click();
await page.waitForTimeout(2500);
await shot("04-tour");
await button("Boutique").click();
await page.waitForTimeout(2500);
await shot("05-boutique");
await browser.close();
console.log(`Captures enregistrées dans ${OUT}`);
