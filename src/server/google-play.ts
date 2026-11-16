import { createSign } from "node:crypto";
import type { PlayProductPurchase } from "../features/billing/verify";

/**
 * API Google Play Developer (v3), en REST, côté serveur uniquement (route /api/play/verify sur Vercel).
 * Aucune dépendance : le jeton OAuth du compte de service est signé avec `node:crypto`.
 * Variables du serveur, jamais dans l'application :
 * - `GOOGLE_PLAY_CLIENT_EMAIL`, `GOOGLE_PLAY_PRIVATE_KEY` : compte de service invité dans la Play Console
 *   (droits « Afficher les données financières » et « Gérer les commandes »).
 * Voir docs/billing.md.
 */
export const PLAY_PACKAGE = "fr.javachrist.cubelyo";

const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PLAY_PACKAGE}`;

/** Configuration absente ou Google injoignable : réponse 503, détail seulement dans les journaux. */
export class PlayUnavailableError extends Error {}

const base64url = (input: string): string =>
  Buffer.from(input).toString("base64url");

let cached: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const email = process.env.GOOGLE_PLAY_CLIENT_EMAIL;
  const key = process.env.GOOGLE_PLAY_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) throw new PlayUnavailableError("config");
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: email,
      scope: "https://www.googleapis.com/auth/androidpublisher",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  let signature: string;
  try {
    signature = createSign("RSA-SHA256")
      .update(`${header}.${claims}`)
      .sign(key, "base64url");
  } catch {
    throw new PlayUnavailableError("private-key");
  }
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
    cache: "no-store",
  }).catch(() => {
    throw new PlayUnavailableError("oauth-network");
  });
  if (!response.ok) throw new PlayUnavailableError(`oauth-${response.status}`);
  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!data.access_token) throw new PlayUnavailableError("oauth-token");
  cached = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return data.access_token;
}

async function call(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await accessToken();
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  }).catch(() => {
    throw new PlayUnavailableError("play-network");
  });
}

const purchasePath = (productId: string, token: string) =>
  `/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(token)}`;

/** Relevé officiel d'un achat. `null` quand Google ne connaît pas ce jeton pour ce produit. */
export async function fetchPlayPurchase(
  productId: string,
  token: string,
): Promise<PlayProductPurchase | null> {
  const response = await call(purchasePath(productId, token));
  if (
    response.status === 400 ||
    response.status === 404 ||
    response.status === 410
  )
    return null;
  if (!response.ok) throw new PlayUnavailableError(`get-${response.status}`);
  return (await response.json()) as PlayProductPurchase;
}

/** Consomme un lot (pièces, packs) : il pourra être racheté, et ne sera plus jamais crédité. */
export async function consumePlayPurchase(
  productId: string,
  token: string,
): Promise<void> {
  const response = await call(`${purchasePath(productId, token)}:consume`, {
    method: "POST",
  });
  if (!response.ok)
    throw new PlayUnavailableError(`consume-${response.status}`);
}

/** Accuse réception d'un achat définitif (sans accusé sous 3 jours, Google rembourse). */
export async function acknowledgePlayPurchase(
  productId: string,
  token: string,
): Promise<void> {
  const response = await call(`${purchasePath(productId, token)}:acknowledge`, {
    method: "POST",
    body: "{}",
  });
  if (!response.ok)
    throw new PlayUnavailableError(`acknowledge-${response.status}`);
}
