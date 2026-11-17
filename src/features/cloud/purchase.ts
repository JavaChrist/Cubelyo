import { CLOUD_ENABLED } from "./config";
import { CLOUD_OPTOUT_KEY, activeSync } from "./sync";

/**
 * Contexte d'un achat à créditer : le serveur crédite la sauvegarde en ligne du joueur
 * (identité anonyme Firebase), jamais la seule copie locale. Il faut donc une sauvegarde en ligne
 * active, à jour et sans conflit avant de demander le crédit.
 */
export class CloudRequiredError extends Error {}

export type PurchaseSession = {
  /** Jeton d'identité Firebase (vérifié par le serveur), jamais conservé. */
  idToken: string;
  flush: () => Promise<boolean>;
  /** Relit la sauvegarde et reporte localement le crédit du serveur. */
  pull: () => Promise<void>;
};

/** Attente maximale de la synchronisation au lancement (connexion lente). */
const WAIT_MS = 20_000;

export async function purchaseSession(): Promise<PurchaseSession> {
  if (!CLOUD_ENABLED) throw new CloudRequiredError("cloud-disabled");
  if (localStorage.getItem(CLOUD_OPTOUT_KEY) === "true")
    throw new CloudRequiredError("cloud-paused");
  const sync = await activeSync(WAIT_MS);
  if (!sync) throw new CloudRequiredError("cloud-unavailable");
  if (!(await sync.flush())) throw new CloudRequiredError("cloud-not-synced");
  const { firebaseClient } = await import("./firebase");
  const user = (await firebaseClient(false))?.auth.currentUser;
  if (!user) throw new CloudRequiredError("cloud-identity");
  return {
    idToken: await user.getIdToken(),
    flush: () => sync.flush(),
    pull: () => sync.pull(),
  };
}

/** Vérification rapide avant d'ouvrir le paiement Google Play (sans attendre la synchronisation). */
export const cloudReady = () =>
  CLOUD_ENABLED && localStorage.getItem(CLOUD_OPTOUT_KEY) !== "true";
