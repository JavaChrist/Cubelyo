// Génère les icônes Android, les images de démarrage et l'icône de la fiche Play
// à partir de public/cubelyo-icon-512.png. Relancer après tout changement d'icône :
//   node scripts/build-android-icons.mjs
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const SOURCE = fileURLToPath(
  new URL("../public/cubelyo-icon-512.png", import.meta.url),
);
const RES = new URL("../android/app/src/main/res/", import.meta.url);
const STORE = new URL("../android/store/", import.meta.url);
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
/** Fond clair de l'application (globals.css), repris par l'écran de démarrage. */
export const SPLASH_BACKGROUND = "#eaf3ff";

const icon = (size) =>
  sharp(SOURCE).resize(size, size, { kernel: "lanczos3" }).png().toBuffer();
const out = (dir, name) => {
  const url = new URL(`${dir}/`, RES);
  mkdirSync(url, { recursive: true });
  return fileURLToPath(new URL(name, url));
};
/** Image transparente de `canvas` px avec l'icône de `size` px au centre. */
const centered = async (
  canvas,
  size,
  background = { r: 0, g: 0, b: 0, alpha: 0 },
) =>
  sharp({
    create: { width: canvas.w, height: canvas.h, channels: 4, background },
  })
    .composite([{ input: await icon(size), gravity: "centre" }])
    .png();
// Dégradé du fond de l'icône (bleu vif en haut à gauche, bleu nuit en bas à droite).
const gradient = (size) =>
  sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0b31fc"/><stop offset="0.55" stop-color="#0414b4"/>
          <stop offset="1" stop-color="#01015c"/></linearGradient></defs>
        <rect width="100%" height="100%" fill="url(#g)"/></svg>`,
    ),
  ).png();

for (const [name, d] of Object.entries(DENSITIES)) {
  const dir = `mipmap-${name}`,
    legacy = Math.round(48 * d),
    adaptive = Math.round(108 * d);
  // Icônes classiques (Android 7) : carré arrondi et version ronde.
  await sharp(await icon(legacy)).toFile(out(dir, "ic_launcher.png"));
  const circle = Buffer.from(
    `<svg width="${legacy}" height="${legacy}"><circle cx="${legacy / 2}" cy="${legacy / 2}" r="${legacy / 2}"/></svg>`,
  );
  await sharp(await icon(Math.round(legacy * 1.04)))
    .resize(legacy, legacy, { fit: "cover" })
    .composite([{ input: circle, blend: "dest-in" }])
    .png()
    .toFile(out(dir, "ic_launcher_round.png"));
  // Icône adaptative (Android 8+) : l'icône remplit la zone visible de 72 dp sur 108 dp,
  // le dégradé comble les coins pour les masques carrés ou arrondis.
  await (
    await centered({ w: adaptive, h: adaptive }, Math.round(72 * d))
  ).toFile(out(dir, "ic_launcher_foreground.png"));
  await gradient(adaptive).toFile(out(dir, "ic_launcher_background.png"));
  // Écran de démarrage Android 12+ : icône de 136 dp dans le cercle de 192 dp d'un canevas de 288 dp.
  const splash = Math.round(288 * d);
  await (
    await centered({ w: splash, h: splash }, Math.round(136 * d))
  ).toFile(out(`drawable-${name}`, "splash_icon.png"));
}

// Écran de démarrage historique (Android 7 à 11) : icône centrée sur le fond clair.
const bg = SPLASH_BACKGROUND.match(/\w\w/g).map((h) => parseInt(h, 16));
const legacyBg = { r: bg[0], g: bg[1], b: bg[2], alpha: 1 };
const SPLASHES = {
  drawable: [480, 320, 1],
  "drawable-port-mdpi": [320, 480, 1],
  "drawable-port-hdpi": [480, 800, 1.5],
  "drawable-port-xhdpi": [720, 1280, 2],
  "drawable-port-xxhdpi": [960, 1600, 3],
  "drawable-port-xxxhdpi": [1280, 1920, 4],
  "drawable-land-mdpi": [480, 320, 1],
  "drawable-land-hdpi": [800, 480, 1.5],
  "drawable-land-xhdpi": [1280, 720, 2],
  "drawable-land-xxhdpi": [1600, 960, 3],
  "drawable-land-xxxhdpi": [1920, 1280, 4],
};
for (const [dir, [w, h, d]] of Object.entries(SPLASHES))
  await (
    await centered({ w, h }, Math.min(Math.round(120 * d), 512), legacyBg)
  ).toFile(out(dir, "splash.png"));

// Icône de la fiche Play : 512 × 512, PNG 32 bits.
mkdirSync(STORE, { recursive: true });
await sharp(SOURCE)
  .png()
  .toFile(fileURLToPath(new URL("play-icon-512.png", STORE)));
// Image de présentation de la fiche Play : 1024 × 500, sans transparence.
const banner = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b31fc"/><stop offset="0.6" stop-color="#0414b4"/>
      <stop offset="1" stop-color="#01015c"/></linearGradient></defs>
    <rect width="1024" height="500" fill="url(#g)"/>
    <g font-family="Segoe UI, Arial, sans-serif" fill="#ffffff">
      <text x="440" y="235" font-size="92" font-weight="800">Cubelyo</text>
      <text x="444" y="295" font-size="34" font-weight="600" fill="#bfe8ff">Libérez chaque flèche du cube.</text>
      <text x="444" y="345" font-size="28" fill="#dbe6ff">Casse-tête 3D · 100 niveaux</text>
    </g></svg>`,
);
await sharp(banner)
  .composite([{ input: await icon(330), left: 70, top: 85 }])
  .flatten({ background: "#0414b4" })
  .png()
  .toFile(fileURLToPath(new URL("play-feature-1024x500.png", STORE)));
console.log("Icônes Android générées.");
