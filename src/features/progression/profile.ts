export const SAVE_KEY = "cubelyo.profile.v1";
export const MAX_LIVES = 3;
export const POINTS_PER_ARROW = 10;
export type Session = {
  index: number;
  removed: string[];
  blocked: string[];
  lives: number;
  hint: string | null;
  reward?: number;
};
export type Profile = {
  version: 1;
  coins: number;
  hints: number;
  completed: Record<string, { score: number; stars: number }>;
  claimed: number[];
  session: Session;
};
export function newSession(index = 0): Session {
  return { index, removed: [], blocked: [], lives: MAX_LIVES, hint: null };
}
export function newProfile(): Profile {
  return {
    version: 1,
    coins: 0,
    hints: 3,
    completed: {},
    claimed: [],
    session: newSession(),
  };
}
export function levelReward(number: number) {
  return 20 + 2 * (number - 1);
}
export function chestReward(floor: number) {
  const early: Record<number, [number, number]> = {
    5: [60, 1],
    10: [120, 2],
    15: [200, 3],
    20: [300, 4],
    25: [450, 5],
    30: [650, 6],
  };
  const [coins, hints] = early[floor] ?? [
    650 + (floor - 30) * 20,
    6 + Math.floor((floor - 30) / 10),
  ];
  return { coins, hints };
}
export function completeLevel(
  profile: Profile,
  number: number,
  score: number,
  stars: number,
): Profile {
  const old = profile.completed[number];
  return {
    ...profile,
    coins: profile.coins + (old ? 0 : levelReward(number)),
    completed: {
      ...profile.completed,
      [number]: {
        score: Math.max(old?.score ?? 0, score),
        stars: Math.max(old?.stars ?? 0, stars),
      },
    },
  };
}
export function claimChest(profile: Profile, floor: number): Profile {
  if (
    floor < 5 ||
    floor > 100 ||
    floor % 5 ||
    Object.keys(profile.completed).length < floor ||
    profile.claimed.includes(floor)
  )
    return profile;
  const reward = chestReward(floor);
  return {
    ...profile,
    coins: profile.coins + reward.coins,
    hints: profile.hints + reward.hints,
    claimed: [...profile.claimed, floor],
  };
}
export function readProfile(raw: string | null): Profile {
  try {
    const p = JSON.parse(raw ?? "null") as Profile;
    const integer = (n: unknown, max = 1e9) =>
      typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= max;
    const ids = (v: unknown): v is string[] =>
      Array.isArray(v) && v.every((s) => typeof s === "string");
    if (
      !p ||
      p.version !== 1 ||
      !integer(p.coins) ||
      !integer(p.hints) ||
      !p.completed ||
      typeof p.completed !== "object" ||
      Array.isArray(p.completed) ||
      !Object.entries(p.completed).every(
        ([k, v]) =>
          integer(Number(k), 100) &&
          Number(k) > 0 &&
          v &&
          integer(v.score) &&
          integer(v.stars, 3),
      ) ||
      !Array.isArray(p.claimed) ||
      !p.claimed.every((n) => integer(n, 100) && n >= 5 && n % 5 === 0) ||
      !p.session ||
      !integer(p.session.index, 99) ||
      !integer(p.session.lives, 3) ||
      (p.session.reward !== undefined && !integer(p.session.reward)) ||
      !ids(p.session.removed) ||
      !ids(p.session.blocked) ||
      !(p.session.hint === null || typeof p.session.hint === "string")
    )
      return newProfile();
    return p;
  } catch {
    return newProfile();
  }
}
