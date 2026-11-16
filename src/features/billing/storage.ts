import type { Grant } from "./products";

/**
 * Droits d'achat sur l'appareil (`cubelyo.purchases.v1`). Google Play reste la référence :
 * au lancement, la liste des achats de l'appareil est relue et vérifiée par le serveur.
 * - `adsRemoved` : achat sans publicité vérifié.
 * - `credited` : jetons déjà crédités dans la sauvegarde (un achat n'est jamais crédité deux fois).
 * - `queue` : achats vérifiés pas encore crédités (crédités par Game.tsx au prochain rendu).
 */
export const PURCHASES_KEY = "cubelyo.purchases.v1";

export type QueuedGrant = { token: string; productId: string; grant: Grant };
export type PurchasesState = {
  adsRemoved: boolean;
  credited: string[];
  queue: QueuedGrant[];
};

const EMPTY: PurchasesState = { adsRemoved: false, credited: [], queue: [] };
const MAX_CREDITED = 500;

export function parsePurchases(raw: string | null): PurchasesState {
  try {
    const data = JSON.parse(raw ?? "null") as Partial<PurchasesState> | null;
    if (!data || typeof data !== "object") return EMPTY;
    const n = (v: unknown) =>
      typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
    return {
      adsRemoved: data.adsRemoved === true,
      credited: Array.isArray(data.credited)
        ? data.credited.filter((t) => typeof t === "string")
        : [],
      queue: Array.isArray(data.queue)
        ? data.queue
            .filter(
              (q) =>
                q &&
                typeof q.token === "string" &&
                typeof q.productId === "string" &&
                q.grant,
            )
            .map((q) => ({
              token: q.token,
              productId: q.productId,
              grant: {
                coins: n(q.grant.coins),
                hints: n(q.grant.hints),
                erasers: n(q.grant.erasers),
                wands: n(q.grant.wands),
              },
            }))
        : [],
    };
  } catch {
    return EMPTY;
  }
}

/** Ajoute un achat vérifié à créditer, sauf s'il est déjà crédité ou déjà en attente. */
export function enqueueGrant(
  state: PurchasesState,
  item: QueuedGrant,
): PurchasesState {
  if (
    state.credited.includes(item.token) ||
    state.queue.some((q) => q.token === item.token)
  )
    return state;
  const empty =
    !item.grant.coins &&
    !item.grant.hints &&
    !item.grant.erasers &&
    !item.grant.wands;
  if (empty)
    return {
      ...state,
      credited: [...state.credited, item.token].slice(-MAX_CREDITED),
    };
  return { ...state, queue: [...state.queue, item] };
}

/** Le crédit est écrit dans la sauvegarde : le jeton passe dans `credited`. */
export function settleGrant(
  state: PurchasesState,
  token: string,
): PurchasesState {
  if (!state.queue.some((q) => q.token === token)) return state;
  return {
    ...state,
    queue: state.queue.filter((q) => q.token !== token),
    credited: [...state.credited, token].slice(-MAX_CREDITED),
  };
}

// --- Store partagé (useSyncExternalStore) -------------------------------------------------------------------

let current: PurchasesState | null = null;
const listeners = new Set<() => void>();

export function readPurchases(): PurchasesState {
  if (current) return current;
  try {
    current = parsePurchases(localStorage.getItem(PURCHASES_KEY));
  } catch {
    current = EMPTY;
  }
  return current;
}

export function writePurchases(
  update: (state: PurchasesState) => PurchasesState,
) {
  const before = readPurchases();
  const next = update(before);
  if (next === before) return;
  current = next;
  try {
    localStorage.setItem(PURCHASES_KEY, JSON.stringify(next));
  } catch {
    // Stockage plein ou bloqué : l'état reste en mémoire, la restauration au lancement le rétablit.
  }
  for (const listener of listeners) listener();
}

export function subscribePurchases(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Effacement de la sauvegarde : les crédits déjà faits sont oubliés, le droit sans publicité reste. */
export function forgetCreditedPurchases() {
  writePurchases((state) => ({ ...state, credited: [], queue: [] }));
}
