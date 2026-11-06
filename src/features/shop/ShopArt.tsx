import {
  Ban,
  Coins,
  Eraser,
  Gift,
  Lightbulb,
  Sparkles,
  Star,
} from "lucide-react";
import { ChestArt } from "../game/ProgressScreens";
import { coinAmount, euroPrice, type ShopOffer } from "./catalog";
export function PriceButton({
  cents,
  title,
}: {
  cents: number;
  title: string;
}) {
  return (
    <button
      className="store-price"
      disabled
      aria-label={`${title}, ${euroPrice(cents)} — disponible sur les stores`}
    >
      {euroPrice(cents)}
    </button>
  );
}
export function CoinArt({ density = 1 }: { density?: number }) {
  const stacks = [3 + density, 5 + density, 2 + density];
  return (
    <div className="coin-art" aria-hidden="true">
      {stacks.map((height, index) => (
        <span className={`coin-stack stack-${index}`} key={index}>
          {Array.from({ length: height }, (_, n) => (
            <i key={n} style={{ bottom: n * 5 }} />
          ))}
        </span>
      ))}
      <span className="front-coin">
        <Star size={26} fill="currentColor" strokeWidth={1.5} />
      </span>
    </div>
  );
}
export function AdFreeArt() {
  return (
    <div className="ad-free-art" aria-hidden="true">
      <span>PUB</span>
      <Ban size={86} strokeWidth={3} />
    </div>
  );
}
export function PackArt({ special = false }: { special?: boolean }) {
  return (
    <div
      className={`store-pack-art ${special ? "special-pack-art" : ""}`}
      aria-hidden="true"
    >
      <span className="pack-rays" />
      {special ? (
        <CoinArt density={2} />
      ) : (
        <>
          <Gift className="pack-gift gift-one" size={40} />
          <Gift className="pack-gift gift-two" size={33} />
        </>
      )}
      <ChestArt />
      <span className="pack-sparkle">
        <Sparkles size={24} />
      </span>
    </div>
  );
}
export function OfferBonuses({ offer }: { offer: ShopOffer }) {
  const bonuses = [
    {
      quantity: offer.hints,
      label: offer.hints > 1 ? "Indices" : "Indice",
      singular: "indice",
      Icon: Lightbulb,
      color: "hint",
    },
    {
      quantity: offer.erasers,
      label: offer.erasers > 1 ? "Gommes" : "Gomme",
      singular: "gomme",
      Icon: Eraser,
      color: "erase",
    },
    {
      quantity: offer.wands,
      label: offer.wands > 1 ? "Baguettes" : "Baguette",
      singular: "baguette",
      Icon: Sparkles,
      color: "wand",
    },
  ].filter((b) => b.quantity);
  return (
    <ul
      className="offer-bonuses"
      aria-label={`Atouts du ${offer.title.toLocaleLowerCase("fr-FR")}`}
    >
      {bonuses.map(({ quantity, label, singular, Icon, color }) => (
        <li
          key={label}
          className={`bonus-${color}`}
          aria-label={`${quantity} ${singular}${quantity > 1 ? "s" : ""}`}
        >
          <span className="bonus-art">
            <Icon size={29} />
            <strong>×{quantity}</strong>
          </span>
          <small>{label}</small>
        </li>
      ))}
    </ul>
  );
}
export function CoinBenefit({ coins }: { coins: number }) {
  return (
    <span className="pack-coin-amount">
      <Coins size={17} />
      {coinAmount(coins)}
      <small>pièces</small>
    </span>
  );
}
