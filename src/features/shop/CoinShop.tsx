import { Coins, Eraser, Lightbulb, Sparkles, Star } from "lucide-react";
import { MAX_STARS, type Profile } from "../progression/profile";
import { COIN_SHOP, coinAmount, type CoinItem } from "./catalog";
const ICONS = {
  stars: Star,
  hints: Lightbulb,
  erasers: Eraser,
  wands: Sparkles,
} as const;
const PLURALS = {
  stars: ["étoile", "étoiles"],
  hints: ["indice", "indices"],
  erasers: ["gomme", "gommes"],
  wands: ["baguette", "baguettes"],
} as const;
export const itemLabel = (item: CoinItem, n: number) =>
  `${n} ${PLURALS[item][n > 1 ? 1 : 0]}`;
const stock = (p: Profile, item: CoinItem) =>
  item === "stars" ? p.energy.stars : p[item];
/** Échange des pièces gagnées en jeu contre des atouts ou des étoiles. */
export function CoinShop({
  profile,
  items = ["stars", "hints", "erasers", "wands"],
  status,
  onBuy,
}: {
  profile: Profile;
  items?: CoinItem[];
  /** Confirmation d'achat affichée sous la liste (dans les modales). */
  status?: string;
  onBuy: (item: CoinItem, quantity: number) => void;
}) {
  return (
    <>
      <ul className="coin-shop" aria-label="Échanger vos pièces">
        {COIN_SHOP.filter((o) => items.includes(o.item)).map(
          ({ item, name, prices }) => {
            const Icon = ICONS[item],
              owned = stock(profile, item),
              full = item === "stars" && owned >= MAX_STARS,
              cheapest = Math.min(...Object.values(prices)),
              missing = cheapest - profile.coins;
            return (
              <li key={item} className={`coin-shop-item item-${item}`}>
                <span className="coin-shop-icon" aria-hidden="true">
                  <Icon
                    size={26}
                    fill={item === "stars" ? "currentColor" : "none"}
                  />
                </span>
                <span className="coin-shop-name">
                  <strong>{name}</strong>
                  <small>
                    {full
                      ? "Réserve pleine"
                      : missing > 0
                        ? `Il manque ${coinAmount(missing)} pièces`
                        : `Vous en avez ${owned}`}
                  </small>
                </span>
                <span className="coin-shop-buttons">
                  {Object.entries(prices).map(([q, price]) => {
                    const quantity = Number(q);
                    return (
                      <button
                        key={q}
                        className="coin-buy"
                        disabled={
                          profile.coins < price ||
                          (item === "stars" && owned + quantity > MAX_STARS)
                        }
                        aria-label={`Acheter ${itemLabel(item, quantity)} pour ${coinAmount(price)} pièces`}
                        onClick={() => onBuy(item, quantity)}
                      >
                        <b>×{quantity}</b>
                        <span>
                          <Coins size={14} />
                          {coinAmount(price)}
                        </span>
                      </button>
                    );
                  })}
                </span>
              </li>
            );
          },
        )}
      </ul>
      {status && (
        <p className="coin-shop-status" role="status">
          {status}
        </p>
      )}
    </>
  );
}
