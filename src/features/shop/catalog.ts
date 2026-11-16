export type ShopOffer = {
  id: "starter" | "noads-pack" | "noads" | "special";
  title: string;
  priceCents: number;
  theme: "orange" | "blue" | "purple";
  hints: number;
  erasers: number;
  wands: number;
  coins: number;
  removesAds: boolean;
};
export const SHOP_OFFERS: readonly ShopOffer[] = [
  {
    id: "starter",
    title: "Pack de départ",
    priceCents: 199,
    theme: "orange",
    hints: 2,
    erasers: 2,
    wands: 2,
    coins: 0,
    removesAds: false,
  },
  {
    id: "noads-pack",
    title: "Pack sans publicité",
    priceCents: 999,
    theme: "blue",
    hints: 3,
    erasers: 3,
    wands: 0,
    coins: 0,
    removesAds: true,
  },
  {
    id: "noads",
    title: "Sans publicité",
    priceCents: 899,
    theme: "blue",
    hints: 0,
    erasers: 0,
    wands: 0,
    coins: 0,
    removesAds: true,
  },
  {
    id: "special",
    title: "Pack spécial",
    priceCents: 899,
    theme: "purple",
    hints: 3,
    erasers: 3,
    wands: 0,
    coins: 4500,
    removesAds: false,
  },
];
export const COIN_OFFERS = [
  { coins: 1500, priceCents: 199 },
  { coins: 7500, priceCents: 899 },
  { coins: 20000, priceCents: 1499 },
  { coins: 45000, priceCents: 3499 },
  { coins: 80000, priceCents: 5999 },
  { coins: 220000, priceCents: 9999 },
] as const;
const money = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});
const number = new Intl.NumberFormat("fr-FR");
export const euroPrice = (cents: number) => money.format(cents / 100);
export const coinAmount = (coins: number) => number.format(coins);
export function promotionOffer(id: "starter" | "special") {
  return SHOP_OFFERS.find((offer) => offer.id === id)!;
}
/** Articles achetables avec les pièces gagnées en jeu (aucun argent réel). */
export type CoinItem = "hints" | "erasers" | "wands" | "stars";
export const COIN_SHOP: readonly {
  item: CoinItem;
  name: string;
  /** Prix en pièces par quantité proposée. */
  prices: Readonly<Partial<Record<1 | 3, number>>>;
}[] = [
  { item: "stars", name: "Étoile", prices: { 1: 250 } },
  { item: "hints", name: "Indice", prices: { 1: 150, 3: 380 } },
  { item: "erasers", name: "Gomme", prices: { 1: 300, 3: 760 } },
  { item: "wands", name: "Baguette", prices: { 1: 450, 3: 1150 } },
];
export function coinPrice(item: CoinItem, quantity: number) {
  return COIN_SHOP.find((o) => o.item === item)?.prices[quantity as 1 | 3];
}
/** Cadeau d'accueil, donné une seule fois à un nouveau joueur. */
export const WELCOME_GIFT = { coins: 200, hints: 3, erasers: 2, wands: 1 };
