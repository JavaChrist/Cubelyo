"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import adsJson from "./ads.json";
import {
  ADS_RULES,
  adAudience,
  adsAllowed,
  adsConfigErrors,
  adsTestMode,
  mayRequestBanner,
  requestSettingsFor,
  type AdAudience,
  type AdsConfig,
} from "./rules";
import {
  applyRequestSettings,
  gatherConsent,
  hideBanner,
  isNativeApp,
  listenBanner,
  removeBanner,
  resumeBanner,
  showBanner,
  showPrivacyOptions,
  type ConsentState,
} from "./admob";
import { useAdEntitlements } from "./entitlements";
import {
  onAdultAnswerChange,
  readPromoState,
} from "../promotions/storage";

/**
 * Bannière AdMob de l'application Android (voir `docs/admob.md`).
 *
 * La bannière est une vue native posée au-dessus de la WebView : elle ne doit jamais couvrir le jeu.
 * Elle est collée au bas de l'écran, la page réserve sa hauteur (`--ad-banner-h`) et la barre de navigation
 * remonte d'autant. Elle est masquée pendant un niveau, une modale, une carte de récompense, la question d'âge
 * ou une vidéo de promotion.
 *
 * Aucune requête sans droit à la publicité (achat sans publicité, droits en chargement), ni sur le web.
 * Toutes les opérations natives passent l'une après l'autre par `reconcile`.
 */

const ADS = adsJson as AdsConfig;
const CONFIGURED = adsConfigErrors(ADS).length === 0;
/** Option de build réservée aux tests : elle ne peut que retirer les annonces, jamais ouvrir un droit. */
const FORCE_NO_ADS = process.env.NEXT_PUBLIC_ADS_TEST_NO_ADS === "1";
const BANNER_HEIGHT_VAR = "--ad-banner-h";

interface AdsApi {
  /** Masque la bannière tant que la fonction rendue n'est pas appelée. */
  hide: () => () => void;
  /** Consentement UMP d'un adulte, `null` tant qu'il n'a pas été demandé. */
  consent: ConsentState | null;
  /** Rouvre le formulaire « Choix publicitaires » de Google. */
  openPrivacyOptions: () => Promise<void>;
}

const AdsContext = createContext<AdsApi | null>(null);

const noSubscription = () => () => {};

interface NativeState {
  applied: AdAudience | null;
  consent: ConsentState | null;
  consentFailedAt: number;
  /**
   * `unknown` : une vue native peut subsister (page rechargée, échec de chargement). Elle est retirée avant tout
   * nouvel affichage, car le plugin ne répond jamais à un `showBanner` quand une bannière existe déjà.
   */
  banner: "none" | "shown" | "hidden" | "unknown";
  failedAt: number;
}

interface Desired {
  allowed: boolean;
  audience: AdAudience;
  visible: boolean;
}

const setBannerHeight = (height: number) =>
  document.documentElement.style.setProperty(
    BANNER_HEIGHT_VAR,
    `${Math.max(0, height)}px`,
  );

