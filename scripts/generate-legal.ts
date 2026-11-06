import nextEnv from "@next/env";
import { cloudConfig } from "../src/features/cloud/config";
import {
  existsSync,
  mkdtempSync,
  cpSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { SHOP_OFFERS, COIN_OFFERS } from "../src/features/shop/catalog";

const root = process.cwd();
nextEnv.loadEnvConfig(root, false);
const firebase = cloudConfig();
mkdirSync(resolve(root, ".tmp"), { recursive: true });
const staging = mkdtempSync(resolve(root, ".tmp/legal-build-"));
cpSync(resolve(root, "legal/kit"), staging, { recursive: true });
for (const dir of ["apps", "catalogs"])
  mkdirSync(join(staging, dir), { recursive: true });
const app = JSON.parse(
  readFileSync(resolve(root, "legal/cubelyo.json"), "utf8"),
);
if (process.env.NEXT_PUBLIC_APP_URL) app.url = process.env.NEXT_PUBLIC_APP_URL;
else if (process.env.VERCEL_URL) app.url = `https://${process.env.VERCEL_URL}`;
if (firebase) {
  const supplement = JSON.parse(
    readFileSync(resolve(root, "legal/firebase-draft.json"), "utf8"),
  );
  app.version += "-firebase";
  app.features.accounts = true;
  app.hosting = supplement.hosting;
  app.processing.push(supplement.processing);
  app.providers = supplement.providers;
  Object.assign(app.clauses, supplement.clauses);
  app.clauses.cookies += supplement.cookies;
}
writeFileSync(join(staging, "apps/cubelyo.json"), JSON.stringify(app, null, 2));
const offers = [
  ...SHOP_OFFERS.map((o) => ({
    id: o.id,
    name: o.title,
    description: `${o.hints} indice(s), ${o.erasers} gomme(s), ${o.wands} baguette(s), ${o.coins} pièce(s)${o.removesAds ? "; suppression des publicités imposées prévue" : ""}`,
    amountMinor: o.priceCents,
  })),
  ...COIN_OFFERS.map((o) => ({
    id: `coins-${o.coins}`,
    name: `${o.coins.toLocaleString("fr-FR")} pièces`,
    description: "Pièces du jeu",
    amountMinor: o.priceCents,
  })),
].map((o) => ({
  ...o,
  type: "one_time",
  channel: "App Store / Google Play (prévus)",
  status: "planned",
  priceSource: "store",
  storeProductId: null,
  taxDisplay: "TTC",
  period: null,
}));
writeFileSync(
  join(staging, "catalogs/cubelyo.json"),
  JSON.stringify({ currency: "EUR", offers }, null, 2),
);
const engine = await import(
  pathToFileURL(join(staging, "scripts/generate.mjs")).href
);
const generated = engine.generate("cubelyo");
const report = JSON.parse(
  readFileSync(join(generated, "rapport.json"), "utf8"),
);
const directory = `${app.version}/${report.configurationSha256.slice(0, 16)}`;
const target = resolve(root, "legal/generated", directory);
writeFileSync(
  resolve(root, "legal/current.json"),
  JSON.stringify({ directory, version: app.version, mode: "draft" }, null, 2) +
    "\n",
);
if (existsSync(join(target, "rapport.json"))) {
  const previous = JSON.parse(
    readFileSync(join(target, "rapport.json"), "utf8"),
  );
  const current = JSON.parse(
    readFileSync(join(generated, "rapport.json"), "utf8"),
  );
  if (previous.configurationSha256 !== current.configurationSha256)
    throw new Error(
      "Édition existante différente : incrémenter legal/cubelyo.json version pour conserver l’archive.",
    );
  console.log("Édition identique déjà générée, archive conservée.");
  process.exit(0);
}
mkdirSync(target, { recursive: true });
for (const file of readdirSync(generated)) {
  const dest = join(target, file);
  const text = readFileSync(join(generated, file), "utf8");
  // Keep older documentary versions; regenerating this draft updates only its own edition.
  writeFileSync(dest, text);
}
console.log(
  `Brouillons intégrés : ${target}. Validation juridique non approuvée.`,
);
