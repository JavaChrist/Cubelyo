"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Capacitor } from "@capacitor/core";
import { PLAY_PRODUCT_IDS, playProduct, type Grant } from "./products";
import type { PlayPurchase } from "./plugin";
import {
  BILLING_TIMEOUT,
  describeBillingError,
  describeUnfetched,
} from "./diagnostic";
import { loadNativePlugin } from "./loader";
import {
  enqueueGrant,
  readPurchases,
  settleGrant,
  subscribePurchases,
  writePurchases,
  type QueuedGrant,
} from "./storage";

/**
 * Achats Google Play dans l'application Android (voir docs/billing.md).
 * 1. Prix localisés lus chez Google Play au lancement ; sans prix, les boutons restent inactifs.
 * 2. Achat lancé par le plugin natif, puis vérifié par /api/play/verify (serveur Vercel).
 * 3. Achat vérifié : mis en file (`cubelyo.purchases.v1`), crédité dans la sauvegarde par Game.tsx.
 * Au lancement et sur « Restaurer les achats » : la liste des achats de l'appareil est revérifiée
 * (achats interrompus, paiements en attente devenus payés, droit sans publicité après réinstallation).
 * Sur le web, rien n'est chargé et aucun achat n'est possible.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const NO_ADS = ["noads", "noads_pack"];

export type BuyResult = "granted" | "pending" | "canceled" | "owned" | "error";

type Billing = {
  /** Application Android avec les prix Google Play chargés. */
  available: boolean;
  price: (productId: string) => string | null;
  /** Produit en cours d'achat. */
  busy: string | null;
  buy: (productId: string) => Promise<void>;
  restore: () => Promise<void>;
  /** Achats vérifiés à créditer dans la sauvegarde. */
  queue: QueuedGrant[];
  settle: (token: string) => void;
  /** Pourquoi des prix manquent (boutons inactifs) : affiché sous le titre de la boutique. Vide sinon. */
  diagnostic: string;
  /** Message court à afficher au joueur (paiement en attente, erreur, restauration). */
  message: string;
  clearMessage: () => void;
};

const BillingContext = createContext<Billing>({
  available: false,
  price: () => null,
  diagnostic: "",
  busy: null,
  buy: async () => {},
  restore: async () => {},
  queue: [],
  settle: () => {},
  message: "",
  clearMessage: () => {},
});

export const useBilling = () => useContext(BillingContext);

const loadPlugin = () =>
  loadNativePlugin(
    () => import("./plugin"),
    (m) => m.PlayBilling,
  );

/** Sans réponse de Google Play passé ce délai, la boutique le signale (les prix restent attendus). */
const PRICES_TIMEOUT_MS = 15_000;

type Verified =
  | { status: "granted"; grant: Grant; adsRemoved: boolean }
  | { status: "pending" | "canceled" | "consumed" | "rejected" };

