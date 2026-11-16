import { coinPrice, WELCOME_GIFT, type CoinItem } from "../shop/catalog";
export const SAVE_KEY = "cubelyo.profile.v1";
export const MAX_LIVES = 3;
export const MAX_STARS = 5;
export const STAR_INTERVAL = 30 * 60 * 1000;
export const POINTS_PER_ARROW = 10;
/** Saison 1 : lundi 16 novembre 2026, 00:00 heure de Paris (UTC+1). */
export const SEASON_EPOCH = Date.UTC(2026, 10, 15, 23);
export const SEASON_LENGTH = 14 * 24 * 60 * 60 * 1000;
/** Saison commune à tous les joueurs (les dates antérieures comptent comme saison 1). */
export function seasonOf(now = Date.now()) {
  return Math.max(1, Math.floor((now - SEASON_EPOCH) / SEASON_LENGTH) + 1);
}
export function seasonEnd(season: number) {
  return SEASON_EPOCH + season * SEASON_LENGTH;
}
export type Session = {
  index: number;
  removed: string[];
  blocked: string[];
  lives: number;
  /** Cœurs perdus sur ce cube (médailles = 3 − perdus). Absent sur les anciennes sauvegardes. */
  lost?: number;
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
  /** Coffres ouverts pendant la saison en cours. */
  claimed: number[];
  /** Tour de la saison : un étage par niveau terminé pour la première fois. */
  tower: { season: number; floors: number };
  /** Carte de bienvenue vue (le cadeau d'accueil est déjà dans le profil neuf). */
  welcomed: boolean;
  session: Session;
};
export function newSession(index = 0): Session {
  return {
    index,
    removed: [],
    blocked: [],
    lives: MAX_LIVES,
    lost: 0,
    hint: null,
    active: false,
    finished: false,
  };
}
export function newProfile(now = Date.now()): Profile {
  return {
    version: 2,
    energy: { stars: MAX_STARS, updatedAt: now },
    erasers: WELCOME_GIFT.erasers,
    wands: WELCOME_GIFT.wands,
    testAccess: false,
    settings: { music: false, sound: true, vibration: true },
    coins: WELCOME_GIFT.coins,
    hints: WELCOME_GIFT.hints,
    completed: {},
    claimed: [],
    tower: { season: seasonOf(now), floors: 0 },
    welcomed: false,
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
  // Gommes dès l'étage 10, baguettes dès l'étage 20, puis montée progressive.
  const erasers =
    floor < 10 ? 0 : floor < 25 ? 1 : floor < 50 ? 2 : 3 + Math.floor((floor - 50) / 20);
  const wands = floor < 20 ? 0 : floor < 55 ? 1 : floor < 80 ? 2 : 3;
  return { coins, hints, erasers, wands };
}
export function completeLevel(
  profile: Profile,
  number: number,
  score: number,
  stars: number,
  now = Date.now(),
): Profile {
  profile = refreshSeason(profile, now);
  const old = profile.completed[number];
  return {
    ...profile,
    coins: profile.coins + (old ? 0 : levelReward(number)),
    tower: old
      ? profile.tower
      : { ...profile.tower, floors: Math.min(100, profile.tower.floors + 1) },
    completed: {
      ...profile.completed,
      [number]: {
        score: Math.max(old?.score ?? 0, score),
        stars: Math.max(old?.stars ?? 0, stars),
      },
    },
  };
}
export function claimChest(
  profile: Profile,
  floor: number,
  now = Date.now(),
): Profile {
  profile = refreshSeason(profile, now);
  if (
    floor < 5 ||
    floor > 100 ||
    floor % 5 ||
    profile.tower.floors < floor ||
    profile.claimed.includes(floor)
  )
    return profile;
  const reward = chestReward(floor);
  return {
    ...profile,
    coins: profile.coins + reward.coins,
    hints: profile.hints + reward.hints,
    erasers: profile.erasers + reward.erasers,
    wands: profile.wands + reward.wands,
    claimed: [...profile.claimed, floor],
  };
}
/**
 * Achat avec les pièces : débit et crédit en une seule opération.
 * Refusé (profil inchangé) si le prix n'existe pas, si le solde manque
 * ou si une étoile dépasserait la réserve maximale.
 */
export function buyItem(
  profile: Profile,
  item: CoinItem,
  quantity: number,
  now = Date.now(),
): Profile {
  const price = coinPrice(item, quantity);
  if (price === undefined || profile.coins < price) return profile;
  if (item !== "stars")
    return {
      ...profile,
      coins: profile.coins - price,
      [item]: profile[item] + quantity,
    };
  const p = refreshEnergy(profile, now),
    stars = p.energy.stars + quantity;
  if (stars > MAX_STARS) return profile;
  return {
    ...p,
    coins: p.coins - price,
    energy: {
      stars,
      updatedAt: stars === MAX_STARS ? now : p.energy.updatedAt,
    },
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
    // Avant les saisons : la tour démarre à zéro sur la saison en cours.
    if (p && !p.tower) {
      p.tower = { season: seasonOf(), floors: 0 };
      p.claimed = [];
    }
    // Joueurs existants : pas de cadeau ni de carte de bienvenue.
    if (p && p.welcomed === undefined) p.welcomed = true;
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
      typeof p.tower !== "object" ||
      !integer(p.tower.season) ||
      p.tower.season < 1 ||
      !integer(p.tower.floors, 100) ||
      typeof p.welcomed !== "boolean" ||
      !p.session ||
      !integer(p.session.index, 99) ||
      !integer(p.session.lives, 3) ||
      (p.session.lost !== undefined && !integer(p.session.lost)) ||
      (p.session.reward !== undefined && !integer(p.session.reward)) ||
      !ids(p.session.removed) ||
      !ids(p.session.blocked) ||
      !(p.session.hint === null || typeof p.session.hint === "string")
    )
      return null;
    return refreshSeason(refreshEnergy(p));
  } catch {
    return null;
  }
}

