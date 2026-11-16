import { playProduct } from "@/features/billing/products";
import {
  decidePlayPurchase,
  isPlausiblePurchaseToken,
} from "@/features/billing/verify";
import {
  acknowledgePlayPurchase,
  consumePlayPurchase,
  fetchPlayPurchase,
  PlayUnavailableError,
} from "@/server/google-play";

/**
 * Vérifie un achat Google Play présenté par l'application Android (achat, paiement en attente devenu payé,
 * restauration). Le serveur relit l'achat chez Google, consomme les lots ou accuse réception des achats
 * « sans publicité », puis dit au jeu quoi créditer. Aucune donnée n'est conservée. Voir docs/billing.md.
 * Fichier `.server.ts` : absent de l'export statique Android (next.config.ts, `pageExtensions`).
 */
export const dynamic = "force-dynamic";

// Origines de l'application Capacitor (androidScheme https, hôte localhost).
const APP_ORIGINS = ["https://localhost", "capacitor://localhost"];
const noStore = { "Cache-Control": "no-store" };

function cors(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  if (!origin || !APP_ORIGINS.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

const reply = (request: Request, body: unknown, status = 200) =>
  Response.json(body, { status, headers: { ...noStore, ...cors(request) } });

export async function POST(request: Request): Promise<Response> {
  let body: { productId?: unknown; purchaseToken?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return reply(request, { error: "invalidRequest" }, 400);
  }
  const product = playProduct(body?.productId);
  const token = body?.purchaseToken;
  if (!product || !isPlausiblePurchaseToken(token))
    return reply(request, { error: "invalidRequest" }, 400);
  try {
    const purchase = await fetchPlayPurchase(product.id, token);
    if (!purchase) return reply(request, { status: "rejected" });
    const decision = decidePlayPurchase(product, purchase);
    if (decision.status !== "granted")
      return reply(request, { status: decision.status });
    if (decision.finish === "consume")
      await consumePlayPurchase(product.id, token);
    if (decision.finish === "acknowledge")
      await acknowledgePlayPurchase(product.id, token);
    return reply(request, {
      status: "granted",
      grant: decision.grant,
      adsRemoved: decision.adsRemoved,
    });
  } catch (error) {
    // Jamais le jeton ni la clé dans les journaux : seulement la cause.
    console.error(
      "play-verify",
      error instanceof PlayUnavailableError ? error.message : "unknown",
    );
    return reply(request, { error: "unavailable" }, 503);
  }
}

export function OPTIONS(request: Request): Response {
  const headers = cors(request);
  if (!headers["Access-Control-Allow-Origin"])
    return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers });
}
