import { readFile, writeFile, mkdir } from "node:fs/promises";
import { buildWovenLevel } from "./lib/woven-level";
import { buildExpertLocks } from "./lib/expert-locks";
import { progressionAt } from "../src/features/levels/progression";
import { validateLevel, type Level } from "../src/features/game/core/engine";
import {
  inspectReasoning,
  inspectDependencies,
  inspectFootprints,
} from "../src/features/levels/quality";
const randomAt = (initial: number) => {
  let seed = initial;
  return () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
};
await mkdir("content/campaign", { recursive: true });
const manifest: { number: number; seed: number }[] = [];
const index = Array.from({ length: 97 }, (_, i) => i + 4);
const requested = process.argv.slice(2).map(Number);
for (let number = 4; number <= 100; number++) {
  if (number === 18 || (requested.length && !requested.includes(number)))
    continue;
  const p = progressionAt(number);
  let selected: Level | undefined;
  for (let attempt = 0; attempt < 80; attempt++) {
    const seed = number * 100003 + attempt * 7919;
    try {
      const level = buildWovenLevel(
        number,
        p.gridSize,
        p.perFace,
        seed,
        p.bands,
      );
      const expert = buildExpertLocks(level, randomAt(seed ^ 0x5f3759df), {
        maxRoots: p.maxRoots,
        minDirections: p.minDirections,
        attempts: 40000,
      });
      if (!expert.ok) continue;
      validateLevel(level);
      const r = inspectReasoning(level),
        q = inspectDependencies(level),
        f = inspectFootprints(level);
      if (
        r.initialChoices < p.minRoots ||
        r.chainFaces.length < (number <= 15 ? 4 : 6) ||
        r.multiPrerequisiteArrows <
          level.arrows.length * (number <= 15 ? 0.3 : 0.6) ||
        r.multiFacePrerequisites < level.arrows.length * 0.2 ||
        r.longestChain < p.minChain ||
        r.maxAvailable > p.maxAvailable ||
        f.ratio < p.minIrregular ||
        !q.stronglyConnected ||
        Object.values(q.isolatedRemainders).some((n) => !n) ||
        Object.values(q.directions).some((c) =>
          Object.values(c).some((n) => n < p.minDirections),
        )
      )
        continue;
      if (
        level.arrows.filter((a) => a.cells[0].face !== a.cells.at(-1)!.face)
          .length < (number <= 15 ? 3 : 10)
      )
        continue;
      selected = level;
      manifest.push({ number, seed });
      await writeFile(
        `content/campaign/level-${number}.json`,
        JSON.stringify(level),
      );
      console.log(
        JSON.stringify({
          number,
          attempt,
          roots: r.initialChoices,
          chain: r.longestChain,
          peak: r.maxAvailable,
          irregular: f.ratio,
        }),
      );
      break;
    } catch (error) {
      console.log(
        `Essai rejeté ${number}/${attempt}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
  if (!selected)
    throw Error(`Aucune construction conforme pour le niveau ${number}`);
}
// Les graines retenues permettent de retrouver chaque construction.
let previous: { number: number; seed: number }[] = [];
if (requested.length) {
  try {
    previous = JSON.parse(
      await readFile("content/campaign/generation.json", "utf8"),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
const merged = [
  ...previous.filter((p) => !manifest.some((m) => m.number === p.number)),
  ...manifest,
].sort((a, b) => a.number - b.number);
await writeFile(
  "content/campaign/generation.json",
  JSON.stringify(merged, null, 2),
);
if (!requested.length)
  await writeFile(
    "src/features/levels/generated-campaign.ts",
    'import { type Level } from "../game/core/engine";\n' +
      index
        .map(
          (n) =>
            `import level${n} from "../../../content/${n === 18 ? "previews" : "campaign"}/level-${n}.json";`,
        )
        .join("\n") +
      `\nexport const GENERATED_CAMPAIGN: Level[] = [${index.map((n) => `level${n}`).join(",")} ] as Level[];\n`,
  );
