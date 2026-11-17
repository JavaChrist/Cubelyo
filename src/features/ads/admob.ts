import { Capacitor } from "@capacitor/core";
import type { AdMobPlugin } from "@capacitor-community/admob";
import { isAllowedAdUnit, type AdRequestSettings } from "./rules";

/**
 * Accès au SDK Google Mobile Ads et à UMP, par le plugin Capacitor (voir `docs/admob.md`).
 * Seule l'application Android le charge : sur le web, aucun module AdMob n'est téléchargé.
 * Les décisions (droits, âge, consentement) sont prises par `./rules`, jamais ici.
 */

/** Pour tester le formulaire de consentement hors d'Europe : `NEXT_PUBLIC_ADS_DEBUG_EEA=1` au build. */
const DEBUG_EEA = process.env.NEXT_PUBLIC_ADS_DEBUG_EEA === "1";

export const isNativeApp = (): boolean => Capacitor.isNativePlatform();

type AdMobModule = typeof import("@capacitor-community/admob");
let plugin: Promise<{ AdMob: AdMobPlugin; module: AdMobModule }> | null = null;

function load() {
  plugin ??= import("@capacitor-community/admob").then((module) => ({
    AdMob: module.AdMob,
    module,
  }));
  return plugin;
}

/**
 * Initialise le SDK pour un adulte déclaré, avec la classification G, avant toute requête.
 * Le plugin passe ces réglages à `MobileAds.setRequestConfiguration` ; TFCD et TFUA restent non précisés.
 */
export async function applyRequestSettings(
  settings: AdRequestSettings,
  testDevices: string[],
): Promise<void> {
  const { AdMob, module } = await load();
  await AdMob.initialize({
    maxAdContentRating: module.MaxAdContentRating[settings.maxAdContentRating],
    // Le plugin ne déclare les appareils de test que si `initializeForTesting` est vrai.
    initializeForTesting: testDevices.length > 0,
    testingDevices: testDevices,
  });
}

export interface ConsentState {
  canRequestAds: boolean;
  /** Le bouton « Choix publicitaires » doit être proposé. */
  privacyOptionsRequired: boolean;
}

/** Consentement UMP d'un adulte : met à jour l'état, puis affiche le formulaire s'il est demandé. */
export async function gatherConsent(): Promise<ConsentState> {
  const { AdMob, module } = await load();
  let info = await AdMob.requestConsentInfo({
    ...(DEBUG_EEA
      ? { debugGeography: module.AdmobConsentDebugGeography.EEA }
      : {}),
  });
  if (
    info.isConsentFormAvailable &&
    info.status === module.AdmobConsentStatus.REQUIRED
  )
    info = await AdMob.showConsentForm();
  return {
    canRequestAds: info.canRequestAds,
    privacyOptionsRequired:
      info.privacyOptionsRequirementStatus === "REQUIRED",
  };
}

/** Formulaire « Choix publicitaires » de Google, puis l'état du consentement relu. */
export async function showPrivacyOptions(): Promise<ConsentState> {
  const { AdMob } = await load();
  await AdMob.showPrivacyOptionsForm();
  return gatherConsent();
}

export interface BannerListeners {
  /** Hauteur affichée, en dp, égale aux pixels CSS de la WebView. */
  onHeight: (height: number) => void;
  onFailed: () => void;
}

export async function listenBanner(
  listeners: BannerListeners,
): Promise<() => void> {
  const { AdMob, module } = await load();
  const handles = await Promise.all([
    AdMob.addListener(module.BannerAdPluginEvents.SizeChanged, (size) =>
      listeners.onHeight(size.height),
    ),
    AdMob.addListener(module.BannerAdPluginEvents.FailedToLoad, () =>
      listeners.onFailed(),
    ),
  ]);
  return () => handles.forEach((handle) => void handle.remove());
}

/**
 * Bannière adaptative collée au bas de l'écran ; la barre de navigation de Cubelyo remonte de sa hauteur.
 * `testing` (mode `test`) : le plugin remplace le bloc par le bloc de test de Google, aucune annonce réelle.
 * En `live`, les appareils de `testDevices` gardent le bloc réel mais reçoivent des annonces de test.
 */
export async function showBanner(
  adUnitId: string,
  settings: AdRequestSettings,
  testing: boolean,
): Promise<void> {
  // Double sécurité : la configuration est déjà contrôlée par les tests et par Gradle.
  if (!isAllowedAdUnit(adUnitId))
    throw new Error("Bloc de bannière non autorisé");
  const { AdMob, module } = await load();
  await AdMob.showBanner({
    adId: adUnitId,
    adSize: module.BannerAdSize.ADAPTIVE_BANNER,
    position: module.BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    npa: settings.nonPersonalized,
    isTesting: testing,
  });
}

/** Retire la bannière. Sans bannière affichée, le plugin refuse : ce n'est pas une erreur. */
export async function removeBanner(): Promise<void> {
  const { AdMob } = await load();
  await AdMob.removeBanner().catch(() => undefined);
}

/** Masque la bannière sans la détruire : aucune nouvelle requête à la reprise. */
export async function hideBanner(): Promise<void> {
  const { AdMob } = await load();
  await AdMob.hideBanner();
}

export async function resumeBanner(): Promise<void> {
  const { AdMob } = await load();
  await AdMob.resumeBanner();
}
