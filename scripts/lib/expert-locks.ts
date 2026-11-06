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
  type Route,
} from "../../src/features/game/core/engine";
type Candidate = { arrow: Arrow; route: Route; deps: Set<string> };
/** Recompose les verrous et l'ordre de résolution, en autorisant les déplacements
 * de branches qui auraient été refusés par le certificat précédent. */
export function buildExpertLocks(
  level: Level,
  random: () => number,
  options: {
    maxRoots?: number;
    minDirections?: number;
    attempts?: number;
  } = {},
) {
  const maxRoots = options.maxRoots ?? 4;
  const minDirections = options.minDirections ?? 3;
  const dirs: Direction[] = ["east", "west", "north", "south"];
  const arrows = new Map(level.arrows.map((a) => [a.id, a])),
    ids = [...arrows.keys()];
  const owners = new Map(
    level.arrows.flatMap((a) => a.cells.map((c) => [key(c), a.id] as const)),
  );
  const routes = new Map<string, Route>(),
    deps = new Map<string, Set<string>>(),
    users = new Map<string, Set<string>>();
  const counts = Object.fromEntries(
    FACES.map((f) => [f, { east: 0, west: 0, north: 0, south: 0 }]),
  ) as Record<string, Record<Direction, number>>;
  function dependencies(
    route: Route,
    id: string,
    changes?: Map<string, string>,
  ) {
    return new Set(
      route.steps
        .map((s) => changes?.get(key(s.cell)) ?? owners.get(key(s.cell)))
        .filter((other): other is string => !!other && other !== id),
    );
  }
  function register(arrow: Arrow) {
    const route = traceRoute(level, arrow);
    routes.set(arrow.id, route);
    deps.set(arrow.id, dependencies(route, arrow.id));
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
  const rootIds = () => ids.filter((id) => deps.get(id)!.size === 0);
  const irregular = (cells: Cell[]) =>
    new Set(cells.map((c) => c.face)).size > 1 ||
    (Math.max(...cells.map((c) => c.x)) -
      Math.min(...cells.map((c) => c.x)) +
      1) *
      (Math.max(...cells.map((c) => c.y)) -
        Math.min(...cells.map((c) => c.y)) +
        1) >
      cells.length;
  function candidates(
    id: string,
    path: Cell[],
    changes: Map<string, string>,
  ): Candidate[] {
    let cells = [...path];
    const output: Candidate[] = [],
      seen = new Set<string>();
    for (let i = 0; i < 14; i++) {
      if (i % 2) cells = [...cells].reverse();
      if (i >= 2) {
        const neighbor = step(
            cells[0],
            dirs[Math.floor(random() * 4)],
            level.gridSize,
          ).cell,
          index = cells.findIndex((c) => key(c) === key(neighbor));
        if (index >= 2)
          cells = [...cells.slice(0, index).reverse(), ...cells.slice(index)];
      }
      const signature = cells.map(key).join("|");
      if (seen.has(signature)) continue;
      seen.add(signature);
      const head = cells.at(-1)!,
        previous = cells.at(-2)!;
      const backward = dirs.find(
        (d) => key(step(head, d, level.gridSize).cell) === key(previous),
      );
      if (!backward) throw Error("Chemin expert discontinu");
      const arrow: Arrow = {
        id,
        cells: [...cells],
        direction: OPPOSITE[backward],
      };
      try {
        const result = tryExtract(level, [arrow], id);
        if (!result.ok) continue;
        const blockers = dependencies(result.route, id, changes);
        if (deps.get(id)!.size > 0 && blockers.size === 0) continue;
        output.push({ arrow, route: result.route, deps: blockers });
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes("cyclique"))
          throw error;
      }
    }
    return output;
  }
  function solve(patch: Map<string, Set<string>>): string[] | null {
    const pending = new Map<string, number>(),
      followers = new Map<string, string[]>();
    for (const id of ids) {
      const set = patch.get(id) ?? deps.get(id)!;
      pending.set(id, set.size);
      for (const blocker of set) {
        const list = followers.get(blocker) ?? [];
        list.push(id);
        followers.set(blocker, list);
      }
    }
    const queue = ids.filter((id) => pending.get(id) === 0),
      order: string[] = [];
    while (queue.length) {
      const id = queue.pop()!;
      order.push(id);
      for (const child of followers.get(id) ?? []) {
        const n = pending.get(child)! - 1;
        pending.set(child, n);
        if (!n) queue.push(child);
      }
    }
    return order.length === ids.length ? order : null;
  }
  let accepted = 0,
    roots = rootIds();
  for (
    let attempt = 0;
    attempt < (options.attempts ?? 160000) && roots.length > maxRoots;
    attempt++
  ) {
    const pool = random() < 0.9 ? roots : ids,
      aId = pool[Math.floor(random() * pool.length)];
    const oldA = arrows.get(aId)!,
      pathA = random() < 0.5 ? [...oldA.cells].reverse() : oldA.cells;
    const neighbor = step(
        pathA.at(-1)!,
        dirs[Math.floor(random() * 4)],
        level.gridSize,
      ).cell,
      bId = owners.get(key(neighbor));
    if (!bId || bId === aId) continue;
    const oldB = arrows.get(bId)!,
      index = oldB.cells.findIndex((c) => key(c) === key(neighbor)),
      prefix = random() < 0.5;
    const transfer = prefix
        ? oldB.cells.slice(0, index + 1).reverse()
        : oldB.cells.slice(index),
      pathB = prefix ? oldB.cells.slice(index + 1) : oldB.cells.slice(0, index),
      nextA = [...pathA, ...transfer];
    if (pathB.length < 4 || nextA.length > 42) continue;
    if (
      Number(irregular(nextA)) + Number(irregular(pathB)) <
        Number(irregular(oldA.cells)) + Number(irregular(oldB.cells)) &&
      random() < 0.98
    )
      continue;
    const changes = new Map([
      ...nextA.map((c) => [key(c), aId] as const),
      ...pathB.map((c) => [key(c), bId] as const),
    ]);
    const patch = new Map<string, Set<string>>();
    for (const cell of changes.keys())
      for (const user of users.get(cell) ?? [])
        if (user !== aId && user !== bId)
          patch.set(user, dependencies(routes.get(user)!, user, changes));
    const choicesA = candidates(aId, nextA, changes),
      choicesB = candidates(bId, pathB, changes);
    const oldRoots =
      Number(!deps.get(aId)!.size) + Number(!deps.get(bId)!.size);
    const combos = choicesA
      .flatMap((a) =>
        choicesB.map((b) => ({
          a,
          b,
          roots: Number(!a.deps.size) + Number(!b.deps.size),
          r: random(),
        })),
      )
      .filter((c) => c.roots <= oldRoots)
      .sort((a, b) => a.roots - b.roots || a.r - b.r);
    let chosen: (typeof combos)[number] | undefined,
      certificate: string[] | null = null;
    for (const combo of combos) {
      if (combo.roots === oldRoots && random() > 0.06) continue;
      const countsCopy = Object.fromEntries(
        FACES.map((f) => [f, { ...counts[f] }]),
      );
      for (const a of [oldA, oldB])
        countsCopy[a.cells.at(-1)!.face][a.direction]--;
      for (const a of [combo.a.arrow, combo.b.arrow])
        countsCopy[a.cells.at(-1)!.face][a.direction]++;
      if (
        Object.values(countsCopy).some((c) =>
          Object.values(c).some((n) => n < minDirections),
        )
      )
        continue;
      patch.set(aId, combo.a.deps);
      patch.set(bId, combo.b.deps);
      certificate = solve(patch);
      if (certificate) {
        chosen = combo;
        break;
      }
    }
    if (!chosen || !certificate) continue;
    unregister(oldA);
    unregister(oldB);
    for (const [cell, owner] of changes) owners.set(cell, owner);
    for (const [id, set] of patch) deps.set(id, set);
    arrows.set(aId, chosen.a.arrow);
    arrows.set(bId, chosen.b.arrow);
    register(chosen.a.arrow);
    register(chosen.b.arrow);
    level.solution = certificate;
    accepted++;
    roots = rootIds();
    if (accepted % 100 === 0)
      console.log(
        `Verrous : ${roots.length} sorties, ${accepted} modifications`,
      );
  }
  // Rejouer en préparant les verrous avant de terminer leurs derniers prérequis.
  const pending = new Map(ids.map((id) => [id, deps.get(id)!.size])),
    followers = new Map<string, string[]>();
  for (const id of ids)
    for (const blocker of deps.get(id)!) {
      const list = followers.get(blocker) ?? [];
      list.push(id);
      followers.set(blocker, list);
    }
  const queue = ids.filter((id) => pending.get(id) === 0),
    certificate: string[] = [];
  let lastFace: string | null = null;
  while (queue.length) {
    let best = 0,
      bestScore = Infinity;
    for (let i = 0; i < queue.length; i++) {
      const id = queue[i],
        children = followers.get(id) ?? [];
      const opens = children.filter((child) => pending.get(child) === 1).length;
      const score =
        opens * 1000 -
        (children.length - opens) * 10 +
        (arrows.get(id)!.cells.at(-1)!.face === lastFace ? 2 : 0);
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }
    const [id] = queue.splice(best, 1);
    certificate.push(id);
    lastFace = arrows.get(id)!.cells.at(-1)!.face;
    for (const child of followers.get(id) ?? []) {
      const n = pending.get(child)! - 1;
      pending.set(child, n);
      if (!n) queue.push(child);
    }
  }
  if (certificate.length !== ids.length)
    throw Error("Verrous experts cycliques");
  level.solution = certificate;
  level.arrows = ids.map((id) => arrows.get(id)!);
  return {
    ok: roots.length >= 2 && roots.length <= maxRoots,
    placed: level.arrows.length,
    roots: roots.length,
    accepted,
  };
}
