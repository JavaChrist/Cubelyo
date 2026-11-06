import {
  type Arrow,
  type EdgeRule,
  type Face,
  type Level,
  step,
  OPPOSITE,
} from "../game/core/engine";
const line = (id: string, face: Face, y = 0): Arrow => ({
  id,
  cells: [
    { face, x: 0, y },
    { face, x: 1, y },
  ],
  direction: "east",
});
function continuation(face: Face): EdgeRule[] {
  return Array.from({ length: 3 }, (_, index): EdgeRule[] => {
    const next = step({ face, x: 2, y: index }, "east", 3);
    return [
      { face, direction: "east", index, action: "continue" },
      {
        face: next.cell.face,
        direction: OPPOSITE[next.direction],
        index: next.cell.y,
        action: "continue",
      },
    ];
  }).flat();
}
export const DEMOS: Level[] = [
  {
    id: "demo-1",
    version: 1,
    title: "Le premier passage",
    description:
      "Touchez les flèches pour les libérer. Faites glisser le cube pour explorer ses six faces.",
    gridSize: 3,
    arrows: ["front", "right", "back", "left", "top", "bottom"].map((f, i) =>
      line(String.fromCharCode(65 + i), f as Face, 1),
    ),
    edgeRules: [],
    solution: ["A", "B", "C", "D", "E", "F"],
  },
  {
    id: "demo-2",
    version: 1,
    title: "Derrière l’arête",
    description:
      "La bande dorée prolonge le trajet sur la face voisine. Libérez B avant de toucher A.",
    gridSize: 3,
    arrows: [
      line("A", "front", 1),
      {
        id: "B",
        cells: [
          { face: "right", x: 1, y: 1 },
          { face: "right", x: 1, y: 2 },
        ],
        direction: "north",
      },
      line("C", "back"),
      line("D", "left"),
      line("E", "top"),
      line("F", "bottom"),
    ],
    edgeRules: continuation("front"),
    solution: ["B", "A", "C", "D", "E", "F"],
  },
  {
    id: "demo-3",
    version: 1,
    title: "Plus loin que le regard",
    description:
      "A traverse deux arêtes. B, sur la troisième face, bloque toute la sortie : tournez le cube pour le trouver.",
    gridSize: 3,
    arrows: [
      line("A", "front", 1),
      {
        id: "B",
        cells: [
          { face: "back", x: 1, y: 1 },
          { face: "back", x: 1, y: 2 },
        ],
        direction: "north",
      },
      line("C", "right"),
      line("D", "left"),
      line("E", "top"),
      line("F", "bottom"),
    ],
    edgeRules: [...continuation("front"), ...continuation("right")],
    solution: ["B", "A", "C", "D", "E", "F"],
  },
];
