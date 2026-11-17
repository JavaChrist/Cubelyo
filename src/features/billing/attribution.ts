import type { Grant } from "./products";

/**
 * Achat attribué par le serveur et inscrit dans la sauvegarde (`profile.purchases`).
 * Le serveur crédite la sauvegarde en ligne et écrit la preuve d'attribution (registre `playPurchases`)
 * dans la même transaction ; l'application reporte ensuite le crédit sur sa copie locale, une seule fois par `id`.
 * Fonctions pures et déterministes (JSON.parse puis JSON.stringify, ordre des clés conservé) :
 * le même calcul côté serveur et côté appareil donne exactement le même texte.
 */
export type PurchaseEntry = {
  /** Empreinte SHA-256 tronquée du jeton d'achat Google Play (jamais le jeton lui-même). */
  id: string;
  /** Produit Google Play. */
  product: string;
  grant: Grant;
};

const WALLET = ["coins", "hints", "erasers", "wands"] as const;
/** Plafond des compteurs accepté par decodeProfile. */
const MAX_COUNTER = 1e9;

export const hasGrant = (grant: Grant) => WALLET.some((key) => grant[key] > 0);

type RawProfile = Record<string, unknown> & { purchases?: PurchaseEntry[] };

export function entriesOf(raw: string): PurchaseEntry[] {
  const parsed = JSON.parse(raw) as RawProfile;
  return Array.isArray(parsed.purchases) ? parsed.purchases : [];
}

/** Ajoute le contenu de l'achat et son entrée. Idempotent : une entrée déjà présente ne change rien. */
export function creditProfile(raw: string, entry: PurchaseEntry): string {
  const profile = JSON.parse(raw) as RawProfile;
  const purchases = Array.isArray(profile.purchases) ? profile.purchases : [];
  if (purchases.some((p) => p.id === entry.id)) return raw;
  for (const key of WALLET) {
    const value = typeof profile[key] === "number" ? (profile[key] as number) : 0;
    profile[key] = Math.min(MAX_COUNTER, value + entry.grant[key]);
  }
  profile.purchases = [
    ...purchases,
    { id: entry.id, product: entry.product, grant: { ...entry.grant } },
  ];
  return JSON.stringify(profile);
}

/** Reporte sur `local` les achats de `remote` qu'il n'a pas encore. */
export function mergeGrants(
  local: string,
  remote: string,
): { raw: string; added: PurchaseEntry[] } {
  const known = new Set(entriesOf(local).map((e) => e.id));
  const added = entriesOf(remote).filter((e) => !known.has(e.id));
  return { raw: added.reduce(creditProfile, local), added };
}

/**
 * Vrai changement serveur : `remote` est exactement `base` plus des achats attribués par le serveur.
 * Rend ces achats, ou null si `remote` diffère autrement (vrai conflit de progression).
 */
export function serverGrants(
  base: string,
  remote: string,
): PurchaseEntry[] | null {
  try {
    const { raw, added } = mergeGrants(base, remote);
    return added.length && raw === remote ? added : null;
  } catch {
    return null;
  }
}
