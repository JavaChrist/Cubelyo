/**
 * Audit mensuel des sauvegardes en ligne inactives (lecture seule, aucune suppression).
 * Règle validée : 12 mois sans activité. Une sauvegarde est « inactive » seulement si :
 * - sa dernière écriture (`updatedAt`, horodatage serveur) a plus de 12 mois ;
 * - ET l'identité anonyme n'a renouvelé aucun jeton depuis 12 mois (`lastRefreshTime`,
 *   sinon `lastSignInTime`, sinon `creationTime`). Le jeton est renouvelé par le SDK
 *   à l'usage de l'application quand la sauvegarde en ligne est active (au plus une fois par heure).
 * Le rapport ne contient que des nombres : ni UID, ni contenu de sauvegarde.
 * Les preuves d'achat (`playPurchases`) ne sont pas concernées : conservation traitée à part.
 */
export const INACTIVE_MONTHS = 12;

export type AuditSave = { uid: string; updatedAt: Date | null; purchases: number };
export type AuditUser = {
  uid: string;
  creationTime: string;
  lastSignInTime?: string | null;
  lastRefreshTime?: string | null;
};

export type AuditReport = {
  generatedAt: string;
  threshold: string;
  saves: number;
  identities: number;
  /** Sauvegardes qui seraient proposées à la purge (après validation manuelle). */
  inactive: number;
  /** Parmi elles, sauvegardes contenant des achats crédités (contenu payé perdu en cas de purge). */
  inactiveWithPurchases: number;
  /** Sauvegardes dont l'identité n'existe plus (inaccessibles au joueur). */
  orphanSaves: number;
  /** Sauvegardes sans `updatedAt` lisible : jamais classées inactives. */
  undated: number;
  /** Ancienneté de la dernière écriture, par tranche. */
  ageBuckets: Record<"<3m" | "3-6m" | "6-12m" | "12-24m" | ">24m", number>;
};

const monthsBefore = (now: Date, months: number) => {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d;
};

/** Dernière activité connue de l'identité (renouvellement de jeton, sinon connexion, sinon création). */
export function lastActivity(user: AuditUser): Date | null {
  for (const value of [user.lastRefreshTime, user.lastSignInTime, user.creationTime]) {
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

export function auditReport(
  saves: AuditSave[],
  users: AuditUser[],
  now = new Date(),
): AuditReport {
  const threshold = monthsBefore(now, INACTIVE_MONTHS);
  const byUid = new Map(users.map((u) => [u.uid, u]));
  const buckets: AuditReport["ageBuckets"] = {
    "<3m": 0,
    "3-6m": 0,
    "6-12m": 0,
    "12-24m": 0,
    ">24m": 0,
  };
  let inactive = 0;
  let inactiveWithPurchases = 0;
  let orphanSaves = 0;
  let undated = 0;
  for (const save of saves) {
    const user = byUid.get(save.uid);
    if (!user) orphanSaves += 1;
    if (!save.updatedAt) {
      undated += 1;
      continue;
    }
    const t = save.updatedAt.getTime();
    if (t >= monthsBefore(now, 3).getTime()) buckets["<3m"] += 1;
    else if (t >= monthsBefore(now, 6).getTime()) buckets["3-6m"] += 1;
    else if (t >= threshold.getTime()) buckets["6-12m"] += 1;
    else if (t >= monthsBefore(now, 24).getTime()) buckets["12-24m"] += 1;
    else buckets[">24m"] += 1;
    if (t >= threshold.getTime()) continue;
    const active = user ? lastActivity(user) : null;
    if (active && active.getTime() >= threshold.getTime()) continue;
    inactive += 1;
    if (save.purchases > 0) inactiveWithPurchases += 1;
  }
  return {
    generatedAt: now.toISOString(),
    threshold: threshold.toISOString(),
    saves: saves.length,
    identities: users.length,
    inactive,
    inactiveWithPurchases,
    orphanSaves,
    undated,
    ageBuckets: buckets,
  };
}
