import { COIN_OFFERS, SHOP_OFFERS, type ShopOffer } from "../shop/catalog";

/**
 * Les 10 produits ponctuels Google Play de Cubelyo (Play Console › Monétiser › Produits ponctuels).
 * Identifiants Play : minuscules, chiffres, « _ » et « . » seulement, d'où `noads_pack` pour l'offre `noads-pack`.
 * Fichier sans dépendance réseau : lu par le jeu et par la route /api/play/verify. Voir docs/billing.md.
 */
export type Grant = {
  coins: number;
  hints: number;
  erasers: number;
  wands: number;
};

export type PlayProduct = {
  id: string;
  title: string;
  /** Prix de référence (centimes d'euro) à saisir dans la Play Console ; le jeu affiche le prix rendu par Google. */
  priceCents: number;
  /** Consommable : racheté autant de fois que voulu, le serveur le consomme. Sinon acheté une fois, accusé de réception. */
  consumable: boolean;
  removesAds: boolean;
  grant: Grant;
};

export const playIdOfOffer = (id: ShopOffer["id"]): string =>
  id.replace("-", "_");
export const playIdOfCoins = (coins: number): string => `coins_${coins}`;

export const PLAY_PRODUCTS: readonly PlayProduct[] = [
  ...SHOP_OFFERS.map((offer) => ({
    id: playIdOfOffer(offer.id),
    title: offer.title,
    priceCents: offer.priceCents,
    consumable: !offer.removesAds,
    removesAds: offer.removesAds,
    grant: {
      coins: offer.coins,
      hints: offer.hints,
      erasers: offer.erasers,
      wands: offer.wands,
    },
  })),
  ...COIN_OFFERS.map((offer) => ({
    id: playIdOfCoins(offer.coins),
    title: `${offer.coins.toLocaleString("fr-FR")} pièces`,
    priceCents: offer.priceCents,
    consumable: true,
    removesAds: false,
    grant: { coins: offer.coins, hints: 0, erasers: 0, wands: 0 },
  })),
];

export const PLAY_PRODUCT_IDS: readonly string[] = PLAY_PRODUCTS.map(
  (p) => p.id,
);

export const playProduct = (id: unknown): PlayProduct | undefined =>
  PLAY_PRODUCTS.find((p) => p.id === id);
