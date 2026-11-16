/**
 * Une seule exécution à la fois par clé : un second appel pendant la première reçoit la même promesse.
 * Google Play signale un achat deux fois (écouteur `purchaseUpdated` et réponse de `purchase`) : sans ce
 * partage, deux vérifications partaient ensemble, la seconde échouait sur la consommation déjà faite
 * et affichait « Achat payé mais pas encore vérifié » alors que les pièces étaient créditées.
 */
export function createInFlight<T>() {
  const running = new Map<string, Promise<T>>();
  return (key: string, run: () => Promise<T>): Promise<T> => {
    const current = running.get(key);
    if (current) return current;
    const next = run().finally(() => running.delete(key));
    running.set(key, next);
    return next;
  };
}
