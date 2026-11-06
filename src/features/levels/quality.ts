import {
  FACES,
  key,
  traceRoute,
  step,
  type Face,
  type Level,
  type Direction,
} from "../game/core/engine";

export function inspectBands(level: Level) {
  const edges = new Map<string, Map<string, Set<number>>>();
  for (const rule of level.edgeRules.filter((r) => r.action === "continue")) {
    const n = level.gridSize,
      d = rule.direction;
    const cell = {
      face: rule.face,
      x: d === "east" ? n - 1 : d === "west" ? 0 : rule.index,
      y: d === "north" ? n - 1 : d === "south" ? 0 : rule.index,
    };
    const other = step(cell, d, n).cell.face;
    const edge = [rule.face, other].sort().join("/"),
      side = `${rule.face}/${d}`;
    const sides = edges.get(edge) ?? new Map<string, Set<number>>(),
      indices = sides.get(side) ?? new Set<number>();
    indices.add(rule.index);
    sides.set(side, indices);
    edges.set(edge, sides);
  }
  return {
    count: edges.size,
    fullLength: [...edges.values()].every(
      (sides) =>
        sides.size === 2 &&
        [...sides.values()].every(
          (indices) =>
            indices.size === level.gridSize &&
            Array.from({ length: level.gridSize }, (_, i) => i).every((i) =>
              indices.has(i),
            ),
        ),
    ),
  };
}

export function inspectFootprints(level: Level) {
  const irregular = level.arrows.filter((a) => {
    if (new Set(a.cells.map((c) => c.face)).size > 1) return true;
    const xs = a.cells.map((c) => c.x),
      ys = a.cells.map((c) => c.y);
    return (
      (Math.max(...xs) - Math.min(...xs) + 1) *
        (Math.max(...ys) - Math.min(...ys) + 1) >
      a.cells.length
    );
  }).length;
  const lengths = level.arrows.map((a) => a.cells.length);
  return {
    irregular,
    ratio: irregular / level.arrows.length,
    minLength: Math.min(...lengths),
    maxLength: Math.max(...lengths),
  };
}

/** Mesures du graphe réel de blocages, indépendantes du certificat proposé. */
export function inspectDependencies(level: Level) {
  const owners = new Map(
    level.arrows.flatMap((a) => a.cells.map((c) => [key(c), a.id] as const)),
  );
  const byId = new Map(level.arrows.map((a) => [a.id, a]));
  const blockers = new Map<string, Set<string>>();
  const links = Object.fromEntries(
    FACES.map((f) => [f, new Set<Face>()]),
  ) as Record<Face, Set<Face>>;
  const directions = Object.fromEntries(
    FACES.map((f) => [f, { east: 0, west: 0, north: 0, south: 0 }]),
  ) as Record<Face, Record<Direction, number>>;
  for (const arrow of level.arrows) {
    const face = arrow.cells.at(-1)!.face;
    directions[face][arrow.direction]++;
    const dependencies = new Set<string>();
    for (const { cell } of traceRoute(level, arrow).steps) {
      const id = owners.get(key(cell));
      if (id && id !== arrow.id) {
        dependencies.add(id);
        const other = byId.get(id)!.cells.at(-1)!.face;
        if (other !== face) links[face].add(other);
      }
    }
    blockers.set(arrow.id, dependencies);
  }
  const isolatedRemainders = {} as Record<Face, number>;
  for (const face of FACES) {
    const remaining = new Set(byId.keys());
    const touching = level.arrows.filter((a) =>
      a.cells.some((c) => c.face === face),
    );
    let changed = true;
    while (changed) {
      changed = false;
      for (const arrow of touching)
        if (
          remaining.has(arrow.id) &&
          ![...blockers.get(arrow.id)!].some((id) => remaining.has(id))
        ) {
          remaining.delete(arrow.id);
          changed = true;
        }
    }
    isolatedRemainders[face] = touching.filter((a) =>
      remaining.has(a.id),
    ).length;
  }
  const stronglyConnected = FACES.every((start) => {
    const seen = new Set<Face>(),
      queue: Face[] = [start];
    while (queue.length) {
      const face = queue.pop()!;
      if (seen.has(face)) continue;
      seen.add(face);
      queue.push(...links[face]);
    }
    return seen.size === 6;
  });
  return {
    directions,
    isolatedRemainders,
    stronglyConnected,
    links: Object.fromEntries(FACES.map((f) => [f, [...links[f]]])),
  };
}

