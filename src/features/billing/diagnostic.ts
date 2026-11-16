import type { UnfetchedReason } from "./plugin";

/**
 * Ligne de diagnostic affichée dans la boutique quand des prix Google Play manquent
 * (les boutons de ces produits restent alors inactifs). Vide quand tout est chargé.
 */
const REASONS: Record<UnfetchedReason, [string, string]> = {
  notFound: ["introuvable", "introuvables"],
  noOffer: ["sans offre active", "sans offre active"],
  invalidId: ["à l’identifiant refusé", "à l’identifiant refusé"],
  unknown: ["non chargé", "non chargés"],
};

/** Codes BillingResponseCode courants (call.reject du plugin : `billing_<code>`). */
const BILLING_ERRORS: Record<string, string> = {
  "-1": "service déconnecté",
  "2": "service indisponible (réseau)",
  "3": "facturation indisponible sur cet appareil ou ce compte",
  "5": "application non reconnue (installer depuis le Play Store)",
  "6": "erreur Google Play",
  "12": "erreur réseau",
};

/** Aucune réponse de Google Play (ni prix, ni erreur) passé le délai de BillingProvider. */
export const BILLING_TIMEOUT = "Google Play : pas de réponse";

export function describeUnfetched(
  unfetched: { productId: string; reason: UnfetchedReason }[],
  loaded: number,
): string {
  if (!unfetched.length)
    return loaded ? "" : "Google Play : aucun produit renvoyé";
  const counts = new Map<UnfetchedReason, number>();
  for (const { reason } of unfetched)
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  const parts = [...counts].map(
    ([reason, n]) =>
      `${n} produit${n > 1 ? "s" : ""} ${REASONS[reason][n > 1 ? 1 : 0]}`,
  );
  return `Google Play : ${parts.join(", ")}`;
}

export function describeBillingError(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  if (code === "UNIMPLEMENTED")
    return "Google Play : module d’achat absent de cette version";
  const billing = /^billing_(-?\d+)$/.exec(code)?.[1];
  if (billing !== undefined)
    return `Google Play : ${BILLING_ERRORS[billing] ?? "erreur"} (code ${billing})`;
  return "Google Play : connexion impossible";
}