async function verify(
  productId: string,
  purchaseToken: string,
): Promise<Verified> {
  const response = await fetch(`${API_BASE}/api/play/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, purchaseToken }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`verify-${response.status}`);
  return (await response.json()) as Verified;
}

/** Vérifie un achat de l'appareil et range le résultat. Lève une erreur si le serveur ne répond pas. */
async function settlePurchase(
  purchase: PlayPurchase,
): Promise<Verified["status"] | "skipped"> {
  const productId = purchase.productIds.find((id) => playProduct(id));
  if (!productId) return "skipped";
  if (purchase.state !== "PURCHASED") return "pending";
  const known = readPurchases();
  // Lot déjà crédité ici : inutile de le revérifier (le serveur l'a déjà consommé).
  if (
    known.credited.includes(purchase.purchaseToken) &&
    !NO_ADS.includes(productId)
  )
    return "consumed";
  const result = await verify(productId, purchase.purchaseToken);
  if (result.status === "granted") {
    writePurchases((state) =>
      enqueueGrant(result.adsRemoved ? { ...state, adsRemoved: true } : state, {
        token: purchase.purchaseToken,
        productId,
        grant: result.grant,
      }),
    );
  }
  return result.status;
}

export function BillingProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
  const queue = useSyncExternalStore(
    subscribePurchases,
    () => readPurchases().queue,
    () => EMPTY_QUEUE,
  );
  const native = useRef(false);

  /** Relit les achats de l'appareil et les fait vérifier. `true` si un achat a été restauré. */
  const sync = useCallback(async (): Promise<{
    ok: boolean;
    restored: number;
  }> => {
    const { plugin } = await loadPlugin();
    const { purchases } = await plugin.queryPurchases();
    let ok = true;
    let restored = 0;
    for (const purchase of purchases) {
      try {
        if ((await settlePurchase(purchase)) === "granted") restored += 1;
      } catch {
        ok = false;
      }
    }
    // Plus aucun achat sans publicité chez Google Play (remboursé, annulé) : le droit tombe.
    const ownsNoAds = purchases.some(
      (p) =>
        p.state === "PURCHASED" &&
        p.productIds.some((id) => NO_ADS.includes(id)),
    );
    if (!ownsNoAds)
      writePurchases((state) =>
        state.adsRemoved ? { ...state, adsRemoved: false } : state,
      );
    return { ok, restored };
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    native.current = true;
    let stop = false;
    let remove: (() => void) | undefined;
    let priced = false;
    // Garde-fou : si Google Play ne répond pas (ni prix, ni erreur), la boutique le dit au lieu de rester muette.
    const timeout = setTimeout(() => {
      if (!priced && !stop) setDiagnostic(BILLING_TIMEOUT);
    }, PRICES_TIMEOUT_MS);
    void (async () => {
      try {
        const { plugin } = await loadPlugin();
        const handle = await plugin.addListener(
          "purchaseUpdated",
          (purchase) => {
            // Achat arrivé après coup (paiement en attente devenu payé) : vérifié aussitôt.
            if (purchase.state === "PURCHASED")
              void settlePurchase(purchase).catch(() => {});
          },
        );
        remove = () => void handle.remove();
        if (stop) remove();
        const loaded = await plugin.getProducts({
          productIds: [...PLAY_PRODUCT_IDS],
        });
        priced = true;
        clearTimeout(timeout);
        if (!stop) {
          setPrices(
            Object.fromEntries(
              loaded.products.map((p) => [p.productId, p.formattedPrice]),
            ),
          );
          setDiagnostic(
            describeUnfetched(loaded.unfetched ?? [], loaded.products.length),
          );
        }
        await sync();
      } catch (error) {
        // Avant les prix (plugin absent, Google Play indisponible) : boutons inactifs, cause affichée.
        // Après : serveur de vérification injoignable, achats revérifiés au prochain lancement.
        if (!priced && !stop) setDiagnostic(describeBillingError(error));
        clearTimeout(timeout);
      }
    })();
    return () => {
      stop = true;
      clearTimeout(timeout);
      remove?.();
    };
  }, [sync]);

  const buy = useCallback(
    async (productId: string) => {
      if (!native.current || busy) return;
      setBusy(productId);
      setMessage("");
      try {
        const { plugin } = await loadPlugin();
        const result = await plugin.purchase({ productId });
        if (result.status === "purchased" && result.purchase) {
          const status = await settlePurchase(result.purchase);
          if (status === "pending") setMessage(PENDING);
          else if (status === "granted") {
            if (NO_ADS.includes(productId))
              setMessage("Publicités retirées. Merci pour votre soutien !");
          } else if (status !== "consumed")
            setMessage("Achat refusé par Google Play.");
        } else if (result.status === "pending") setMessage(PENDING);
        else if (result.status === "alreadyOwned") {
          await sync();
          setMessage("Achat déjà effectué : il a été restauré.");
        } else if (result.status === "error")
          setMessage("L’achat n’a pas pu aboutir. Réessayez plus tard.");
      } catch {
        setMessage(
          "Achat payé mais pas encore vérifié : il sera crédité au prochain lancement.",
        );
      } finally {
        setBusy(null);
      }
    },
    [busy, sync],
  );

  const restore = useCallback(async () => {
    if (!native.current || busy) return;
    setBusy("restore");
    try {
      const { ok, restored } = await sync();
      const adsRemoved = readPurchases().adsRemoved;
      setMessage(
        !ok
          ? "Vérification impossible pour le moment. Réessayez plus tard."
          : restored || adsRemoved
            ? "Achats restaurés."
            : "Aucun achat à restaurer sur ce compte Google Play.",
      );
    } catch {
      setMessage("Google Play est indisponible pour le moment.");
    } finally {
      setBusy(null);
    }
  }, [busy, sync]);

  const value = useMemo<Billing>(
    () => ({
      available: Object.keys(prices).length > 0,
      price: (id) => prices[id] ?? null,
      diagnostic,
      busy,
      buy,
      restore,
      queue,
      settle: (token) => writePurchases((state) => settleGrant(state, token)),
      message,
      clearMessage: () => setMessage(""),
    }),
    [prices, diagnostic, busy, buy, restore, queue, message],
  );
  return (
    <BillingContext.Provider value={value}>{children}</BillingContext.Provider>
  );
}

const EMPTY_QUEUE: QueuedGrant[] = [];
const PENDING =
  "Paiement en attente : le contenu arrivera dès sa validation par Google Play.";
