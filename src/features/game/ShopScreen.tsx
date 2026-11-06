import { ShoppingBag } from "lucide-react";
import { COIN_OFFERS, SHOP_OFFERS, coinAmount } from "../shop/catalog";
import {
  AdFreeArt,
  CoinArt,
  CoinBenefit,
  OfferBonuses,
  PackArt,
  PriceButton,
} from "../shop/ShopArt";
export function ShopScreen() {
  return (
    <section className="catalogue-screen" aria-label="Boutique Cubelyo">
      <div className="store-awning" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
      <div className="catalogue-title">
        <h1>Boutique</h1>
        <span>Version de test · achats sur les stores</span>
      </div>
      <div
        className="catalogue-packs"
        role="region"
        aria-label="Offres de la boutique"
      >
        {SHOP_OFFERS.map((offer) => (
          <article
            key={offer.id}
            aria-label={offer.title}
            className={`store-offer offer-${offer.theme} ${offer.id === "noads" ? "compact-offer" : ""}`}
          >
            {offer.id === "starter" && (
              <span className="launch-ribbon">Offre de lancement</span>
            )}
            <div className="store-offer-main">
              <div className="store-offer-art">
                {offer.removesAds ? (
                  <AdFreeArt />
                ) : (
                  <PackArt special={!!offer.coins} />
                )}{" "}
                {!!offer.coins && <CoinBenefit coins={offer.coins} />}
              </div>
              {offer.id !== "noads" && <OfferBonuses offer={offer} />}
            </div>
            <div className="store-offer-footer">
              <h2>{offer.title}</h2>
              <PriceButton cents={offer.priceCents} title={offer.title} />
            </div>
            {offer.removesAds && (
              <p className="ad-free-note">
                Aucune publicité imposée.
                <br />
                Les publicités récompensées restent facultatives.
              </p>
            )}
          </article>
        ))}
      </div>
      <section className="coin-catalogue" aria-label="Lots de pièces">
        <h2>Pièces</h2>
        <div className="coin-offers">
          {COIN_OFFERS.map((offer, i) => (
            <article
              key={offer.coins}
              className="coin-offer"
              aria-label={`${coinAmount(offer.coins)} pièces`}
            >
              <div className="coin-offer-art">
                <CoinArt density={Math.min(3, i)} />
                <strong>{coinAmount(offer.coins)}</strong>
                <small>pièces</small>
              </div>
              <PriceButton
                cents={offer.priceCents}
                title={`${coinAmount(offer.coins)} pièces`}
              />
            </article>
          ))}
        </div>
      </section>
      <p className="catalogue-notice">
        <ShoppingBag size={14} />
        <span>Aucun paiement disponible ici</span>
      </p>
    </section>
  );
}
