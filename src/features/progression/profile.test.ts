import { expect, it } from "vitest";
import {
  beginSession,
  chestReward,
  claimChest,
  completeLevel,
  continueSession,
  isUnlocked,
  medalsOf,
  newProfile,
  nextStarIn,
  readProfile,
  refreshEnergy,
  removeFromSession,
  STAR_INTERVAL,
} from "./profile";
import { DEMOS } from "../levels/demos";
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
  expect(claimed.erasers).toBe(p.erasers);
  expect(claimed.wands).toBe(p.wands);
  expect(claimChest(claimed, 5)).toBe(claimed);
  expect(claimChest(claimed, 10)).toBe(claimed);
  expect(claimChest(claimed, 6)).toBe(claimed);
});
it("les coffres ajoutent gommes (dès 10) et baguettes (dès 20) de façon progressive", () => {
  const lots = Array.from({ length: 20 }, (_, i) => chestReward((i + 1) * 5));
  expect(lots.map((l) => l.erasers)).toEqual([
    0, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5,
  ]);
  expect(lots.map((l) => l.wands)).toEqual([
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3,
  ]);
  let p = newProfile();
  for (let n = 1; n <= 20; n++) p = completeLevel(p, n, 60, 3);
  const claimed = claimChest(p, 20);
  expect(claimed.erasers - p.erasers).toBe(1);
  expect(claimed.wands - p.wands).toBe(1);
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

it("une étoile donne trois cœurs qui suivent le joueur ; la reprise ne coûte rien", () => {
  let p = newProfile(0);
  const start = beginSession(p, 0, false, 0);
  expect(start.reason).toBeNull();
  p = start.profile;
  expect(p.energy.stars).toBe(4);
  expect(p.session.lives).toBe(3);
  expect(beginSession(p, 0, false, 0).profile.energy.stars).toBe(4);
  // Recommencer avec des cœurs restants est gratuit et les conserve.
  p = { ...p, session: { ...p.session, lives: 2, removed: ["A"] } };
  const restart = beginSession(p, 0, true, 0).profile;
  expect(restart.energy.stars).toBe(4);
  expect(restart.session).toMatchObject({ lives: 2, removed: [], lost: 0 });
  // Niveau suivant : les cœurs restants sont reportés, sans débit.
  const won = {
    ...restart,
    testAccess: true,
    session: { ...restart.session, finished: true },
  };
  const next = beginSession(won, 1, false, 0).profile;
  expect(next.energy.stars).toBe(4);
  expect(next.session).toMatchObject({ index: 1, lives: 2, active: true });
  // Réserve de cœurs vide : une étoile est débitée et redonne trois cœurs.
  p = { ...next, session: { ...next.session, lives: 0 } };
  const paid = beginSession(p, 1, true, 0).profile;
  expect(paid.energy.stars).toBe(3);
  expect(paid.session.lives).toBe(3);
  const empty = { ...p, energy: { stars: 0, updatedAt: 0 } };
  expect(beginSession(empty, 1, true, 0).reason).toBe("energy");
  expect(beginSession(empty, 2, false, 0).reason).toBe("energy");
});
it("les médailles comptent les cœurs perdus sur le cube, pas les cœurs reportés", () => {
  let p = beginSession(
    {
      ...newProfile(0),
      session: { ...newProfile(0).session, active: true, lives: 1 },
    },
    0,
    true,
    0,
  ).profile;
  expect(p.session.lives).toBe(1);
  p = removeFromSession(
    p,
    DEMOS[0].arrows.map((a) => a.id),
    DEMOS[0].arrows.length,
  );
  expect(p.completed[1].stars).toBe(3);
  expect(medalsOf({ ...p.session, lost: 2 })).toBe(1);
  expect(medalsOf({ ...p.session, lost: undefined, lives: 2 })).toBe(2);
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
it("à zéro cœur, continuer coûte une étoile et conserve l’avancement du cube", () => {
  const p = {
    ...newProfile(0),
    coins: 100,
    session: {
      ...newProfile(0).session,
      active: true,
      lives: 0,
      removed: ["A"],
    },
  };
  const q = continueSession(p, 0);
  expect(q.energy.stars).toBe(4);
  expect(q.coins).toBe(100);
  expect(q.session.lives).toBe(3);
  expect(q.session.removed).toEqual(["A"]);
  expect(continueSession(q, 0)).toBe(q);
  const broke = { ...p, energy: { stars: 0, updatedAt: 0 } };
  expect(continueSession(broke, 0)).toBe(broke);
  expect(continueSession(broke, STAR_INTERVAL).energy.stars).toBe(0);
  expect(continueSession(broke, STAR_INTERVAL).session.lives).toBe(3);
});
