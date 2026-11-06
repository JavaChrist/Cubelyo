import { type Level } from "../game/core/engine";
import { DEMOS } from "./demos";
import { GENERATED_CAMPAIGN } from "./generated-campaign";
export { difficultyAt } from "./campaign-base";
export const LEVELS: Level[] = [
  ...DEMOS.map((level, i) => ({ ...level, id: `level-${i + 1}` })),
  ...GENERATED_CAMPAIGN,
];
