/**
 * Bannière Google AdMob de l'application Android (voir `docs/admob.md`). Sans React, Capacitor ni AdMob :
 * ce module décide seulement si une annonce peut être demandée, et avec quels réglages.
 *
 * Deux publics :
 * - `adult` : l'appareil a répondu « 18 ans ou plus » à la question neutre (voir `docs/promotions.md`). Consentement UMP.
 * - `restricted` : mineur ou âge inconnu. Annonces destinées aux enfants, non personnalisées, classification G,
 *   aucun identifiant publicitaire transmis. Aucun formulaire UMP.
 */
import type { AdultAnswer } from "../promotions/rules";

/** Éditeur de démonstration de Google. */
export const ADMOB_DEMO_PUBLISHER = "ca-app-pub-3940256099942544";
/** Éditeur AdMob de JavaChrist (`pub-…` de `public/app-ads.txt`). */
export const ADMOB_JAVACHRIST_PUBLISHER = "ca-app-pub-8288172940135426";
/** Seuls éditeurs acceptés par les tests, Gradle et le service AdMob. */
export const ADMOB_ALLOWED_PUBLISHERS = [
  ADMOB_DEMO_PUBLISHER,
  ADMOB_JAVACHRIST_PUBLISHER,
] as const;
export const ADMOB_DEMO_ANDROID_APP_ID = `${ADMOB_DEMO_PUBLISHER}~3347511713`;
/** Bloc de bannière adaptative de démonstration, Android. */
export const ADMOB_DEMO_ANDROID_BANNER = `${ADMOB_DEMO_PUBLISHER}/9214589741`;

/** Contenu de `src/features/ads/ads.json`, lu aussi par `android/app/build.gradle`. */
export interface AdsConfig {
  /** `test` : annonces de test uniquement. `live` : annonces réelles (après validation de Christian). */
  mode: "test" | "live";
  androidAppId: string;
  androidBannerAdUnitId: string;
  /** Appareils de développement : annonces de test même en `live` (32 caractères hexadécimaux majuscules). */
  testDevices: string[];
}

export const ADS_RULES = {
  /** Après un échec de chargement, nouvel essai au plus tôt après ce délai. */
  retryAfterMs: 60_000,
} as const;

export type AdAudience = "adult" | "restricted";

/** Seule une réponse « adulte » explicite ouvre le consentement UMP. Mineur, « plus tard » ou effacé : restreint. */
export const adAudience = (adult: AdultAnswer): AdAudience =>
  adult === "adult" ? "adult" : "restricted";

/** Réglages appliqués au SDK avant toute requête (`MobileAds.setRequestConfiguration`). */
export interface AdRequestSettings {
  tagForChildDirectedTreatment: boolean;
  tagForUnderAgeOfConsent: boolean;
  /** Classification maximale : G, le jeu s'adresse à tous. */
  maxAdContentRating: "General";
  /** Annonces non personnalisées demandées explicitement (`npa=1`). */
  nonPersonalized: boolean;
  /** `ump` : formulaire de consentement Google ; `skip` : aucun appel UMP. */
  consent: "ump" | "skip";
}

export function requestSettingsFor(audience: AdAudience): AdRequestSettings {
  if (audience === "adult")
    // La personnalisation dépend alors du seul choix fait dans le formulaire UMP (chaîne TCF lue par le SDK).
    return {
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
      maxAdContentRating: "General",
      nonPersonalized: false,
      consent: "ump",
    };
  // TFCD et TFUA empêchent la transmission de l'identifiant publicitaire et la publicité personnalisée.
  return {
    tagForChildDirectedTreatment: true,
    tagForUnderAgeOfConsent: true,
    maxAdContentRating: "General",
    nonPersonalized: true,
    consent: "skip",
  };
}

export interface AdsAccess {
  /** Configuration AdMob valide (`adsConfigErrors` vide). */
  configured: boolean;
  /** Application Android (Capacitor). Jamais d'AdMob sur le web. */
  native: boolean;
  /** Droits connus : aucune requête tant qu'ils se chargent. */
  entitlementsReady: boolean;
  /** Achat « Sans publicité » ou « Pack sans publicité ». */
  adsRemoved: boolean;
  /** Option de build réservée aux tests (`NEXT_PUBLIC_ADS_TEST_NO_ADS=1`) : ne peut que retirer les annonces. */
  forceNoAds: boolean;
}

/** Vrai seulement si une annonce peut être demandée. Dans le doute, aucune annonce. */
export const adsAllowed = (access: AdsAccess): boolean =>
  access.configured &&
  access.native &&
  access.entitlementsReady &&
  !access.adsRemoved &&
  !access.forceNoAds;

export interface ConsentResult {
  canRequestAds: boolean;
}

/**
 * Une annonce ne part que si tout est réuni : droits, réglages d'âge appliqués avec succès au SDK,
 * consentement UMP accordé pour un adulte. Toute étape qui échoue coupe la bannière.
 */
export function mayRequestBanner(input: {
  allowed: boolean;
  settingsApplied: AdAudience | null;
  audience: AdAudience;
  consent: ConsentResult | null;
}): boolean {
  if (!input.allowed || input.settingsApplied !== input.audience) return false;
  if (requestSettingsFor(input.audience).consent === "skip") return true;
  return input.consent?.canRequestAds === true;
}

const allowedId = (id: string, separator: "~" | "/"): boolean =>
  ADMOB_ALLOWED_PUBLISHERS.some(
    (publisher) =>
      id.startsWith(`${publisher}${separator}`) &&
      /^\d+$/.test(id.slice(publisher.length + 1)),
  );
export const isAllowedAndroidAppId = (id: string): boolean => allowedId(id, "~");
export const isAllowedAdUnit = (id: string): boolean => allowedId(id, "/");

/** Annonces de test seulement, sauf en mode `live`. */
export const adsTestMode = (ads: AdsConfig): boolean => ads.mode !== "live";

/**
 * Contrôle de la configuration : éditeur de démonstration ou JavaChrist seulement, les deux identifiants
 * du même éditeur, mode `test` ou `live`, et `live` seulement avec un bloc JavaChrist.
 */
export function adsConfigErrors(ads: AdsConfig): string[] {
  const errors: string[] = [];
  if (!isAllowedAndroidAppId(ads.androidAppId))
    errors.push(`ID d'application AdMob non autorisé : ${ads.androidAppId}`);
  if (!isAllowedAdUnit(ads.androidBannerAdUnitId))
    errors.push(`Bloc de bannière non autorisé : ${ads.androidBannerAdUnitId}`);
  if (ads.mode !== "test" && ads.mode !== "live")
    errors.push(`Mode d'annonces inconnu : « ${String(ads.mode)} »`);
  if (
    ads.mode === "live" &&
    !ads.androidBannerAdUnitId.startsWith(`${ADMOB_JAVACHRIST_PUBLISHER}/`)
  )
    errors.push("Mode « live » refusé avec le bloc de démonstration de Google");
  if (!Array.isArray(ads.testDevices))
    errors.push("testDevices doit être une liste");
  else
    for (const device of ads.testDevices)
      if (!/^[0-9A-F]{32}$/.test(device))
        errors.push(`Appareil de test invalide : ${device}`);
  const publisher = (id: string) => id.split(/[~/]/)[0];
  if (publisher(ads.androidAppId) !== publisher(ads.androidBannerAdUnitId))
    errors.push("ID d'application et bloc de bannière de deux éditeurs différents");
  return errors;
}
