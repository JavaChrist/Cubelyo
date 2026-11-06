import {
  type Arrow,
  type Cell,
  type EdgeRule,
  type Level,
} from "../game/core/engine";
import { DEMOS } from "./demos";
export type Difficulty =
  "Découverte" | "Moyen" | "Difficile" | "Très difficile";
export function difficultyAt(number: number): Difficulty {
  if (number <= 3) return "Découverte";
  if (number === 18 || number % 10 === 0) return "Très difficile";
  if (number % 5 === 0) return "Difficile";
  return "Moyen";
}
/** Générateur version 2 : chemins orthogonaux disjoints, puis certificat aval -> amont. */
export function makeBaseLevel(number: number): Level {
  if (number <= 3) return { ...DEMOS[number - 1], id: `level-${number}` };
  const difficulty = difficultyAt(number);
  const n =
    number <= 15
      ? 6 + 2 * Math.floor((number - 4) / 3)
      : 24 + 2 * Math.floor((number - 16) / 30);
  let seed = number * 104729;
  const random = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
  const arrows: Arrow[] = [],
    solution: string[] = [],
    edgeRules: EdgeRule[] = [];
  const crossings =
    difficulty === "Très difficile"
      ? number >= 30
        ? 3
        : 2
      : difficulty === "Difficile"
        ? 1
        : 0;
  for (let index = 0; index < n; index++) {
    if (crossings)
      edgeRules.push(
        { face: "front", direction: "east", index, action: "continue" },
        { face: "right", direction: "west", index, action: "continue" },
      );
    if (crossings >= 2)
      edgeRules.push(
        { face: "right", direction: "east", index, action: "continue" },
        { face: "back", direction: "west", index, action: "continue" },
      );
    if (crossings === 3)
      edgeRules.push(
        { face: "back", direction: "east", index, action: "continue" },
        { face: "left", direction: "west", index, action: "continue" },
      );
  }
  const faceOrder =
    crossings === 3
      ? (["left", "back", "right", "front", "top", "bottom"] as const)
      : (["back", "right", "front", "left", "top", "bottom"] as const);
  for (const face of faceOrder) {
    const rotate = ["left", "top", "bottom"].includes(face) && number % 2 === 0;
    for (let y = 0; y < n - 1; y += 2) {
      const left: string[] = [],
        right: string[] = [];
      for (let x = 0; x < n - 1;) {
        const width = Math.min(n - x, 2 + Math.floor(random() * 4));
        const west =
          crossings && ["front", "right", "back"].includes(face)
            ? false
            : x < n / 2;
        const shape = Math.floor(random() * 4),
          span = width - 1;
        let cells: Cell[] = [];
        if (shape === 0) {
          for (let j = 0; j <= span; j++) cells.push({ face, x: x + j, y });
        } else if (shape === 1) {
          cells = [
            { face, x, y: y + 1 },
            { face, x, y },
          ];
          for (let j = 1; j <= span; j++) cells.push({ face, x: x + j, y });
        } else if (shape === 2) {
          for (let j = span; j >= 0; j--)
            cells.push({ face, x: x + j, y: y + 1 });
          for (let j = 0; j <= span; j++) cells.push({ face, x: x + j, y });
        } else {
          const turn = Math.max(0, span - 1);
          for (let j = 0; j <= turn; j++)
            cells.push({ face, x: x + j, y: y + 1 });
          for (let j = turn; j <= span; j++) cells.push({ face, x: x + j, y });
        }
        if (west) cells = cells.map((c) => ({ ...c, x: x + span - (c.x - x) }));
        if (rotate)
          cells = cells.map((c) => ({ ...c, x: c.y, y: n - 1 - c.x }));
        const id = `${face}-${x}-${y}`;
        arrows.push({
          id,
          cells,
          direction: rotate
            ? west
              ? "north"
              : "south"
            : west
              ? "west"
              : "east",
        });
        (west ? left : right).push(id);
        x += width;
      }
      solution.push(...left, ...right.reverse());
    }
  }
  return {
    id: `level-${number}`,
    version: 1,
    title: `Niveau ${number}`,
    description: `${difficulty} · ${arrows.length} flèches. Pincez pour zoomer, glissez pour tourner.`,
    gridSize: n,
    arrows,
    edgeRules,
    solution,
  };
}
