/**
 * Charge un plugin Capacitor depuis un module importé à la demande, rangé dans un objet.
 * Le plugin est un Proxy qui répond à toute propriété, `then` compris : renvoyé seul depuis une promesse,
 * JavaScript le prend pour une promesse, appelle la méthode native « then » inexistante et l'`await`
 * ne se termine jamais (boutique sans prix et sans erreur, version 0.17.0).
 */
export function loadNativePlugin<M, P>(
  load: () => Promise<M>,
  pick: (module: M) => P,
): Promise<{ plugin: P }> {
  return load().then((module) => ({ plugin: pick(module) }));
}