export function readProfile(raw: string | null): Profile {
  return decodeProfile(raw) ?? newProfile();
}

/** Nouvelle saison : la tour et ses coffres repartent à zéro (coffres non ouverts perdus). */
export function refreshSeason(p: Profile, now = Date.now()): Profile {
  const season = seasonOf(now);
  if (p.tower.season >= season) return p;
  return { ...p, claimed: [], tower: { season, floors: 0 } };
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
/** Une étoile = trois cœurs : débit d'une étoile et réserve de cœurs pleine. */
function spendStar(p: Profile, now: number): Profile["energy"] {
  return {
    stars: p.energy.stars - 1,
    updatedAt: p.energy.stars === MAX_STARS ? now : p.energy.updatedAt,
  };
}
/**
 * Les cœurs restants suivent le joueur d'un cube à l'autre : une étoile n'est
 * débitée que lorsque la réserve de cœurs est vide (ou pour la première partie).
 * Recommencer avec des cœurs restants est gratuit et conserve ces cœurs.
 */
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
  const carried = p.session.active === true && p.session.lives > 0;
  if (!carried && !p.energy.stars) return { profile: p, reason: "energy" };
  return {
    profile: {
      ...p,
      energy: carried ? p.energy : spendStar(p, now),
      session: {
        ...newSession(index),
        active: true,
        lives: carried ? p.session.lives : MAX_LIVES,
      },
    },
    reason: null,
  };
}
/** À zéro cœur : une étoile remet trois cœurs en conservant l'avancement du cube. */
export function continueSession(p: Profile, now = Date.now()): Profile {
  p = refreshEnergy(p, now);
  if (
    !p.energy.stars ||
    p.session.lives !== 0 ||
    !p.session.active ||
    p.session.finished
  )
    return p;
  return {
    ...p,
    energy: spendStar(p, now),
    session: { ...p.session, lives: MAX_LIVES },
  };
}
export function medalsOf(s: Session) {
  return Math.max(0, MAX_LIVES - (s.lost ?? MAX_LIVES - s.lives));
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
      medalsOf(p.session),
    );
  }
  return next;
}
