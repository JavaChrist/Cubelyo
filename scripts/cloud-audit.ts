/**
 * Audit mensuel en LECTURE SEULE des sauvegardes en ligne (docs/legal-open-questions.md, section 5).
 * N'écrit, ne modifie et ne supprime rien : ni sauvegarde, ni identité, ni preuve d'achat.
 * Affiche uniquement des nombres (aucun UID). La purge éventuelle est une décision manuelle séparée.
 *
 * Utilisation : variables FIREBASE_ADMIN_* dans l'environnement du terminal (jamais dans le dépôt), puis
 *   npm run cloud:audit
 * Avec les émulateurs : FIRESTORE_EMULATOR_HOST et FIREBASE_AUTH_EMULATOR_HOST, projet demo-*.
 */
import { adminAuth, adminDb } from "../src/server/firebase-admin";
import { auditReport, type AuditSave, type AuditUser } from "../src/server/audit";
import { entriesOf } from "../src/features/billing/attribution";

async function main() {
  const users: AuditUser[] = [];
  let pageToken: string | undefined;
  do {
    const page = await adminAuth().listUsers(1000, pageToken);
    for (const u of page.users)
      users.push({
        uid: u.uid,
        creationTime: u.metadata.creationTime,
        lastSignInTime: u.metadata.lastSignInTime,
        lastRefreshTime: u.metadata.lastRefreshTime,
      });
    pageToken = page.pageToken;
  } while (pageToken);

  const saves: AuditSave[] = [];
  const snapshot = await adminDb().collectionGroup("saves").get();
  for (const doc of snapshot.docs) {
    const uid = doc.ref.parent.parent?.id;
    if (!uid || doc.id !== "prototype") continue;
    const updatedAt = doc.get("updatedAt");
    let purchases = 0;
    try {
      purchases = entriesOf(String(doc.get("profile"))).length;
    } catch {}
    saves.push({
      uid,
      updatedAt: typeof updatedAt?.toDate === "function" ? updatedAt.toDate() : null,
      purchases,
    });
  }
  console.log(JSON.stringify(auditReport(saves, users), null, 2));
}

main().catch((error) => {
  console.error("cloud-audit:", error instanceof Error ? error.message : "unknown");
  process.exit(1);
});
