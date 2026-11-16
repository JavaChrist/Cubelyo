import {
  afterGameCompleted,
  afterPromoShown,
  campaignsFromCatalogDocument,
  catalogUrl,
  INITIAL_PROMO_STATE,
  PROMO_RULES,
  stillValid,
  type AdultAnswer,
  type PromoCampaign,
  type PromoState,
  type PromotionsConfig,
} from "./rules";

/**
 * État des promotions sur l'appareil : compteur de parties, dernière vidéo vue, réponse à la question d'âge,
 * et copie du catalogue. Rien n'est envoyé : le catalogue est seulement lu, sans compte ni identifiant.
 * Une écriture refusée par le navigateur n'est pas une erreur pour le joueur : la promotion attend, c'est tout.
 */
const FORMAT_VERSION = 1;

interface CachedCatalog {
  fetchedAt: number;
  campaigns: PromoCampaign[];
}

interface StoredPromotions {
  version: number;
  state: PromoState;
  catalog: CachedCatalog | null;
}

export const PROMOTIONS_KEY = "cubelyo.promotions.v1";

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isAdult = (value: unknown): value is AdultAnswer => value === "adult" || value === "minor" || value === null;

function parseState(value: unknown): PromoState {
  if (!isObject(value)) return INITIAL_PROMO_STATE;
  const count = value.completedSinceLast;
  return {
    completedSinceLast:
      typeof count === "number" && Number.isInteger(count) && count >= 0 ? Math.min(count, PROMO_RULES.gamesBetween) : 0,
    lastShownId: typeof value.lastShownId === "string" ? value.lastShownId : null,
    adult: isAdult(value.adult) ? value.adult : null,
  };
}

function parseCatalog(value: unknown): CachedCatalog | null {
  if (!isObject(value) || typeof value.fetchedAt !== "number" || !Array.isArray(value.campaigns)) return null;
  return { fetchedAt: value.fetchedAt, campaigns: value.campaigns as PromoCampaign[] };
}

function read(): StoredPromotions {
  try {
    const raw = window.localStorage.getItem(PROMOTIONS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!isObject(parsed) || parsed.version !== FORMAT_VERSION) return { version: FORMAT_VERSION, state: INITIAL_PROMO_STATE, catalog: null };
    return { version: FORMAT_VERSION, state: parseState(parsed.state), catalog: parseCatalog(parsed.catalog) };
  } catch {
    return { version: FORMAT_VERSION, state: INITIAL_PROMO_STATE, catalog: null };
  }
}

function write(stored: StoredPromotions): void {
  try {
    window.localStorage.setItem(PROMOTIONS_KEY, JSON.stringify(stored));
  } catch {
    // Stockage plein ou bloqué : la promotion ne s'affiche pas, la partie continue.
  }
}

const update = (change: (state: PromoState) => PromoState): PromoState => {
  const stored = read();
  const state = change(stored.state);
  write({ ...stored, state });
  return state;
};

export const readPromoState = (): PromoState => read().state;

// Réponse à la question d'âge : la bannière AdMob s'y abonne pour changer ses réglages sans attendre un redémarrage.
const adultListeners = new Set<() => void>();
const notifyAdultChange = () => adultListeners.forEach((listener) => listener());

/** Prévient à chaque réponse à la question d'âge et à chaque effacement des données. */
export function onAdultAnswerChange(listener: () => void): () => void {
  adultListeners.add(listener);
  return () => {
    adultListeners.delete(listener);
  };
}

/** À appeler une seule fois par partie réellement terminée. */
export const recordGameCompleted = (): PromoState => update(afterGameCompleted);

export const recordPromoShown = (campaignId: string): PromoState =>
  update((state) => afterPromoShown(state, campaignId));

/** Réponse à la question d'âge. Un mineur n'a plus de catalogue en cache. */
export function recordAdultAnswer(adult: AdultAnswer): void {
  const stored = read();
  write({ ...stored, state: { ...stored.state, adult }, catalog: adult === "adult" ? stored.catalog : null });
  notifyAdultChange();
}

/** Vrai si l'appareil garde quelque chose des promotions (compteur, réponse d'âge, dernière vidéo). */
export function hasPromotionsData(): boolean {
  const { state } = read();
  return state.completedSinceLast > 0 || state.lastShownId !== null || state.adult !== null;
}

/** Efface tout : compteur, réponse à la question d'âge et catalogue. */
export function clearPromotions(): void {
  try {
    window.localStorage.removeItem(PROMOTIONS_KEY);
  } catch {
    // Rien à effacer si le stockage est inaccessible.
  }
  notifyAdultChange();
}

async function fetchCatalog(config: PromotionsConfig): Promise<unknown> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), PROMO_RULES.fetchTimeoutMs);
  try {
    // Lecture publique, sans clé ni jeton : le catalogue ne contient que des campagnes publiées.
    const response = await fetch(catalogUrl(config), {
      signal: controller.signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "no-store",
    });
    // Catalogue pas encore créé dans le gestionnaire : aucune campagne.
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`catalogue ${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * Campagnes diffusables. La copie locale sert pendant 15 minutes ; ensuite le catalogue est relu,
 * et en cas d'échec réseau la copie sert encore jusqu'à une heure. Au-delà, aucune campagne.
 * À n'appeler qu'après `mayFetchCatalog` : jamais sans publicités ni sans réponse « adulte ».
 */
export async function loadCampaigns(config: PromotionsConfig, now = Date.now()): Promise<PromoCampaign[]> {
  const stored = read();
  const cached = stored.catalog;
  const age = cached ? now - cached.fetchedAt : Number.POSITIVE_INFINITY;
  if (cached && age >= 0 && age < PROMO_RULES.catalogTtlMs) return stillValid(cached.campaigns, config.locale, new Date(now));
  try {
    const document = await fetchCatalog(config);
    const campaigns = campaignsFromCatalogDocument(document, config.locale, new Date(now));
    // Relu au moment d'écrire : la réponse à la question d'âge a pu changer pendant la requête.
    const latest = read();
    if (latest.state.adult === "adult") write({ ...latest, catalog: { fetchedAt: now, campaigns } });
    return campaigns;
  } catch {
    if (cached && age >= 0 && age < PROMO_RULES.catalogStaleMaxMs) return stillValid(cached.campaigns, config.locale, new Date(now));
    return [];
  }
}
