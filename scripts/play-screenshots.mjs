// Captures pour la fiche Google Play : téléphone, tablette 7" et tablette 10".
// Serveur de dev hors ligne lancé sur le port 3107, puis :
//   node scripts/play-screenshots.mjs              (les trois formats)
//   node scripts/play-screenshots.mjs tablet-10    (un seul format)
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const BASE = process.env.CUBELYO_URL ?? "http://127.0.0.1:3107";
const KEY = "cubelyo.profile.v1";
/** Tailles en dp × densité = pixels exportés (portrait, ratio ≤ 2:1 exigé par Play). */
const DEVICES = {
  phone: { width: 360, height: 640, scale: 3 }, // 1080 × 1920
  "tablet-7": { width: 600, height: 960, scale: 2 }, // 1200 × 1920
  "tablet-10": { width: 800, height: 1280, scale: 2 }, // 1600 × 2560
};
// Masque l'indicateur Next.js et les mentions réservées aux versions de test.
const CLEAN = `nextjs-portal{display:none!important}
  .test-access{visibility:hidden!important}
  .catalogue-title span{display:none!important}`;

const browser = await chromium.launch({ channel: "chrome" });
const wanted = process.argv.slice(2).filter((d) => d in DEVICES);
for (const name of wanted.length ? wanted : Object.keys(DEVICES))
  await capture(name, DEVICES[name]);
await browser.close();

async function capture(device, { width, height, scale }) {
  const out = fileURLToPath(
    new URL(`../android/store/screenshots/${device}/`, import.meta.url),
  );
  mkdirSync(out, { recursive: true });
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: scale,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const shot = async (name, wait = 1500) => {
    for (const text of ["Préparation de votre aventure…", "Préparation du cube…"])
      await page.getByText(text).waitFor({ state: "detached", timeout: 60000 });
    await page.waitForTimeout(wait);
    await page.addStyleTag({ content: CLEAN });
    await page.screenshot({ path: `${out}${name}.png` });
    console.log(`✓ ${device}/${name}`);
  };
  // Le serveur de dev peut recharger la page juste après l'ouverture : attendre qu'elle soit stable.
  let lastNav = Date.now();
  page.on("framenavigated", (f) => {
    if (f === page.mainFrame()) lastNav = Date.now();
  });
  const settle = async () => {
    while (Date.now() - lastNav < 12000) await page.waitForTimeout(500);
  };
  const button = (name) => page.getByRole("button", { name, exact: true });
  /** Lance ou reprend la partie et attend que le cube soit affiché. */
  const play = async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      await page.getByRole("button", { name: /^(Jouer|Reprendre)/ }).click();
      await button("Un indice").waitFor({ timeout: 60000 });
      await page.waitForTimeout(4000);
      if (await button("Un indice").isVisible()) return;
      await settle(); // rechargement tardif : relancer la partie
    }
    throw Error("Impossible d'ouvrir la partie");
  };
  /** Modifie la sauvegarde locale puis recharge l'application. */
  const patch = async (fn) => {
    await page.evaluate(
      ({ key, fn }) => {
        const p = JSON.parse(localStorage.getItem(key));
        localStorage.setItem(key, JSON.stringify(new Function("p", fn)(p)));
      },
      { key: KEY, fn },
    );
    await page.reload();
    await settle();
  };

  // 1-2. Nouveau joueur : cadeau d'accueil, puis accueil.
  await page.goto(BASE);
  await settle();
  await page.getByText("Bienvenue dans Cubelyo").waitFor({ timeout: 60000 });
  await shot("01-bienvenue");
  await button("Super").click();
  await shot("02-accueil");

  // 3-4. Premier cube, puis un indice affiché.
  await play();
  await shot("03-niveau", 2500);
  await button("Un indice").click();
  await shot("04-indice", 1200);

  // 5. Victoire : la baguette libère le cube.
  await patch("p.wands = 99; return p;");
  await play();
  const victory = page.getByRole("heading", { name: "La voie est libre." });
  for (let i = 0; i < 40 && !(await victory.isVisible()); i++) {
    await button("Baguette").click({ timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1200);
  }
  // Réserve de baguettes gonflée pour l'occasion : afficher un stock réaliste.
  await page.evaluate(() => {
    const badges = document.querySelectorAll(".stock-badge");
    if (badges.length) badges[badges.length - 1].textContent = "1";
  });
  await shot("05-victoire", 2000);

  // 6-8. Joueur avancé : 59 niveaux terminés, grand cube, tour et boutique.
  await patch(
    `p.completed = {};
    for (let n = 1; n <= 59; n++) p.completed[n] = { score: 100 + n * 20, stars: n % 4 ? 3 : 2 };
    p.tower = { ...p.tower, floors: 59 };
    p.coins = 1860; p.hints = 6; p.erasers = 3; p.wands = 2;
    p.energy = { stars: 5, updatedAt: Date.now() };
    p.session = { index: 59, removed: [], blocked: [], lives: 3, lost: 0, hint: null, active: false, finished: false };
    return p;`,
  );
  await play();
  await shot("06-grand-cube", 3000);
  await page.goto(BASE);
  await settle();
  await button("Tour").click();
  await shot("07-tour", 2500);
  await button("Boutique").click();
  await shot("08-boutique", 2500);

  await context.close();
  console.log(`Captures ${device} enregistrées dans ${out}`);
}
