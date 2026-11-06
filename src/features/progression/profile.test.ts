import { expect, it } from "vitest";
import {
  beginSession,
  claimChest,
  completeLevel,
  continueSession,
  isUnlocked,
  newProfile,
  nextStarIn,
  readProfile,
  refreshEnergy,
  STAR_INTERVAL,
} from "./profile";
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
    expect(readProfile(raw)).toMatchObject({
      version: 2,
      coins: 0,
      hints: 3,
      energy: { stars: 5 },
      session: { index: 0, lives: 3 },
    });
});

it("une étoile est débitée à chaque nouvelle partie, jamais à la reprise", () => {
  let p = newProfile(0);
  const start = beginSession(p, 0, false, 0);
  expect(start.reason).toBeNull();
  p = start.profile;
  expect(p.energy.stars).toBe(4);
  expect(p.session.lives).toBe(3);
  expect(beginSession(p, 0, false, 0).profile.energy.stars).toBe(4);
  for (let i = 0; i < 4; i++) p = beginSession(p, 0, true, 0).profile;
  expect(p.energy.stars).toBe(0);
  expect(beginSession(p, 0, true, 0).reason).toBe("energy");
  expect(beginSession(p, 0, false, 0).reason).toBeNull();
});
it("la recharge reprend hors ligne, conserve la fraction et plafonne à cinq", () => {
  const p = { ...newProfile(0), energy: { stars: 2, updatedAt: 0 } };
  const q = refreshEnergy(p, STAR_INTERVAL * 2.5);
  expect(q.energy).toEqual({ stars: 4, updatedAt: STAR_INTERVAL * 2 });
  expect(nextStarIn(q, STAR_INTERVAL * 2.5)).toBe(STAR_INTERVAL / 2);
  const started = beginSession(q, 0, false, STAR_INTERVAL * 2.5).profile;
  expect(started.energy.stars).toBe(3);
  expect(nextStarIn(started, STAR_INTERVAL * 2.5)).toBe(STAR_INTERVAL / 2);
  expect(refreshEnergy(p, STAR_INTERVAL * 10).energy.stars).toBe(5);
  expect(refreshEnergy(q, 0)).toBe(q);
});
it("le chemin verrouille le prochain cube sauf accès test et respecte la progression contiguë", () => {
  const p = newProfile(0);
  expect(beginSession(p, 1, false, 0).reason).toBe("locked");
  expect(isUnlocked(completeLevel(p, 3, 60, 3), 1)).toBe(false);
  expect(isUnlocked(completeLevel(p, 1, 60, 3), 1)).toBe(true);
  expect(
    beginSession({ ...p, testAccess: true }, 99, false, 0).profile.energy.stars,
  ).toBe(4);
});
it("la sauvegarde v1 conserve la partie et les gains sans facturer sa reprise", () => {
  const old = {
    version: 1,
    coins: 123,
    hints: 7,
    completed: { 1: { score: 60, stars: 2 } },
    claimed: [],
    session: {
      index: 17,
      removed: ["r1"],
      blocked: ["r3"],
      lives: 2,
      hint: null,
    },
  };
  const p = readProfile(JSON.stringify(old));
  expect(p.version).toBe(2);
  expect(p.coins).toBe(123);
  expect(p.completed).toEqual(old.completed);
  expect(p.session.active).toBe(true);
  expect(beginSession(p, 17).profile.energy.stars).toBe(5);
});
it("la continuation attend un tarif ; un tarif défini restaure les cœurs sans remettre le cube à zéro", () => {
  const p = {
    ...newProfile(),
    coins: 100,
    session: {
      ...newProfile().session,
      active: true,
      lives: 0,
      removed: ["A"],
    },
  };
  expect(continueSession(p)).toBe(p);
  const q = continueSession(p, 50);
  expect(q.coins).toBe(50);
  expect(q.session.lives).toBe(3);
  expect(q.session.removed).toEqual(["A"]);
  expect(q.energy).toEqual(p.energy);
  expect(continueSession(q, 50)).toBe(q);
});
