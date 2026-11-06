import { LEVELS as DEMOS } from "../src/features/levels/campaign";
import { traceRoute, validateLevel } from "../src/features/game/core/engine";
import { readFileSync } from "node:fs";
for (const level of DEMOS) {
  const frozen = JSON.parse(
    readFileSync(`content/levels/${level.id}.json`, "utf8"),
  );
  if (JSON.stringify(frozen) !== JSON.stringify(level))
    throw new Error(
      `Définition modifiée sans nouvelle validation : ${level.id}`,
    );
  validateLevel(frozen);
  console.log(
    `${level.id} : ${level.arrows.length} flèches, ${Math.max(...level.arrows.map((a) => traceRoute(level, a).crossings))} arêtes, certificat valide`,
  );
}
