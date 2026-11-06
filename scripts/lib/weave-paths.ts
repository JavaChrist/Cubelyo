import {
  FACES,
  OPPOSITE,
  key,
  step,
  traceRoute,
  tryExtract,
  type Arrow,
  type Cell,
  type Direction,
  type Level,
} from "../../src/features/game/core/engine";

/** Répartit des branches entre chemins voisins sans déplacer les cellules du plateau.
 * Chaque modification conserve le certificat : aucune nouvelle dépendance ne peut
 * viser une flèche supprimée plus tard dans cet ordre. */
export function weavePaths(level: Level, random: () => number) {
  const dirs: Direction[] = ["east", "west", "north", "south"];
  const rectangular = (cells: Cell[]) => {
    if (new Set(cells.map((c) => c.face)).size > 1) return false;
    const xs = cells.map((c) => c.x),
      ys = cells.map((c) => c.y);
    return (
      (Math.max(...xs) - Math.min(...xs) + 1) *
        (Math.max(...ys) - Math.min(...ys) + 1) ===
      cells.length
    );
  };
  const arrows = new Map(level.arrows.map((a) => [a.id, a]));
  const rank = new Map(level.solution.map((id, i) => [id, i]));
  const owners = new Map(
    level.arrows.flatMap((a) => a.cells.map((c) => [key(c), a.id] as const)),
  );
  const users = new Map<string, Set<string>>(),
    routes = new Map<string, ReturnType<typeof traceRoute>>();
  const counts = Object.fromEntries(
    FACES.map((f) => [f, { east: 0, west: 0, north: 0, south: 0 }]),
  ) as Record<string, Record<Direction, number>>;
  function register(arrow: Arrow) {
    const route = traceRoute(level, arrow);
    routes.set(arrow.id, route);
    for (const { cell } of route.steps) {
      const k = key(cell),
        set = users.get(k) ?? new Set<string>();
      set.add(arrow.id);
      users.set(k, set);
    }
    counts[arrow.cells.at(-1)!.face][arrow.direction]++;
  }
  function unregister(arrow: Arrow) {
    for (const { cell } of routes.get(arrow.id)!.steps)
      users.get(key(cell))?.delete(arrow.id);
    counts[arrow.cells.at(-1)!.face][arrow.direction]--;
  }
  for (const arrow of arrows.values()) register(arrow);
  const floors = Object.fromEntries(
    FACES.map((f) => [
      f,
      Object.fromEntries(dirs.map((d) => [d, Math.min(4, counts[f][d])])),
    ]),
  ) as Record<string, Record<Direction, number>>;
  function variants(
    id: string,
    cells: Cell[],
    changed: Map<string, string>,
  ): Arrow[] {
    const output: Arrow[] = [],
      seen = new Set<string>();
    let state = [...cells];
    for (let iteration = 0; iteration < 10; iteration++) {
      if (iteration % 2 === 1) state = [...state].reverse();
      if (iteration >= 2) {
        const endpoint = state[0],
          adjacent = step(
            endpoint,
            dirs[Math.floor(random() * 4)],
            level.gridSize,
          ).cell;
        const index = state.findIndex((c) => key(c) === key(adjacent));
        if (index >= 2)
          state = [...state.slice(0, index).reverse(), ...state.slice(index)];
      }
      const signature = state.map(key).join("|");
      if (seen.has(signature)) continue;
      seen.add(signature);
      const head = state.at(-1)!,
        previous = state.at(-2)!;
      const backward = dirs.find(
        (d) => key(step(head, d, level.gridSize).cell) === key(previous),
      );
      if (!backward) throw Error("Branche discontinue");
      const arrow: Arrow = {
        id,
        cells: [...state],
        direction: OPPOSITE[backward],
      };
      try {
        const route = traceRoute(level, arrow);
        // Une retouche graphique ne doit pas transformer un coup bloqué en sortie gratuite.
        if (route.steps.length === 0 && routes.get(id)!.steps.length > 0)
          continue;
        if (
          route.steps.some(({ cell }) => {
            const owner = changed.get(key(cell)) ?? owners.get(key(cell));
            return owner && owner !== id && rank.get(owner)! >= rank.get(id)!;
          })
        )
          continue;
        if (tryExtract(level, [arrow], id).ok) output.push(arrow);
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes("cyclique"))
          throw error;
      }
    }
    return output;
  }
  const ids = [...arrows.keys()];
  let accepted = 0;
  for (let attempt = 0; attempt < 120000 && accepted < 3500; attempt++) {
    const idA = ids[Math.floor(random() * ids.length)],
      oldA = arrows.get(idA)!;
    const pathA = random() < 0.5 ? [...oldA.cells].reverse() : oldA.cells;
    const neighbor = step(
      pathA.at(-1)!,
      dirs[Math.floor(random() * 4)],
      level.gridSize,
    ).cell;
    const idB = owners.get(key(neighbor));
    if (!idB || idB === idA) continue;
    const oldB = arrows.get(idB)!,
      j = oldB.cells.findIndex((c) => key(c) === key(neighbor));
    const prefix = random() < 0.5;
    const transfer = prefix
      ? oldB.cells.slice(0, j + 1).reverse()
      : oldB.cells.slice(j);
    const nextB = prefix ? oldB.cells.slice(j + 1) : oldB.cells.slice(0, j);
    const nextA = [...pathA, ...transfer];
    if (nextB.length < 4 || nextA.length > 28) continue;
    // Éviter de recréer des petites boîtes pleines pendant le brassage.
    if (
      Number(rectangular(nextA)) + Number(rectangular(nextB)) >
        Number(rectangular(oldA.cells)) + Number(rectangular(oldB.cells)) &&
      random() < 0.96
    )
      continue;
    const changed = new Map([
      ...nextA.map((c) => [key(c), idA] as const),
      ...nextB.map((c) => [key(c), idB] as const),
    ]);
    let legal = true;
    for (const [cell, owner] of changed) {
      if (owners.get(cell) === owner) continue;
      for (const user of users.get(cell) ?? []) {
        if (
          user !== idA &&
          user !== idB &&
          rank.get(user)! <= rank.get(owner)!
        ) {
          legal = false;
          break;
        }
      }
      if (!legal) break;
    }
    if (!legal) continue;
    const choicesA = variants(idA, nextA, changed),
      choicesB = variants(idB, nextB, changed);
    let chosen: [Arrow, Arrow] | null = null,
      score = -Infinity;
    unregister(oldA);
    unregister(oldB);
    for (const a of choicesA)
      for (const b of choicesB) {
        const ca = counts[a.cells.at(-1)!.face],
          cb = counts[b.cells.at(-1)!.face];
        ca[a.direction]++;
        cb[b.direction]++;
        if (
          FACES.every((f) => dirs.every((d) => counts[f][d] >= floors[f][d]))
        ) {
          const value = 20 / ca[a.direction] + 20 / cb[b.direction] + random();
          if (value > score) {
            score = value;
            chosen = [a, b];
          }
        }
        ca[a.direction]--;
        cb[b.direction]--;
      }
    if (!chosen) {
      register(oldA);
      register(oldB);
      continue;
    }
    for (const [cell, owner] of changed) owners.set(cell, owner);
    arrows.set(idA, chosen[0]);
    arrows.set(idB, chosen[1]);
    register(chosen[0]);
    register(chosen[1]);
    accepted++;
  }
  level.arrows = ids.map((id) => arrows.get(id)!);
  return accepted;
}