/** Raisonnement requis : choix initiaux, profondeur et déblocages effectifs. */
export function inspectReasoning(level: Level) {
  const owners = new Map(
    level.arrows.flatMap((a) => a.cells.map((c) => [key(c), a.id] as const)),
  );
  const byId = new Map(level.arrows.map((a) => [a.id, a]));
  const deps = new Map<string, Set<string>>(),
    followers = new Map<string, Set<string>>();
  for (const arrow of level.arrows) {
    const dependencies = new Set(
      traceRoute(level, arrow)
        .steps.map((s) => owners.get(key(s.cell)))
        .filter((id): id is string => !!id && id !== arrow.id),
    );
    deps.set(arrow.id, dependencies);
    for (const id of dependencies) {
      const list = followers.get(id) ?? new Set<string>();
      list.add(arrow.id);
      followers.set(id, list);
    }
  }
  const memo = new Map<string, string[]>(),
    visiting = new Set<string>();
  function chain(id: string): string[] {
    if (memo.has(id)) return memo.get(id)!;
    if (visiting.has(id)) throw Error("Cycle de dépendances");
    visiting.add(id);
    let path: string[] = [];
    for (const dependency of deps.get(id)!) {
      const candidate = chain(dependency);
      if (candidate.length > path.length) path = candidate;
    }
    visiting.delete(id);
    const value = [...path, id];
    memo.set(id, value);
    return value;
  }
  let longest: string[] = [];
  for (const id of byId.keys()) {
    const path = chain(id);
    if (path.length > longest.length) longest = path;
  }
  const pending = new Map([...deps].map(([id, set]) => [id, set.size]));
  const initialChoices = [...pending.values()].filter((n) => n === 0).length;
  let maxSimultaneousUnlocks = 0,
    crossFaceUnlocks = 0;
  let available = initialChoices,
    maxAvailable = available,
    maxAvailableFirstHalf = available,
    maxAvailableBeforeCleanup = available,
    zeroUnlockMoves = 0;
  let witness: { trigger: string; unlocked: string[] } | null = null;
  for (const [index, id] of level.solution.entries()) {
    if (pending.get(id)! > 0) throw Error(`Certificat bloqué : ${id}`);
    const unlocked: string[] = [];
    for (const child of followers.get(id) ?? []) {
      const n = pending.get(child)! - 1;
      pending.set(child, n);
      if (n === 0) unlocked.push(child);
    }
    if (unlocked.length > maxSimultaneousUnlocks) {
      maxSimultaneousUnlocks = unlocked.length;
      witness = { trigger: id, unlocked };
    }
    available += unlocked.length - 1;
    maxAvailable = Math.max(maxAvailable, available);
    if (index < level.arrows.length / 2)
      maxAvailableFirstHalf = Math.max(maxAvailableFirstHalf, available);
    if (index < level.arrows.length - 35)
      maxAvailableBeforeCleanup = Math.max(
        maxAvailableBeforeCleanup,
        available,
      );
    if (!unlocked.length) zeroUnlockMoves++;
    const face = byId.get(id)!.cells.at(-1)!.face;
    if (unlocked.some((child) => byId.get(child)!.cells.at(-1)!.face !== face))
      crossFaceUnlocks++;
  }
  return {
    initialChoices,
    longestChain: longest.length,
    chainFaces: [
      ...new Set(longest.map((id) => byId.get(id)!.cells.at(-1)!.face)),
    ],
    maxSimultaneousUnlocks,
    crossFaceUnlocks,
    witness,
    multiPrerequisiteArrows: [...deps.values()].filter((set) => set.size >= 2)
      .length,
    multiFacePrerequisites: [...deps.values()].filter(
      (set) =>
        new Set([...set].map((id) => byId.get(id)!.cells.at(-1)!.face)).size >=
        2,
    ).length,
    maxAvailable,
    maxAvailableFirstHalf,
    maxAvailableBeforeCleanup,
    zeroUnlockMoves,
  };
}
