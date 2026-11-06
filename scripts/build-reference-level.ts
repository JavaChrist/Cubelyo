import { buildWovenLevel } from "./lib/woven-level";
import { buildExpertLocks } from "./lib/expert-locks";
import {
  inspectDependencies,
  inspectFootprints,
  inspectReasoning,
  inspectBands,
} from "../src/features/levels/quality";
import { validateLevel } from "../src/features/game/core/engine";
import { mkdir, writeFile } from "node:fs/promises";
const level = buildWovenLevel(18, 24, 61, 180005);
level.description =
  "366 flèches dans les quatre directions, avec des blocages croisés entre les six faces.";
let expertSeed = 180828;
const expert = buildExpertLocks(level, () => {
  expertSeed ^= expertSeed << 13;
  expertSeed ^= expertSeed >>> 17;
  expertSeed ^= expertSeed << 5;
  return (expertSeed >>> 0) / 4294967296;
});
if (!expert.ok) throw Error("Impossible de construire les verrous experts");
validateLevel(level);
const quality = inspectDependencies(level);
const reasoning = inspectReasoning(level);
const bands = inspectBands(level);
if (bands.count !== 1 || !bands.fullLength)
  throw Error("Le niveau 18 doit avoir une seule arête jaune entière");
if (
  reasoning.initialChoices < 2 ||
  reasoning.initialChoices > 4 ||
  reasoning.longestChain < 60 ||
  reasoning.chainFaces.length !== 6 ||
  reasoning.maxSimultaneousUnlocks > 4 ||
  reasoning.maxAvailable > 8 ||
  reasoning.multiPrerequisiteArrows < 280 ||
  reasoning.multiFacePrerequisites < 130 ||
  reasoning.crossFaceUnlocks < 10
)
  throw Error(`Raisonnement insuffisant : ${JSON.stringify(reasoning)}`);
const footprints = inspectFootprints(level);
if (
  footprints.ratio < 0.9 ||
  footprints.minLength >= 6 ||
  footprints.maxLength <= 18
)
  throw Error(`Tracés encore trop réguliers : ${JSON.stringify(footprints)}`);
if (
  !quality.stronglyConnected ||
  Object.values(quality.isolatedRemainders).some((n) => n === 0) ||
  Object.values(quality.directions).some((count) =>
    Object.values(count).some((n) => n < 3),
  )
)
  throw Error(`Qualité insuffisante : ${JSON.stringify(quality)}`);
const differentEnds = level.arrows.filter(
  (a) => a.cells[0].face !== a.cells.at(-1)!.face,
).length;
if (differentEnds < 10)
  throw Error(`Corps multi-faces insuffisants : ${differentEnds}`);
await mkdir("content/previews", { recursive: true });
await writeFile("content/previews/level-18.json", JSON.stringify(level));
console.log(
  JSON.stringify(
    {
      arrows: level.arrows.length,
      differentEnds,
      footprints,
      bands,
      reasoning,
      ...quality,
    },
    null,
    2,
  ),
);
