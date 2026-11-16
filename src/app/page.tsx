import Game from "@/features/game/Game";
import { AdsProvider } from "@/features/ads/AdsProvider";
import { BillingProvider } from "@/features/billing/BillingProvider";
import { PromotionProvider } from "@/features/promotions/PromotionProvider";
export default function Page() {
  return (
    <BillingProvider>
      <AdsProvider>
        <PromotionProvider>
          <Game />
        </PromotionProvider>
      </AdsProvider>
    </BillingProvider>
  );
}
