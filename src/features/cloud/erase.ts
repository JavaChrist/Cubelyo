/** Échec d'effacement explicite : jamais de blocage indéfini ni de faux succès. */
export type EraseFailure = "offline" | "timeout" | "failed";
export class EraseError extends Error {
  constructor(readonly reason: EraseFailure) {
    super(`erase/${reason}`);
  }
}
/** Délai maximal de la suppression en ligne (sauvegarde puis identité anonyme). */
export const ERASE_TIMEOUT_MS = 15000;

/** Rejette avec EraseError("timeout") si l'opération dépasse le délai. */
export function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limit = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new EraseError("timeout")), ms);
  });
  return Promise.race([work, limit]).finally(() => clearTimeout(timer));
}

export function eraseFailureMessage(error: unknown): string {
  const reason = error instanceof EraseError ? error.reason : "failed";
  if (reason === "offline")
    return "Aucune connexion : rien n’a été effacé, ni sur cet appareil ni en ligne. Connectez-vous à Internet puis réessayez.";
  if (reason === "timeout")
    return "Le serveur n’a pas répondu à temps : l’effacement n’est pas confirmé. La copie locale est conservée et la synchronisation reste suspendue. Réessayez une fois connecté, ou contactez support@javachrist.fr.";
  return "Effacement non terminé. La copie locale est conservée ; la synchronisation reste suspendue. Réessayez ou contactez support@javachrist.fr.";
}
