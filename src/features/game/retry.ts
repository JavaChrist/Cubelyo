/** Dernière flèche bloquée et état du cube à ce moment-là. */
export type LastBlock = { index: number; id: string; removed: number };

/**
 * Réessayer une flèche déjà rouge sans avoir rien changé au cube ne coûte pas de cœur :
 * même niveau, même flèche, aucune flèche sortie (ni effacée) depuis le blocage.
 */
export function isFreeRetry(
  last: LastBlock | null,
  session: { index: number; removed: string[]; blocked: string[] },
  id: string,
) {
  return (
    !!last &&
    last.index === session.index &&
    last.id === id &&
    last.removed === session.removed.length &&
    session.blocked.includes(id)
  );
}
