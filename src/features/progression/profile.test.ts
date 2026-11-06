import { expect, it } from "vitest";
import { claimChest, completeLevel, newProfile, readProfile } from "./profile";
it("une victoire crédite une fois et un replay améliore seulement les records", () => {
  const first = completeLevel(newProfile(), 1, 60, 1);
  const replay = completeLevel(first, 1, 80, 3);
  expect(first.coins).toBe(20);
  expect(replay.coins).toBe(20);
  expect(replay.completed[1]).toEqual({ score: 80, stars: 3 });
  expect(completeLevel(replay, 1, 20, 1).completed[1]).toEqual({
    score: 80,
    stars: 3,
  });
});
it("un coffre exige cinq victoires distinctes et ne peut être crédité deux fois", () => {
  let p = newProfile();
  for (let n = 1; n <= 4; n++) p = completeLevel(p, n, 60, 3);
  expect(claimChest(p, 5)).toBe(p);
  p = completeLevel(p, 5, 60, 3);
  const claimed = claimChest(p, 5);
  expect(claimed.coins - p.coins).toBe(60);
  expect(claimed.hints - p.hints).toBe(1);
  expect(claimChest(claimed, 5)).toBe(claimed);
  expect(claimChest(claimed, 10)).toBe(claimed);
  expect(claimChest(claimed, 6)).toBe(claimed);
});
it("la sauvegarde reprend la partie et les lots réclamés, les données invalides sont rejetées", () => {
  const p = newProfile();
  p.session = {
    index: 17,
    removed: ["r1"],
    blocked: ["r5"],
    hint: "r8",
    lives: 2,
  };
  p.claimed = [5];
  expect(readProfile(JSON.stringify(p))).toEqual(p);
  for (const raw of [
    "{",
    JSON.stringify({ ...p, coins: -1 }),
    JSON.stringify({ ...p, session: { ...p.session, lives: 4 } }),
  ])
    expect(readProfile(raw)).toEqual(newProfile());
});
