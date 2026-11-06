import { expect, it } from "vitest";
import { DEMOS } from "../levels/demos";
import { tryExtract } from "./core/engine";
import { wandTargets } from "./powerups";
it("la baguette choisit trois sorties successivement légales et ignore les flèches déjà retirées", () => {
  const level = DEMOS[1],
    targets = wandTargets(level, [], 3);
  expect(targets).toHaveLength(3);
  let arrows = level.arrows;
  for (const id of targets) {
    expect(tryExtract(level, arrows, id).ok).toBe(true);
    arrows = arrows.filter((a) => a.id !== id);
  }
  expect(
    wandTargets(level, targets, 3).some((id) => targets.includes(id)),
  ).toBe(false);
});
