import { describe, expect, it } from "vitest";
import { DEMOS } from "../../levels/demos";
import {
  FACES,
  OPPOSITE,
  step,
  tryExtract,
  validateLevel,
  traceRoute,
  type Direction,
  type Level,
} from "./engine";

describe("Topologie du cube", () => {
  it("revient à la même cellule sur chaque arête, dans les deux sens, sans inverser la grille", () => {
    for (const face of FACES)
      for (const direction of ["east", "west", "north", "south"] as Direction[])
        for (let index = 0; index < 5; index++) {
          const cell = {
            face,
            x: direction === "east" ? 4 : direction === "west" ? 0 : index,
            y: direction === "north" ? 4 : direction === "south" ? 0 : index,
          };
          const next = step(cell, direction, 5);
          const back = step(next.cell, OPPOSITE[next.direction], 5);
          expect(next.crossed).toBe(true);
          expect(back.cell).toEqual(cell);
          expect(back.direction).toBe(OPPOSITE[direction]);
        }
    expect(step({ face: "front", x: 2, y: 1 }, "east", 3)).toEqual({
      cell: { face: "right", x: 0, y: 1 },
      direction: "east",
      crossed: true,
    });
    expect(step({ face: "front", x: 1, y: 2 }, "north", 3)).toEqual({
      cell: { face: "top", x: 1, y: 0 },
      direction: "north",
      crossed: true,
    });
  });
});
describe("Extraction et certificats", () => {
  it("rejette une pointe dirigée vers sa propre queue même si celle-ci pourrait se déplacer", () => {
    const arrow = {
      id: "self",
      direction: "east" as const,
      cells: [
        { face: "front" as const, x: 2, y: 1 },
        { face: "front" as const, x: 2, y: 0 },
        { face: "front" as const, x: 1, y: 0 },
        { face: "front" as const, x: 1, y: 1 },
      ],
    };
    const level: Level = {
      ...DEMOS[0],
      gridSize: 4,
      arrows: [arrow],
      solution: ["self"],
      edgeRules: [],
    };
    const result = tryExtract(level, level.arrows, "self");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.blocker).toBe("self");
      expect(result.cell).toEqual({ face: "front", x: 2, y: 1 });
    }
    expect(() => validateLevel(level)).toThrow();
  });
  it.each(DEMOS)("$id : le certificat vide les six faces", (level) =>
    expect(validateLevel(level)).toBe(true),
  );
  it.each([DEMOS[1], DEMOS[2]])(
    "$id : un corps éloigné bloque A, retirer B libère tout le passage",
    (level) => {
      const result = tryExtract(level, level.arrows, "A");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.blocker).toBe("B");
        expect(result.collisionIndex).toBe(level.id === "demo-2" ? 2 : 5);
        expect(result.route.steps[result.collisionIndex].cell).toEqual(
          result.cell,
        );
      }
      expect(
        tryExtract(
          level,
          level.arrows.filter((a) => a.id !== "B"),
          "A",
        ).ok,
      ).toBe(true);
      expect(traceRoute(level, level.arrows[0]).crossings).toBe(
        level.id === "demo-2" ? 1 : 2,
      );
    },
  );
  it("rejette les routes cycliques sur une ceinture fermée", () => {
    const level: Level = {
      ...DEMOS[0],
      edgeRules: ["front", "right", "back", "left"].map((face) => ({
        face: face as "front",
        direction: "east",
        index: 1,
        action: "continue",
      })),
    };
    expect(() => traceRoute(level, level.arrows[0])).toThrow("cyclique");
  });
  it("bloque sur le corps d’une flèche même si sa pointe est hors du passage", () => {
    const level = DEMOS[1];
    const blocked = tryExtract(level, level.arrows, "A");
    expect(blocked.ok).toBe(false);
    if (!blocked.ok)
      expect(blocked.cell).toEqual({ face: "right", x: 1, y: 1 });
  });
});
