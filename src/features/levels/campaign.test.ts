import { progressionAt } from "./progression";
import { expect, it } from "vitest";
import { LEVELS, difficultyAt } from "./campaign";
import { validateLevel } from "../game/core/engine";
import { FACES } from "../game/core/engine";
import {
  inspectDependencies,
  inspectFootprints,
  inspectBands,
  inspectReasoning,
} from "./quality";
it.each(LEVELS)("$id : certificat, densité, interdépendance et progression", (level) => {
  expect(validateLevel(level)).toBe(true);
  expect(inspectBands(level).fullLength).toBe(true);
  if (Number(level.id.split("-")[1]) >= 16)
    expect(level.arrows.length).toBeGreaterThan(300);
  if (level.id === "level-18") {
    expect(level.arrows).toHaveLength(366);
    expect(level.arrows.reduce((s, a) => s + a.cells.length, 0)).toBe(
      6 * level.gridSize ** 2,
    );
    expect(
      level.arrows.filter((a) => new Set(a.cells.map((c) => c.face)).size > 1)
        .length,
    ).toBeGreaterThanOrEqual(10);
    expect(
      level.arrows.filter((a) => a.cells[0].face !== a.cells.at(-1)!.face)
        .length,
    ).toBeGreaterThanOrEqual(10);
  }
  const number = Number(level.id.split("-")[1]);
  if (number >= 4 && number !== 18) {
    const p = progressionAt(number),
      r = inspectReasoning(level),
      q = inspectDependencies(level);
    expect(level.arrows.reduce((sum, a) => sum + a.cells.length, 0)).toBe(
      6 * level.gridSize ** 2,
    );
    expect(inspectBands(level).count).toBe(p.bands);
    expect(inspectFootprints(level).ratio).toBeGreaterThanOrEqual(
      p.minIrregular,
    );
    expect(r.initialChoices).toBeGreaterThanOrEqual(p.minRoots);
    expect(r.initialChoices).toBeLessThanOrEqual(p.maxRoots);
    expect(r.longestChain).toBeGreaterThanOrEqual(p.minChain);
    expect(r.maxAvailable).toBeLessThanOrEqual(p.maxAvailable);
    expect(r.chainFaces.length).toBeGreaterThanOrEqual(number <= 15 ? 4 : 6);
    expect(r.multiPrerequisiteArrows).toBeGreaterThanOrEqual(
      level.arrows.length * (number <= 15 ? 0.3 : 0.6),
    );
    expect(r.multiFacePrerequisites).toBeGreaterThanOrEqual(
      level.arrows.length * 0.2,
    );
    expect(q.stronglyConnected).toBe(true);
    for (const face of FACES) {
      expect(q.isolatedRemainders[face]).toBeGreaterThan(0);
      for (const count of Object.values(q.directions[face]))
        expect(count).toBeGreaterThanOrEqual(p.minDirections);
    }
    expect(
      level.arrows.filter((a) => a.cells[0].face !== a.cells.at(-1)!.face)
        .length,
    ).toBeGreaterThanOrEqual(number <= 15 ? 3 : 10);
  }
});

it("les défis sont suivis de niveaux moyens, avec un défi supérieur toutes les dix étapes", () => {
  expect([4, 5, 6, 9, 10, 11].map(difficultyAt)).toEqual([
    "Moyen",
    "Difficile",
    "Moyen",
    "Moyen",
    "Très difficile",
    "Moyen",
  ]);
});

it("niveau 18 : quatre directions par face et impossibilité de vider une face en restant dessus", () => {
  const quality = inspectDependencies(LEVELS[17]);
  for (const face of FACES) {
    for (const count of Object.values(quality.directions[face]))
      expect(count, `direction absente sur ${face}`).toBeGreaterThanOrEqual(3);
    expect(
      quality.isolatedRemainders[face],
      `${face} peut être vidée sans débloquer ailleurs`,
    ).toBeGreaterThan(0);
  }
  expect(quality.stronglyConnected).toBe(true);
});

it("niveau 18 : chemins irréguliers imbriqués et longueurs variées", () => {
  const footprints = inspectFootprints(LEVELS[17]);
  expect(footprints.ratio).toBeGreaterThanOrEqual(0.9);
  expect(footprints.minLength).toBeLessThan(6);
  expect(footprints.maxLength).toBeGreaterThan(18);
});

it("niveau 18 : une seule arête jaune entière, sans fragments sur les autres", () => {
  const bands = inspectBands(LEVELS[17]);
  expect(bands.count).toBe(1);
  expect(bands.fullLength).toBe(true);
});

it("niveau 18 : verrous experts, peu de sorties et longue chaîne entre les six faces", () => {
  const reasoning = inspectReasoning(LEVELS[17]);
  expect(reasoning.initialChoices).toBeGreaterThanOrEqual(2);
  expect(reasoning.initialChoices).toBeLessThanOrEqual(4);
  expect(reasoning.longestChain).toBeGreaterThanOrEqual(60);
  expect(reasoning.chainFaces.length).toBe(6);
  expect(reasoning.maxSimultaneousUnlocks).toBeLessThanOrEqual(4);
  expect(reasoning.maxAvailable).toBeLessThanOrEqual(8);
  expect(reasoning.multiPrerequisiteArrows).toBeGreaterThanOrEqual(280);
  expect(reasoning.multiFacePrerequisites).toBeGreaterThanOrEqual(130);
  expect(reasoning.crossFaceUnlocks).toBeGreaterThanOrEqual(10);
});
