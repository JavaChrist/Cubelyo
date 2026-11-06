import { weavePaths } from "./weave-paths";
import {
  tryExtract,
  step,
  OPPOSITE,
  FACES,
  key,
  type Arrow,
  type Cell,
  type Level,
  type Face,
  type Direction,
} from "../../src/features/game/core/engine";
type Rect = { x: number; y: number; w: number; h: number };
export function buildWovenLevel(
  number: number,
  n: number,
  perFace: number,
  initialSeed: number,
  bands = 1,
): Level {
  let seed = initialSeed;
  const random = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
  const shuffle = <T>(items: T[]) =>
    items
      .map((value) => ({ value, r: random() }))
      .sort((a, b) => a.r - b.r)
      .map((x) => x.value);
  const capacity = (w: number, h: number) =>
    Math.min(Math.floor(w / 2) * Math.floor(h / 2), Math.floor((w * h) / 6));
  function divide(rect: Rect, count: number): Rect[] {
    if (count === 1) return [rect];
    const choices: { a: Rect; b: Rect; ka: number }[] = [];
    for (const axis of ["w", "h"] as const)
      for (let cut = 2; cut <= rect[axis] - 2; cut++) {
        const a = { ...rect, [axis]: cut },
          b = {
            ...rect,
            [axis]: rect[axis] - cut,
            ...(axis === "w" ? { x: rect.x + cut } : { y: rect.y + cut }),
          };
        const ca = capacity(a.w, a.h),
          cb = capacity(b.w, b.h);
        const lo = Math.max(1, count - cb),
          hi = Math.min(count - 1, ca);
        if (lo > hi) continue;
        const proportional = Math.round(
          (count * a.w * a.h) / (rect.w * rect.h),
        );
        choices.push({ a, b, ka: Math.max(lo, Math.min(hi, proportional)) });
      }
    if (!choices.length)
      throw Error(`Impossible de diviser ${JSON.stringify(rect)} en ${count}`);
    // Favoriser les découpes équilibrées, tout en variant les dimensions et les raccords.
    choices.sort(
      (a, b) => Math.abs(a.ka - count / 2) - Math.abs(b.ka - count / 2),
    );
    const choice = choices[Math.floor(random() * Math.min(choices.length, 8))];
    return [
      ...divide(choice.a, choice.ka),
      ...divide(choice.b, count - choice.ka),
    ];
  }
  const dirs: Direction[] = ["east", "west", "north", "south"];
  const level: Level = {
    id: `level-${number}`,
    version: 1,
    title: `Niveau ${number}`,
    description: `${perFace * 6} flèches imbriquées, avec des blocages croisés entre les six faces.`,
    gridSize: n,
    arrows: [],
    solution: [],
    edgeRules: [],
  };
  // Une seule arête entière impose une continuation, dans les deux sens.
  for (let index = 0; index < n; index++)
    level.edgeRules.push(
      { face: "front", direction: "east", index, action: "continue" },
      { face: "right", direction: "west", index, action: "continue" },
    );
  if (bands === 2)
    for (let index = 0; index < n; index++)
      level.edgeRules.push(
        { face: "right", direction: "east", index, action: "continue" },
        { face: "back", direction: "west", index, action: "continue" },
      );
  const belt: Face[] = ["front", "right", "back", "left"];
  type Tile = {
    id: string;
    rect: Rect;
    convert: (x: number, y: number) => Cell;
  };
  const tiles: Tile[] = [];
  function add(rects: Rect[], convert: Tile["convert"]) {
    for (const rect of rects)
      tiles.push({ id: `r${tiles.length}`, rect, convert });
  }
  add(divide({ x: 0, y: 0, w: 4 * n, h: n }, perFace * 4), (x, y) => ({
    face: belt[Math.floor(x / n)],
    x: x % n,
    y,
  }));
  add(divide({ x: 0, y: 0, w: n, h: n }, perFace), (x, y) => ({
    face: "top",
    x: y,
    y: n - 1 - x,
  }));
  add(divide({ x: 0, y: 0, w: n, h: n }, perFace), (x, y) => ({
    face: "bottom",
    x: n - 1 - y,
    y: x,
  }));
  const owners = new Map<string, string>();
  for (const tile of tiles)
    for (let y = 0; y < tile.rect.h; y++)
      for (let x = 0; x < tile.rect.w; x++)
        owners.set(
          key(tile.convert(tile.rect.x + x, tile.rect.y + y)),
          tile.id,
        );
  function variant(
    tile: Tile,
    orientation: Direction,
    headY: number,
  ): Arrow | null {
    const { rect, convert } = tile,
      transpose = orientation === "north" || orientation === "south";
    const w = transpose ? rect.h : rect.w,
      h = transpose ? rect.w : rect.h;
    const transform = (u: number, v: number): Cell => {
      const x =
        orientation === "east"
          ? u
          : orientation === "west"
            ? rect.w - 1 - u
            : v;
      const y =
        orientation === "north"
          ? u
          : orientation === "south"
            ? rect.h - 1 - u
            : v;
      return convert(rect.x + x, rect.y + y);
    };
    const head = transform(w - 1, headY);
    const crossing =
      new Set(
        Array.from(
          { length: rect.w },
          (_, x) => convert(rect.x + x, rect.y).face,
        ),
      ).size > 1;
    const path: [number, number][] = [
        [w - 1, headY],
        [w - 2, headY],
      ],
      visited = new Set(path.map(([x, y]) => y * w + x));
    let budget = 10000;
    const options = (x: number, y: number) =>
      shuffle([
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ])
        .map(([dx, dy]) => [x + dx, y + dy] as [number, number])
        .filter(
          ([a, b]) =>
            a >= 0 && a < w && b >= 0 && b < h && !visited.has(b * w + a),
        );
    function visit(): boolean {
      if (path.length === w * h)
        return !crossing || transform(...path.at(-1)!).face !== head.face;
      if (--budget <= 0) return false;
      const [x, y] = path.at(-1)!;
      const choices = options(x, y)
        .map((p) => ({ p, d: options(...p).length, r: random() }))
        .sort((a, b) => a.d - b.d || a.r - b.r);
      for (const { p } of choices) {
        path.push(p);
        visited.add(p[1] * w + p[0]);
        if (visit()) return true;
        path.pop();
        visited.delete(p[1] * w + p[0]);
        if (budget <= 0) break;
      }
      return false;
    }
    if (!visit()) return null;
    const cells = path.reverse().map(([x, y]) => transform(x, y));
    const backward = dirs.find(
      (d) => key(step(cells.at(-1)!, d, n).cell) === key(cells.at(-2)!),
    )!;
    return { id: tile.id, cells, direction: OPPOSITE[backward] };
  }
  type Candidate = {
    arrow: Arrow;
    blockers: Set<string>;
    pending: number;
    cross: boolean;
  };
  const candidates: Candidate[] = [],
    watchers = new Map<string, Candidate[]>();
  for (const tile of tiles) {
    const choices: Arrow[] = [];
    for (const direction of shuffle(dirs)) {
      const h =
        direction === "north" || direction === "south"
          ? tile.rect.w
          : tile.rect.h;
      let found = 0;
      for (const y of shuffle(Array.from({ length: h }, (_, i) => i))) {
        const arrow = variant(tile, direction, y);
        if (arrow) {
          choices.push(arrow);
          if (++found >= 2) break;
        }
      }
    }
    for (const arrow of choices) {
      try {
        const result = tryExtract(level, [arrow], arrow.id);
        if (!result.ok) continue;
        const blockers = new Set<string>();
        let cross = false;
        for (const { cell } of result.route.steps) {
          const id = owners.get(key(cell));
          if (id && id !== arrow.id) {
            blockers.add(id);
            if (cell.face !== arrow.cells.at(-1)!.face) cross = true;
          }
        }
        const candidate = { arrow, blockers, pending: blockers.size, cross };
        candidates.push(candidate);
        for (const blocker of blockers) {
          const list = watchers.get(blocker) ?? [];
          list.push(candidate);
          watchers.set(blocker, list);
        }
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes("cyclique"))
          throw error;
      }
    }
    if (!candidates.some((c) => c.arrow.id === tile.id))
      throw Error(`Aucune variante valide : ${tile.id}`);
  }
  const remaining = new Set(tiles.map((t) => t.id));
  const counts = Object.fromEntries(
    FACES.map((f) => [f, Object.fromEntries(dirs.map((d) => [d, 0]))]),
  ) as Record<Face, Record<Direction, number>>;
  let lastFace: Face | null = null;
  while (remaining.size) {
    let best: Candidate | undefined,
      bestScore = -Infinity;
    for (const candidate of candidates) {
      if (candidate.pending || !remaining.has(candidate.arrow.id)) continue;
      const face = candidate.arrow.cells.at(-1)!.face;
      const score =
        (candidate.blockers.size > 0 ? 15 : 0) +
        Math.min(candidate.blockers.size, 5) +
        40 / (1 + counts[face][candidate.arrow.direction]) +
        (candidate.cross ? 12 : 0) +
        (face !== lastFace ? 8 : 0) +
        random() * 12;
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
    if (!best) throw Error(`Graphe bloqué : ${remaining.size} flèches`);
    const arrow = best.arrow,
      face = arrow.cells.at(-1)!.face;
    level.arrows.push(arrow);
    level.solution.push(arrow.id);
    remaining.delete(arrow.id);
    counts[face][arrow.direction]++;
    lastFace = face;
    for (const candidate of watchers.get(arrow.id) ?? []) candidate.pending--;
  }
  // Le tableau ne doit pas révéler l'ordre de résolution au bouton d'indice.
  level.arrows.sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
  weavePaths(level, random);
  return level;
}
