import { difficultyAt } from "./campaign-base";
/** Seuils de construction ; le ressenti reste à équilibrer par le jeu. */
export function progressionAt(number: number) {
  const difficulty = difficultyAt(number);
  const early = number <= 15;
  const veryHard = difficulty === "Très difficile",
    hard = difficulty === "Difficile";
  return {
    gridSize: early
      ? 10 + 2 * Math.floor((number - 4) / 4)
      : 24 + 2 * Math.floor((number - 16) / 30),
    perFace: early
      ? 10 + 4 * Math.floor((number - 4) / 4)
      : number === 16
        ? 70
        : number === 100
          ? 90
          : 61 + 2 * Math.floor((number - 16) / 10),
    bands: veryHard && number >= 30 ? 2 : 1,
    maxRoots: veryHard ? 4 : hard ? 6 : 10,
    minRoots: veryHard ? 2 : hard ? 3 : early ? 4 : 7,
    minDirections: early ? 1 : 3,
    minChain: early
      ? veryHard
        ? 16
        : hard
          ? 12
          : 8
      : veryHard
        ? 60
        : hard
          ? 40
          : 24,
    maxAvailable: early ? 16 : veryHard ? 12 : hard ? 16 : 22,
    minIrregular: early ? 0.8 : 0.9,
  };
}
