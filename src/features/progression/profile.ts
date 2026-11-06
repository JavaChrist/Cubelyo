export const SAVE_KEY = "cubelyo.profile.v1";
export const MAX_LIVES = 3;
export const MAX_STARS = 5;
export const STAR_INTERVAL = 30 * 60 * 1000;
export const CONTINUE_PRICE: number | null = null;
export const POINTS_PER_ARROW = 10;
export type Session = {
  index: number;
  removed: string[];
  blocked: string[];
  lives: number;
  hint: string | null;
  reward?: number;
  active?: boolean;
  finished?: boolean;
};
export type Profile = {
  version: 2;
  energy: { stars: number; updatedAt: number };
  erasers: number;
  wands: number;
  testAccess: boolean;
  settings: { music: boolean; sound: boolean; vibration: boolean };
  coins: number;
  hints: number;
  completed: Record<string, { score: number; stars: number }>;
  claimed: number[];
  session: Session;
};
export function newSession(index = 0): Session {
  return {
    index,
    removed: [],
    blocked: [],
    lives: MAX_LIVES,
    hint: null,
    active: false,
    finished: false,
  };
}
export function newProfile(now = Date.now()): Profile {
  return {
    version: 2,
    energy: { stars: MAX_STARS, updatedAt: now },
    erasers: 3,
    wands: 3,
    testAccess: false,
    settings: { music: false, sound: true, vibration: true },
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
export function decodeProfile(raw: string | null): Profile | null {
  try {
    const p = JSON.parse(raw ?? "null") as Profile & { version: number };
    if (p && Number(p.version) === 1) {
      Object.assign(p, {
        version: 2,
        energy: { stars: MAX_STARS, updatedAt: Date.now() },
        erasers: 3,
        wands: 3,
        testAccess: false,
        settings: { music: false, sound: true, vibration: true },
      });
      if (p.session)
        Object.assign(p.session, {
          active:
            p.session.removed?.length > 0 ||
            p.session.blocked?.length > 0 ||
            p.session.reward !== undefined,
          finished: p.session.reward !== undefined,
        });
    }
    const integer = (n: unknown, max = 1e9) =>
      typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= max;
    const ids = (v: unknown): v is string[] =>
      Array.isArray(v) && v.every((s) => typeof s === "string");
    if (
      !p ||
      p.version !== 2 ||
      !p.energy ||
      !integer(p.energy.stars, MAX_STARS) ||
      !integer(p.energy.updatedAt, Number.MAX_SAFE_INTEGER) ||
      !integer(p.erasers) ||
      !integer(p.wands) ||
      typeof p.testAccess !== "boolean" ||
      !p.settings ||
      ![p.settings.music, p.settings.sound, p.settings.vibration].every(
        (v) => typeof v === "boolean",
      ) ||
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
      return null;
    return refreshEnergy(p);
  } catch {
    return null;
  }
}

export function readProfile(raw: string | null): Profile {
  return decodeProfile(raw) ?? newProfile();
}

/** Recharge entière plus fraction conservée, même après une fermeture du navigateur. */
export function refreshEnergy(p: Profile, now = Date.now()): Profile {
  if (p.energy.stars >= MAX_STARS || now < p.energy.updatedAt) return p;
  const ticks = Math.floor((now - p.energy.updatedAt) / STAR_INTERVAL);
  if (!ticks) return p;
  const stars = Math.min(MAX_STARS, p.energy.stars + ticks);
  return {
    ...p,
    energy: {
      stars,
      updatedAt:
        stars === MAX_STARS ? now : p.energy.updatedAt + ticks * STAR_INTERVAL,
    },
  };
}
export function nextStarIn(p: Profile, now = Date.now()) {
  return p.energy.stars === MAX_STARS
    ? 0
    : Math.max(
        0,
        STAR_INTERVAL -
          (Math.max(now, p.energy.updatedAt) - p.energy.updatedAt),
      );
}
export function unlockedLevel(p: Profile) {
  let n = 1;
  while (n < 100 && p.completed[n]) n++;
  return n;
}
export function isUnlocked(p: Profile, index: number) {
  return (
    p.testAccess ||
    index + 1 <= unlockedLevel(p) ||
    !!p.completed[index + 1] ||
    (p.session.active === true && p.session.index === index)
  );
}
export function beginSession(
  p: Profile,
  index: number,
  force = false,
  now = Date.now(),
): { profile: Profile; reason: "locked" | "energy" | null } {
  p = refreshEnergy(p, now);
  if (
    index < 0 ||
    index > 99 ||
    !Number.isInteger(index) ||
    !isUnlocked(p, index)
  )
    return { profile: p, reason: "locked" };
  if (
    !force &&
    p.session.index === index &&
    p.session.active &&
    !p.session.finished
  )
    return { profile: p, reason: null };
  if (!p.energy.stars) return { profile: p, reason: "energy" };
  return {
    profile: {
      ...p,
      energy: {
        stars: p.energy.stars - 1,
        updatedAt: p.energy.stars === MAX_STARS ? now : p.energy.updatedAt,
      },
      session: { ...newSession(index), active: true },
    },
    reason: null,
  };
}
export function continueSession(p: Profile, price = CONTINUE_PRICE): Profile {
  if (
    price === null ||
    price < 0 ||
    !Number.isInteger(price) ||
    p.coins < price ||
    p.session.lives !== 0 ||
    !p.session.active ||
    p.session.finished
  )
    return p;
  return {
    ...p,
    coins: p.coins - price,
    session: { ...p.session, lives: MAX_LIVES },
  };
}

export function removeFromSession(
  p: Profile,
  ids: string[],
  total: number,
): Profile {
  const removed = [...new Set([...p.session.removed, ...ids])];
  let next = {
    ...p,
    session: {
      ...p.session,
      removed,
      hint: null,
      finished: removed.length === total,
    },
  } as Profile;
  if (removed.length === total) {
    next.session.reward = p.completed[p.session.index + 1]
      ? 0
      : levelReward(p.session.index + 1);
    next = completeLevel(
      next,
      p.session.index + 1,
      removed.length * POINTS_PER_ARROW,
      p.session.lives,
    );
  }
  return next;
}
