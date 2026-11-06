export type Vec = readonly [number, number, number];
export const FACES = [
  "front",
  "right",
  "back",
  "left",
  "top",
  "bottom",
] as const;
export type Face = (typeof FACES)[number];
export type Direction = "east" | "west" | "north" | "south";
export type Cell = { face: Face; x: number; y: number };
export type Arrow = { id: string; cells: Cell[]; direction: Direction };
export type EdgeRule = {
  face: Face;
  direction: Direction;
  index: number;
  action: "continue" | "exit";
};
export type Level = {
  id: string;
  version: 1;
  title: string;
  description: string;
  gridSize: number;
  arrows: Arrow[];
  edgeRules: EdgeRule[];
  solution: string[];
};
export const FRAMES: Record<Face, { u: Vec; v: Vec; n: Vec }> = {
  front: { u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, 1] },
  right: { u: [0, 0, -1], v: [0, 1, 0], n: [1, 0, 0] },
  back: { u: [-1, 0, 0], v: [0, 1, 0], n: [0, 0, -1] },
  left: { u: [0, 0, 1], v: [0, 1, 0], n: [-1, 0, 0] },
  top: { u: [1, 0, 0], v: [0, 0, -1], n: [0, 1, 0] },
  bottom: { u: [1, 0, 0], v: [0, 0, 1], n: [0, -1, 0] },
};
export const DELTAS: Record<Direction, readonly [number, number]> = {
  east: [1, 0],
  west: [-1, 0],
  north: [0, 1],
  south: [0, -1],
};
export const OPPOSITE: Record<Direction, Direction> = {
  east: "west",
  west: "east",
  north: "south",
  south: "north",
};
export const key = (c: Cell) => `${c.face}:${c.x}:${c.y}`;
const dot = (a: Vec, b: Vec) => a.reduce((s, v, i) => s + v * b[i], 0);
export function directionVector(face: Face, direction: Direction): Vec {
  const { u, v } = FRAMES[face],
    [dx, dy] = DELTAS[direction];
  return [0, 1, 2].map((i) => u[i] * dx + v[i] * dy) as unknown as Vec;
}
export function position(cell: Cell, size: number, lift = 0.025): Vec {
  const { u, v, n } = FRAMES[cell.face];
  return [0, 1, 2].map(
    (i) =>
      u[i] * (cell.x - (size - 1) / 2) +
      v[i] * (cell.y - (size - 1) / 2) +
      n[i] * (size / 2 + lift),
  ) as unknown as Vec;
}
/** Transport sur une arête : la normale voisine est la direction sortante.
 * La nouvelle direction est l'opposé de l'ancienne normale. */
export function step(
  cell: Cell,
  direction: Direction,
  size: number,
): { cell: Cell; direction: Direction; crossed: boolean } {
  const [dx, dy] = DELTAS[direction],
    x = cell.x + dx,
    y = cell.y + dy;
  if (x >= 0 && x < size && y >= 0 && y < size)
    return { cell: { ...cell, x, y }, direction, crossed: false };
  const movement = directionVector(cell.face, direction);
  const face = FACES.find((f) => dot(FRAMES[f].n, movement) === 1)!;
  const frame = FRAMES[face],
    oldNormal = FRAMES[cell.face].n;
  const nextDirection = (Object.keys(DELTAS) as Direction[]).find(
    (d) => dot(directionVector(face, d), oldNormal) === -1,
  )!;
  const p = position(cell, size, 0).map(
    (v, i) => v + movement[i] * 0.5,
  ) as unknown as Vec;
  const coord = (axis: Vec) =>
    Math.max(0, Math.min(size - 1, Math.round(dot(p, axis) + (size - 1) / 2)));
  return {
    cell: { face, x: coord(frame.u), y: coord(frame.v) },
    direction: nextDirection,
    crossed: true,
  };
}
export type Route = {
  steps: { cell: Cell; direction: Direction }[];
  crossings: number;
  exit: { cell: Cell; direction: Direction };
};
export function traceRoute(level: Level, arrow: Arrow): Route {
  let cell = arrow.cells.at(-1)!,
    direction = arrow.direction,
    crossings = 0;
  const seen = new Set<string>(),
    steps: Route["steps"] = [];
  while (true) {
    const state = `${key(cell)}:${direction}`;
    if (seen.has(state)) throw new Error(`Route cyclique : ${arrow.id}`);
    seen.add(state);
    const next = step(cell, direction, level.gridSize);
    if (next.crossed) {
      const index =
        direction === "east" || direction === "west" ? cell.y : cell.x;
      const rule = level.edgeRules.find(
        (r) =>
          r.face === cell.face &&
          r.direction === direction &&
          r.index === index,
      );
      if (rule?.action !== "continue")
        return { steps, crossings, exit: { cell, direction } };
      crossings++;
    }
    cell = next.cell;
    direction = next.direction;
    steps.push({ cell, direction });
  }
}
export type Extraction =
  | { ok: true; route: Route }
  | {
      ok: false;
      blocker: string;
      cell: Cell;
      route: Route;
      collisionIndex: number;
    };
export function tryExtract(
  level: Level,
  arrows: Arrow[],
  id: string,
): Extraction {
  const arrow = arrows.find((a) => a.id === id);
  if (!arrow) throw new Error("Flèche absente");
  const route = traceRoute(level, arrow);
  const occupied = new Map(
    arrows
      .filter((a) => a.id !== id)
      .flatMap((a) => a.cells.map((c) => [key(c), a.id] as const)),
  );
  const ownBody = new Set(arrow.cells.map(key));
  for (const [collisionIndex, { cell }] of route.steps.entries()) {
    const blocker =
      occupied.get(key(cell)) ?? (ownBody.has(key(cell)) ? id : undefined);
    if (blocker) return { ok: false, blocker, cell, route, collisionIndex };
  }
  return { ok: true, route };
}
export function validateLevel(level: Level) {
  const occupied = new Set<string>();
  if (!Number.isInteger(level.gridSize) || level.gridSize < 2)
    throw new Error("Grille invalide");
  if (new Set(level.arrows.map((a) => a.id)).size !== level.arrows.length)
    throw new Error("Identifiants dupliqués");
  for (const a of level.arrows) {
    if (a.cells.length < 2) throw new Error("Corps trop court");
    for (const [i, c] of a.cells.entries()) {
      if (
        !FACES.includes(c.face) ||
        !Number.isInteger(c.x) ||
        !Number.isInteger(c.y) ||
        c.x < 0 ||
        c.y < 0 ||
        c.x >= level.gridSize ||
        c.y >= level.gridSize ||
        occupied.has(key(c))
      )
        throw new Error("Occupation invalide");
      occupied.add(key(c));
      if (
        i &&
        !(Object.keys(DELTAS) as Direction[]).some(
          (d) => key(step(a.cells[i - 1], d, level.gridSize).cell) === key(c),
        )
      )
        throw new Error("Corps discontinu");
    }
    const isolated = tryExtract(level, [a], a.id);
    if (!isolated.ok)
      throw new Error(`La sortie de ${a.id} traverse son propre corps`);
  }
  let remaining = [...level.arrows];
  for (const id of level.solution) {
    const result = tryExtract(level, remaining, id);
    if (!result.ok)
      throw new Error(`Certificat bloqué : ${id} par ${result.blocker}`);
    remaining = remaining.filter((a) => a.id !== id);
  }
  if (remaining.length) throw new Error("Certificat incomplet");
  return true;
}
