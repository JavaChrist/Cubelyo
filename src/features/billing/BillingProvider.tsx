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
import { PLAY_PRODUCT_IDS, playProduct } from "./products";
import type { PlayPurchase } from "./plugin";
import {
  BILLING_TIMEOUT,
  describeBillingError,
  describeUnfetched,
} from "./diagnostic";
import { createInFlight } from "./inflight";
import { loadNativePlugin } from "./loader";
import { hasGrant } from "./attribution";
import {
  CloudRequiredError,
  cloudReady,
  purchaseSession,
} from "../cloud/purchase";
import {
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
 * 3. Contenu (pièces, bonus) : crédité par le serveur dans la sauvegarde en ligne, avec la preuve d'attribution,
 *    puis reporté sur l'appareil par la synchronisation (carte de récompense). Sauvegarde en ligne obligatoire.
 *    La file locale `cubelyo.purchases.v1` ne sert plus qu'aux achats vérifiés par les versions précédentes.
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
  | { status: "granted"; adsRemoved: boolean; credited: boolean }
  | { status: "pending" | "canceled" | "consumed" | "rejected" };

/** Réponse du serveur sans crédit possible pour l'instant (identité ou sauvegarde en ligne manquante). */
class VerifyError extends Error {
  constructor(readonly status: number) {
    super(`verify-${status}`);
  }
}

async function verify(
  productId: string,
  purchaseToken: string,
  idToken?: string,
): Promise<Verified> {
  const response = await fetch(`${API_BASE}/api/play/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ productId, purchaseToken }),
    cache: "no-store",
  });
  if (!response.ok) throw new VerifyError(response.status);
  return (await response.json()) as Verified;
}

type Settled = Verified["status"] | "skipped";
const shareVerification = createInFlight<Settled>();

/**
 * Vérifie un achat de l'appareil. Lève une erreur si le crédit n'a pas pu être enregistré :
 * l'achat reste alors ouvert chez Google Play et sera repris au prochain lancement ou « Restaurer ».
 * Un même achat (même jeton) n'est vérifié qu'une fois à la fois : voir inflight.ts.
 */
const settlePurchase = (purchase: PlayPurchase): Promise<Settled> =>
  shareVerification(purchase.purchaseToken, () => settleOnce(purchase));

/**
 * Achat avec contenu (pièces, bonus) : le serveur crédite la sauvegarde en ligne et enregistre la preuve
 * d'attribution dans la même transaction, puis finalise l'achat chez Google. L'application reporte ensuite
 * le crédit depuis la sauvegarde (une fois par achat, voir cloud/sync.ts). Aucun crédit purement local.
 */
async function settleOnce(purchase: PlayPurchase): Promise<Settled> {
  const productId = purchase.productIds.find((id) => playProduct(id));
  const product = productId ? playProduct(productId) : undefined;
  if (!productId || !product) return "skipped";
  if (purchase.state !== "PURCHASED") return "pending";
  const token = purchase.purchaseToken;
  let result: Verified;
  if (!hasGrant(product.grant)) result = await verify(productId, token);
  else {
    const session = await purchaseSession();
    try {
      result = await verify(productId, token, session.idToken);
    } catch (error) {
      // Sauvegarde en ligne pas encore créée côté serveur : envoi, puis un seul nouvel essai.
      if (!(error instanceof VerifyError) || error.status !== 409) throw error;
      if (!(await session.flush())) throw error;
      result = await verify(productId, token, session.idToken);
    }
    if (result.status === "granted" || result.status === "consumed")
      await session.pull();
  }
  if (result.status === "granted" && result.adsRemoved)
    writePurchases((state) =>
      state.adsRemoved ? state : { ...state, adsRemoved: true },
    );
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
      const product = playProduct(productId);
      if (product && hasGrant(product.grant) && !cloudReady()) {
        setMessage(CLOUD_NEEDED);
        return;
      }
      setBusy(productId);
      setMessage("");
      let paid = false;
      try {
        const { plugin } = await loadPlugin();
        const result = await plugin.purchase({ productId });
        if (result.status === "purchased" && result.purchase) {
          paid = true;
          const status = await settlePurchase(result.purchase);
          // Achat crédité : la récompense (ou la disparition des publicités) suffit, aucun message.
          if (status === "pending") setMessage(PENDING);
          else if (status !== "granted" && status !== "consumed")
            setMessage("Achat refusé par Google Play.");
        } else if (result.status === "pending") setMessage(PENDING);
        else if (result.status === "alreadyOwned") {
          await sync();
          setMessage("Achat déjà effectué : il a été restauré.");
        } else if (result.status === "error")
          setMessage("L’achat n’a pas pu aboutir. Réessayez plus tard.");
      } catch (error) {
        setMessage(
          !paid
            ? "L’achat n’a pas pu aboutir. Réessayez plus tard."
            : error instanceof CloudRequiredError
              ? "Achat payé, en attente de la sauvegarde en ligne : il sera crédité dès qu’elle sera disponible (Réglages, ou au prochain lancement)."
              : "Achat payé mais pas encore crédité : il le sera au prochain lancement ou avec « Restaurer les achats ».",
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
const CLOUD_NEEDED =
  "Les pièces et bonus achetés sont enregistrés dans votre sauvegarde en ligne : activez-la dans les Réglages avant l’achat.";
const PENDING =
  "Paiement en attente : le contenu arrivera dès sa validation par Google Play.";
