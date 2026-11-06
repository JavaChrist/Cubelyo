import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { LEVELS, difficultyAt } from "../src/features/levels/campaign";
import {
  inspectDependencies,
  inspectFootprints,
  inspectBands,
  inspectReasoning,
} from "../src/features/levels/quality";
import {
  traceRoute,
  tryExtract,
  validateLevel,
} from "../src/features/game/core/engine";
const catalog = [];
for (const [i, level] of LEVELS.entries()) {
  validateLevel(level);
  const text = JSON.stringify(level);
  catalog.push({
    number: i + 1,
    id: level.id,
    generatorVersion: i === 17 ? 8 : i >= 3 ? 9 : 2,
    bands: i >= 3 ? inspectBands(level) : undefined,
    reasoning: i >= 3 ? inspectReasoning(level) : undefined,
    footprints: i >= 3 ? inspectFootprints(level) : undefined,
    interdependence: i >= 3 ? inspectDependencies(level) : undefined,
    difficulty: difficultyAt(i + 1),
    gridSize: level.gridSize,
    arrows: level.arrows.length,
    initialLegalMoves: level.arrows.filter(
      (a) => tryExtract(level, level.arrows, a.id).ok,
    ).length,
    maxCrossings: Math.max(
      ...level.arrows.map((a) => traceRoute(level, a).crossings),
    ),
    sha256: createHash("sha256").update(text).digest("hex"),
  });
}
await mkdir("content/levels", { recursive: true });
for (const level of LEVELS)
  await writeFile(`content/levels/${level.id}.json`, JSON.stringify(level));
await writeFile(
  "content/levels/catalog.json",
  JSON.stringify(catalog, null, 2) + "\n",
);
console.log(
  `100 définitions et certificats figés ; grands plateaux : ${Math.min(...LEVELS.slice(15).map((l) => l.arrows.length))} à ${Math.max(...LEVELS.map((l) => l.arrows.length))} flèches.`,
);
