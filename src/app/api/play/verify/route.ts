import { playProduct } from "@/features/billing/products";
import { isPlausiblePurchaseToken } from "@/features/billing/verify";
import { firestoreAttributionStore } from "@/server/attribution-store";
import {
  AdminUnavailableError,
  adminAuth,
  adminDb,
} from "@/server/firebase-admin";
import {
  acknowledgePlayPurchase,
  consumePlayPurchase,
  fetchPlayPurchase,
  PlayUnavailableError,
} from "@/server/google-play";
import { settlePlayPurchase } from "@/server/settle";

/**
 * Règle un achat Google Play présenté par l'application Android (achat, paiement en attente devenu payé,
 * restauration, reprise après coupure). Le serveur relit l'achat chez Google ; pour un contenu à créditer, il
 * crédite la sauvegarde en ligne du joueur et écrit la preuve d'attribution dans une même transaction Firestore,
 * puis seulement consomme ou accuse réception chez Google (src/server/settle.ts, docs/billing.md).
 * Le joueur est identifié par le jeton d'identité Firebase anonyme (en-tête Authorization), vérifié ici.
 * Fichier `.ts` : absent de l'export statique Android, qui ne garde que les `.tsx` (next.config.ts, `pageExtensions`).
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
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
    const uid = await playerOf(request);
    if (uid === false) return reply(request, { error: "authRequired" }, 401);
    const result = await settlePlayPurchase(
      {
        play: {
          fetch: fetchPlayPurchase,
          consume: consumePlayPurchase,
          acknowledge: acknowledgePlayPurchase,
        },
        // Firestore Admin ouvert seulement si un contenu est à créditer (« sans publicité » simple : jamais).
        store: {
          attribute: (...args) =>
            firestoreAttributionStore(adminDb()).attribute(...args),
          finalized: (id) => firestoreAttributionStore(adminDb()).finalized(id),
        },
      },
      { product, token, uid },
    );
    if ("error" in result)
      return reply(
        request,
        result,
        result.error === "authRequired" ? 401 : 409,
      );
    return reply(request, result);
  } catch (error) {
    // Jamais le jeton ni la clé dans les journaux : seulement la cause.
    console.error(
      "play-verify",
      error instanceof PlayUnavailableError ||
        error instanceof AdminUnavailableError
        ? error.message
        : "unknown",
    );
    return reply(request, { error: "unavailable" }, 503);
  }
}

/** Identité anonyme vérifiée ; null sans en-tête ; false si le jeton est invalide ou expiré. */
async function playerOf(request: Request): Promise<string | null | false> {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer ([A-Za-z0-9._-]{20,4096})$/.exec(header);
  if (!match) return false;
  try {
    const decoded = await adminAuth().verifyIdToken(match[1]);
    return decoded.uid;
  } catch (error) {
    if (error instanceof AdminUnavailableError) throw error;
    return false;
  }
}

export function OPTIONS(request: Request): Response {
  const headers = cors(request);
  if (!headers["Access-Control-Allow-Origin"])
    return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers });
}
