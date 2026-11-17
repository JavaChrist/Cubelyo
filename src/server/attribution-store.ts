import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { creditProfile } from "../features/billing/attribution";
import { decodeProfile } from "../features/progression/profile";
import type { AttributionStore } from "./settle";

/**
 * Registre des achats attribués : `playPurchases/{empreinte du jeton}`, illisible par l'application
 * (règles Firestore : tout ce qui n'est pas la sauvegarde est refusé). Contenu : identifiant anonyme du joueur,
 * produit, contenu crédité, dates d'attribution et de finalisation Google. Ni jeton, ni paiement, ni coordonnée.
 */
export const REGISTRY = "playPurchases";
const MAX_PROFILE = 250000;

export function firestoreAttributionStore(db: Firestore): AttributionStore {
  return {
    attribute: (id, uid, entry) =>
      db.runTransaction(async (tx) => {
        const proofRef = db.collection(REGISTRY).doc(id);
        const saveRef = db.doc(`players/${uid}/saves/prototype`);
        // Lectures avant toute écriture (règle des transactions Firestore).
        const [proof, save] = await Promise.all([
          tx.get(proofRef),
          tx.get(saveRef),
        ]);
        if (proof.exists) return "exists";
        if (!save.exists) return "saveRequired";
        const data = save.data()!;
        if (
          data.schema !== 1 ||
          typeof data.profile !== "string" ||
          !Number.isSafeInteger(data.revision) ||
          !decodeProfile(data.profile)
        )
          throw new Error("attribution/invalid-save");
        const profile = creditProfile(data.profile, entry);
        if (profile.length > MAX_PROFILE || !decodeProfile(profile))
          throw new Error("attribution/invalid-credit");
        tx.set(saveRef, {
          schema: 1,
          profile,
          revision: (data.revision as number) + 1,
          updatedAt: FieldValue.serverTimestamp(),
        });
        tx.create(proofRef, {
          uid,
          productId: entry.product,
          grant: entry.grant,
          attributedAt: FieldValue.serverTimestamp(),
          finalizedAt: null,
        });
        return "credited";
      }),
    async finalized(id) {
      await db
        .collection(REGISTRY)
        .doc(id)
        .update({ finalizedAt: FieldValue.serverTimestamp() });
    },
  };
}
