import { mkdir, writeFile } from "node:fs/promises";
import { makeBaseLevel } from "../src/features/levels/campaign-base";
import {
  FACES,
  DELTAS,
  key,
  traceRoute,
  tryExtract,
  validateLevel,
  type Arrow,
  type Cell,
  type Direction,
  type Level,
} from "../src/features/game/core/engine";
const directions = Object.keys(DELTAS) as Direction[];
for (const number of [16, 20, 100]) {
  let seed = number * 65537;
  const random = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
  const n = number === 16 ? 36 : number === 20 ? 38 : 40;
  const base = makeBaseLevel(number);
  const edgeRules = base.edgeRules.length
    ? Array.from({ length: n }, (_, index) =>
        base.edgeRules
          .filter((r) => r.index === 0)
          .map((r) => ({ ...r, index })),
      ).flat()
    : [];
  const level: Level = {
    ...base,
    version: 1,
    gridSize: n,
    arrows: [],
    solution: [],
    edgeRules,
  };
  const occupied = new Set<string>();
  const target = number === 16 ? 420 : number === 20 ? 480 : 540;
  let tries = 0;
  while (level.arrows.length < target && tries++ < 200000) {
    const face = FACES[Math.floor(random() * 6)],
      direction = directions[Math.floor(random() * 4)];
    const head: Cell = {
      face,
      x: Math.floor(random() * n),
      y: Math.floor(random() * n),
    };
    if (occupied.has(key(head))) continue;
    const route = traceRoute(level, {
      id: "candidate",
      cells: [head],
      direction,
    });
    if (route.steps.some((s) => occupied.has(key(s.cell)))) continue;
    const [dx, dy] = DELTAS[direction];
    const first = { face, x: head.x - dx, y: head.y - dy };
    if (
      first.x < 0 ||
      first.y < 0 ||
      first.x >= n ||
      first.y >= n ||
      occupied.has(key(first))
    )
      continue;
    const reverse: Cell[] = [head, first],
      seen = new Set(reverse.map(key));
    let last: [number, number] = [-dx, -dy],
      turns = 0;
    const length = 5 + Math.floor(random() * 6);
    while (reverse.length < length) {
      const tail = reverse.at(-1)!;
      const options = directions
        .map((d) => DELTAS[d])
        .filter(([x, y]) => {
          const c = { face, x: tail.x + x, y: tail.y + y };
          return (
            c.x >= 0 &&
            c.y >= 0 &&
            c.x < n &&
            c.y < n &&
            !occupied.has(key(c)) &&
            !seen.has(key(c))
          );
        });
      if (!options.length) break;
      const bent = options.filter(([x, y]) => x !== last[0] || y !== last[1]);
      const choices = bent.length && random() < 0.85 ? bent : options;
      const delta = choices[Math.floor(random() * choices.length)];
      if (delta[0] !== last[0] || delta[1] !== last[1]) turns++;
      last = [...delta];
      const c = { face, x: tail.x + delta[0], y: tail.y + delta[1] };
      reverse.push(c);
      seen.add(key(c));
    }
    if (reverse.length < 5 || turns < 3) continue;
    const arrow: Arrow = {
      id: `t${level.arrows.length}`,
      cells: reverse.reverse(),
      direction,
    };
    if (!tryExtract(level, [...level.arrows, arrow], arrow.id).ok) continue;
    level.arrows.push(arrow);
    level.solution.unshift(arrow.id);
    arrow.cells.forEach((c) => occupied.add(key(c)));
  }
  if (level.arrows.length <= 300)
    throw Error(`${number}: seulement ${level.arrows.length} flèches`);
  validateLevel(level);
  level.description = `Plateau d’essai ${number} · ${level.arrows.length} flèches enchevêtrées, au moins trois changements de direction par tracé.`;
  await mkdir("content/previews", { recursive: true });
  await writeFile(
    `content/previews/level-${number}.json`,
    JSON.stringify(level),
  );
  console.log(
    `${number}: ${level.arrows.length} flèches, ${tries} tentatives, certificat valide`,
  );
}
