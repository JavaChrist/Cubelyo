import { ShoppingBag } from "lucide-react";
import { promotionOffer } from "../shop/catalog";
import { useBilling } from "../billing/BillingProvider";
import { playIdOfOffer } from "../billing/products";
import {
  CoinBenefit,
  OfferBonuses,
  PackArt,
  PriceButton,
} from "../shop/ShopArt";
export function PromotionOffer({
  kind,
  onShop,
}: {
  kind: "starter" | "special";
  onShop: () => void;
}) {
  const offer = promotionOffer(kind);
  const { available } = useBilling();
  return (
    <section
      className={`promotion-panel priced-promotion ${kind === "starter" ? "starter-offer" : "special-offer"}`}
    >
      <div className="priced-promo-art">
        <PackArt special={!!offer.coins} />
        {!!offer.coins && <CoinBenefit coins={offer.coins} />}
      </div>
      <h3>{offer.title}</h3>
      <OfferBonuses offer={offer} />
      <div className="promotion-footer">
        <PriceButton
          cents={offer.priceCents}
          title={offer.title}
          productId={playIdOfOffer(offer.id)}
        />
        <button className="text-button" onClick={onShop}>
          <ShoppingBag size={17} />
          Voir la boutique
        </button>
        <small>
          {available
            ? "Paiement sécurisé par Google Play."
            : "Achat dans l’application Android."}
        </small>
      </div>
    </section>
  );
}