export function AdsProvider({ children }: { children: ReactNode }) {
  const entitlements = useAdEntitlements();
  const native = useSyncExternalStore(noSubscription, isNativeApp, () => false);
  const adult = useSyncExternalStore(
    onAdultAnswerChange,
    () => readPromoState().adult,
    () => null,
  );
  const [hideCount, setHideCount] = useState(0);
  const [consent, setConsent] = useState<ConsentState | null>(null);

  const allowed = adsAllowed({
    configured: CONFIGURED,
    native,
    entitlementsReady: entitlements.ready,
    adsRemoved: entitlements.adsRemoved,
    forceNoAds: FORCE_NO_ADS,
  });
  const audience = adAudience(adult);
  const visible = allowed && hideCount === 0;

  const desired = useRef<Desired>({ allowed, audience, visible });
  const state = useRef<NativeState>({
    applied: null,
    consent: null,
    consentFailedAt: 0,
    banner: "unknown",
    failedAt: 0,
  });
  const running = useRef<Promise<void> | null>(null);
  const again = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Dernière hauteur annoncée par le plugin pour une bannière chargée, réappliquée à la reprise. */
  const lastHeight = useRef(0);

  const updateConsent = (next: ConsentState | null) => {
    state.current.consent = next;
    setConsent(next);
  };

  /** Une étape vers l'état voulu. Chaque échec coupe la bannière : jamais d'annonce dans le doute. */
  const step = useCallback(async () => {
    // Sur le web, aucune vue native à retirer : sans ce garde, le module AdMob serait chargé pour rien.
    if (!isNativeApp()) return;
    const want = desired.current;
    const now = state.current;

    if (
      !want.allowed ||
      (now.applied !== null && now.applied !== want.audience)
    ) {
      if (now.banner !== "none") await removeBanner();
      now.banner = "none";
      now.applied = null;
      now.failedAt = 0;
      updateConsent(null);
      setBannerHeight(0);
      if (!want.allowed) return;
    }

    const settings = requestSettingsFor(want.audience);
    if (now.applied === null) {
      // Réglages d'âge appliqués avant toute requête. Échec : aucune annonce.
      await applyRequestSettings(settings, ADS.testDevices);
      now.applied = want.audience;
    }

    if (!want.visible) {
      if (now.banner === "shown") {
        await hideBanner().catch(() => undefined);
        now.banner = "hidden";
        setBannerHeight(0);
      } else if (now.banner === "unknown") {
        await removeBanner();
        now.banner = "none";
      }
      return;
    }

    if (settings.consent === "ump" && now.consent === null) {
      // UMP indisponible (réseau) : nouvel essai à un prochain affichage, pas plus d'une fois par minute.
      if (Date.now() - now.consentFailedAt < ADS_RULES.retryAfterMs) return;
      try {
        updateConsent(await gatherConsent());
      } catch {
        now.consentFailedAt = Date.now();
        return;
      }
      // Le formulaire a pu prendre du temps : l'état voulu est relu au tour suivant.
      again.current = true;
      return;
    }

    if (
      !mayRequestBanner({
        allowed: want.allowed,
        settingsApplied: now.applied,
        audience: want.audience,
        consent: now.consent,
      })
    ) {
      if (now.banner !== "none") await removeBanner();
      now.banner = "none";
      setBannerHeight(0);
      return;
    }

    if (now.banner === "shown") return;
    if (now.banner === "hidden") {
      await resumeBanner();
      now.banner = "shown";
      // Le plugin annonce parfois la hauteur pendant la reprise, avant cette ligne : elle serait perdue.
      setBannerHeight(lastHeight.current);
      return;
    }
    if (now.banner !== "none") await removeBanner();
    now.banner = "none";
    if (Date.now() - now.failedAt < ADS_RULES.retryAfterMs) return;
    await showBanner(
      ADS.androidBannerAdUnitId,
      settings,
      adsTestMode(ADS),
    );
    now.banner = "shown";
  }, []);

  /** Se termine quand l'état natif rejoint l'état voulu, y compris un changement demandé pendant le tour. */
  const reconcile = useCallback((): Promise<void> => {
    if (running.current) {
      again.current = true;
      return running.current;
    }
    const run = (async () => {
      try {
        do {
          again.current = false;
          try {
            await step();
          } catch {
            // SDK indisponible : rien n'est affiché, l'état est repris à zéro au prochain changement.
            await removeBanner().catch(() => undefined);
            Object.assign(state.current, {
              applied: null,
              banner: "none",
            } satisfies Partial<NativeState>);
            setBannerHeight(0);
          }
        } while (again.current);
      } finally {
        running.current = null;
      }
    })();
    running.current = run;
    return run;
  }, [step]);

  useEffect(() => {
    desired.current = { allowed, audience, visible };
    void reconcile();
  }, [allowed, audience, visible, reconcile]);

  useEffect(() => {
    if (!allowed) return;
    let stop: (() => void) | null = null;
    let cancelled = false;
    void listenBanner({
      onHeight: (height) => {
        if (height > 0) lastHeight.current = height;
        setBannerHeight(state.current.banner === "shown" ? height : 0);
      },
      onFailed: () => {
        // Bannière vide retirée : la page ne garde pas d'espace réservé pour rien.
        state.current.failedAt = Date.now();
        state.current.banner = "unknown";
        setBannerHeight(0);
        void reconcile();
        // Sans ce rappel, aucune nouvelle requête tant que rien ne change à l'écran.
        if (retryTimer.current) clearTimeout(retryTimer.current);
        retryTimer.current = setTimeout(() => {
          retryTimer.current = null;
          void reconcile();
        }, ADS_RULES.retryAfterMs + 1_000);
      },
    })
      .then((remove) => {
        if (cancelled) remove();
        else stop = remove;
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      stop?.();
      if (retryTimer.current) clearTimeout(retryTimer.current);
      retryTimer.current = null;
    };
  }, [allowed, reconcile]);

  const hide = useCallback(() => {
    setHideCount((count) => count + 1);
    return () => setHideCount((count) => count - 1);
  }, []);

  const openPrivacyOptions = useCallback(async () => {
    updateConsent(await showPrivacyOptions());
    void reconcile();
  }, [reconcile]);

  const api = useMemo<AdsApi>(
    () => ({ hide, consent, openPrivacyOptions }),
    [hide, consent, openPrivacyOptions],
  );

  return <AdsContext value={api}>{children}</AdsContext>;
}

/** Masque la bannière tant que `hidden` est vrai : niveau en cours, modale, question d'âge, vidéo. */
export function useHideAdBanner(hidden: boolean): void {
  const hide = use(AdsContext)?.hide;
  useEffect(() => {
    if (!hidden || !hide) return;
    return hide();
  }, [hidden, hide]);
}

export function useAds(): AdsApi | null {
  return use(AdsContext);
}
