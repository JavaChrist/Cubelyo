import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import ads from "./ads.json";
import {
  ADMOB_DEMO_ANDROID_APP_ID,
  ADMOB_DEMO_ANDROID_BANNER,
  adAudience,
  adsAllowed,
  adsConfigErrors,
  adsTestMode,
  isAllowedAdUnit,
  isAllowedAndroidAppId,
  mayRequestBanner,
  requestSettingsFor,
  type AdsConfig,
} from "./rules";

const open = {
  configured: true,
  native: true,
  entitlementsReady: true,
  adsRemoved: false,
  forceNoAds: false,
};
const config = ads as AdsConfig;
const JC = "ca-app-pub-8288172940135426";

describe("public et réglages", () => {
  it("seul un adulte déclaré passe par UMP", () => {
    expect(adAudience("adult")).toBe("adult");
    expect(adAudience("minor")).toBe("restricted");
    expect(adAudience(null)).toBe("restricted");
    expect(requestSettingsFor("adult")).toMatchObject({
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
      nonPersonalized: false,
      consent: "ump",
    });
    expect(requestSettingsFor("restricted")).toMatchObject({
      tagForChildDirectedTreatment: true,
      tagForUnderAgeOfConsent: true,
      nonPersonalized: true,
      maxAdContentRating: "General",
      consent: "skip",
    });
  });
});

describe("droits", () => {
  it("l'achat sans publicité coupe toute annonce", () => {
    expect(adsAllowed(open)).toBe(true);
    expect(adsAllowed({ ...open, adsRemoved: true })).toBe(false);
  });
  it("dans le doute, aucune annonce", () => {
    expect(adsAllowed({ ...open, entitlementsReady: false })).toBe(false);
    expect(adsAllowed({ ...open, native: false })).toBe(false);
    expect(adsAllowed({ ...open, configured: false })).toBe(false);
    expect(adsAllowed({ ...open, forceNoAds: true })).toBe(false);
  });
  it("la bannière attend les réglages et le consentement", () => {
    const base = { allowed: true, consent: null } as const;
    expect(
      mayRequestBanner({ ...base, settingsApplied: null, audience: "restricted" }),
    ).toBe(false);
    expect(
      mayRequestBanner({
        ...base,
        settingsApplied: "restricted",
        audience: "restricted",
      }),
    ).toBe(true);
    // Réglages d'un autre public encore appliqués : rien.
    expect(
      mayRequestBanner({ ...base, settingsApplied: "restricted", audience: "adult" }),
    ).toBe(false);
    expect(
      mayRequestBanner({ ...base, settingsApplied: "adult", audience: "adult" }),
    ).toBe(false);
    expect(
      mayRequestBanner({
        allowed: true,
        settingsApplied: "adult",
        audience: "adult",
        consent: { canRequestAds: false },
      }),
    ).toBe(false);
    expect(
      mayRequestBanner({
        allowed: true,
        settingsApplied: "adult",
        audience: "adult",
        consent: { canRequestAds: true },
      }),
    ).toBe(true);
    expect(
      mayRequestBanner({
        allowed: false,
        settingsApplied: "restricted",
        audience: "restricted",
        consent: null,
      }),
    ).toBe(false);
  });
});

describe("identifiants", () => {
  it("n'accepte que les éditeurs démo et JavaChrist", () => {
    expect(isAllowedAndroidAppId(ADMOB_DEMO_ANDROID_APP_ID)).toBe(true);
    expect(isAllowedAndroidAppId(`${JC}~123`)).toBe(true);
    expect(isAllowedAndroidAppId("ca-app-pub-1111111111111111~123")).toBe(false);
    expect(isAllowedAdUnit(ADMOB_DEMO_ANDROID_BANNER)).toBe(true);
    expect(isAllowedAdUnit(`${JC}/12x`)).toBe(false);
    expect(isAllowedAdUnit(`${JC}~123`)).toBe(false);
  });
  it("refuse le live avec la démo et les éditeurs mélangés", () => {
    const demo: AdsConfig = {
      mode: "test",
      androidAppId: ADMOB_DEMO_ANDROID_APP_ID,
      androidBannerAdUnitId: ADMOB_DEMO_ANDROID_BANNER,
      testDevices: [],
    };
    expect(adsConfigErrors(demo)).toEqual([]);
    expect(adsConfigErrors({ ...demo, mode: "live" })).toContain(
      "Mode « live » refusé avec le bloc de démonstration de Google",
    );
    expect(
      adsConfigErrors({ ...demo, androidBannerAdUnitId: `${JC}/123` }),
    ).toContain("ID d'application et bloc de bannière de deux éditeurs différents");
    expect(adsConfigErrors({ ...demo, testDevices: ["abc"] })).toHaveLength(1);
    expect(
      adsConfigErrors({
        mode: "live",
        androidAppId: `${JC}~1`,
        androidBannerAdUnitId: `${JC}/2`,
        testDevices: ["0123456789ABCDEF0123456789ABCDEF"],
      }),
    ).toEqual([]);
    expect(adsTestMode(demo)).toBe(true);
  });
  it("la configuration livrée est valide", () => {
    expect(adsConfigErrors(config)).toEqual([]);
  });
});

describe("Android", () => {
  const read = (path: string) =>
    readFileSync(new URL(`../../../android/${path}`, import.meta.url), "utf8");
  it("SDK Google Mobile Ads et UMP en versions exactes", () => {
    const vars = read("variables.gradle");
    const ads = vars.match(/playServicesAdsVersion = '([^']+)'/)?.[1];
    const ump = vars.match(/userMessagingPlatformVersion = '([^']+)'/)?.[1];
    expect(ads).toMatch(/^\d+\.\d+\.\d+$/);
    expect(Number(ads!.split(".")[0])).toBeGreaterThanOrEqual(19);
    expect(ump).toMatch(/^\d+\.\d+\.\d+$/);
  });
  it("identifiant publicitaire et Privacy Sandbox retirés, sauvegarde coupée", () => {
    const manifest = read("app/src/main/AndroidManifest.xml");
    for (const permission of [
      "com.google.android.gms.permission.AD_ID",
      "android.permission.ACCESS_ADSERVICES_AD_ID",
      "android.permission.ACCESS_ADSERVICES_TOPICS",
      "android.permission.ACCESS_ADSERVICES_ATTRIBUTION",
    ])
      expect(manifest).toContain(
        `<uses-permission android:name="${permission}" tools:node="remove" />`,
      );
    expect(manifest).toContain('android:allowBackup="false"');
    expect(manifest).toContain('android:value="${admobAppId}"');
  });
});
