"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useHideAdBanner } from "../ads/AdsProvider";
import { useAdEntitlements } from "../ads/entitlements";
import {
  PROMOTIONS_CONFIG,
  PROMO_RULES,
  isPromoDue,
  mayFetchCatalog,
  pickCampaign,
  promotionsAllowed,
  promotionsConfigErrors,
  type AdultAnswer,
  type PromoAccess,
  type PromoCampaign,
} from "./rules";
import {
  loadCampaigns,
  readPromoState,
  recordAdultAnswer,
  recordGameCompleted,
  recordPromoShown,
} from "./storage";
import { AgeQuestion } from "./AgeQuestion";
import { PromoPlayer } from "./PromoPlayer";

type Step =
  | { kind: "idle" }
  | { kind: "ask" }
  | { kind: "play"; campaign: PromoCampaign };

const IDLE: Step = { kind: "idle" };
const CONFIGURED = promotionsConfigErrors(PROMOTIONS_CONFIG).length === 0;

interface PromotionContext {
  /** Niveau réussi. À appeler une seule fois par victoire. */
  gameCompleted: () => void;
  /** Interdit toute promotion tant que la fonction rendue n'est pas appelée. */
  block: () => () => void;
}

const Context = createContext<PromotionContext | null>(null);

/**
 * Promotions JavaChrist entre deux niveaux (voir `docs/promotions.md`).
 * Une promotion due survit à la navigation : elle s'ouvre au premier moment calme (aucun niveau en cours,
 * aucune modale ni carte de récompense), `PROMO_RULES.resultDelayMs` après.
 */
export function PromotionProvider({ children }: { children: ReactNode }) {
  const entitlements = useAdEntitlements();
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState<Step>(IDLE);
  const [blocks, setBlocks] = useState(0);
  const access: PromoAccess = {
    configured: CONFIGURED,
    entitlementsReady: entitlements.ready,
    adsRemoved: entitlements.adsRemoved,
  };
  const allowed = promotionsAllowed(access);

  // Catalogue lu à l'avance, pour que la vidéo démarre sans attente. Seulement pour un adulte déclaré.
  useEffect(() => {
    if (!mayFetchCatalog(access, readPromoState())) return;
    void loadCampaigns(PROMOTIONS_CONFIG);
    // `access` se résume à `allowed` ici.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  const gameCompleted = useCallback(() => {
    const state = recordGameCompleted();
    if (isPromoDue(state) && state.adult !== "minor") setPending(true);
  }, []);

  const block = useCallback(() => {
    setBlocks((count) => count + 1);
    return () => setBlocks((count) => count - 1);
  }, []);

  const showCampaign = useCallback(async () => {
    const state = readPromoState();
    const campaign = pickCampaign(
      await loadCampaigns(PROMOTIONS_CONFIG),
      state.lastShownId,
      Math.random,
    );
    // Aucune campagne (catalogue vide, réseau absent) : le compteur reste prêt pour le prochain niveau.
    if (!campaign) return;
    recordPromoShown(campaign.id);
    setStep({ kind: "play", campaign });
  }, []);

  useEffect(() => {
    if (!pending || blocks > 0) return;
    const timer = window.setTimeout(() => {
      setPending(false);
      // Droits relus au dernier moment : un achat sans publicité pendant l'attente annule tout.
      if (!allowed) return;
      const state = readPromoState();
      if (!isPromoDue(state) || state.adult === "minor") return;
      if (state.adult === null) setStep({ kind: "ask" });
      else void showCampaign();
    }, PROMO_RULES.resultDelayMs);
    return () => window.clearTimeout(timer);
  }, [pending, blocks, allowed, showCampaign]);

  // « Plus tard » : pas de réponse, la question revient au prochain moment prévu.
  const answer = (value: AdultAnswer) => {
    setStep(IDLE);
    if (value === null) return;
    recordAdultAnswer(value);
    if (value === "adult") void showCampaign();
  };

  // Bannière AdMob masquée pendant la question d'âge et la vidéo : une vue native passerait au-dessus.
  useHideAdBanner(step.kind !== "idle");

  return (
    <Context value={{ gameCompleted, block }}>
      {children}
      {step.kind === "ask" ? (
        <AgeQuestion onAnswer={answer} />
      ) : step.kind === "play" ? (
        <PromoPlayer
          key={step.campaign.id}
          campaign={step.campaign}
          onClose={() => setStep(IDLE)}
        />
      ) : null}
    </Context>
  );
}

/**
 * Raccorde le jeu aux promotions. `hold` : niveau en cours, modale ou carte ouverte, rien ne s'ouvre.
 * Rend `gameCompleted`, à appeler une seule fois par niveau réussi.
 */
export function usePromotion(hold: boolean): () => void {
  const context = use(Context);
  if (!context)
    throw new Error("usePromotion doit être utilisé sous PromotionProvider");
  const { block, gameCompleted } = context;
  useEffect(() => (hold ? block() : undefined), [hold, block]);
  return gameCompleted;
}
