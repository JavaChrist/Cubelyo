import { tryExtract, type Level } from "./core/engine";
export function wandTargets(level: Level, removed: string[], limit = 3) {
  let remaining = level.arrows.filter((a) => !removed.includes(a.id));
  const ids: string[] = [];
  for (let i = 0; i < limit; i++) {
    const arrow = remaining.find((a) => tryExtract(level, remaining, a.id).ok);
    if (!arrow) break;
    ids.push(arrow.id);
    remaining = remaining.filter((a) => a.id !== arrow.id);
  }
  return ids;
}
