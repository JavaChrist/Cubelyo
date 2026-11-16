import { describe, expect, it } from "vitest";
import {
  INITIAL_PROMO_STATE,
  PROMOTIONS_CONFIG,
  PROMO_RULES,
  afterGameCompleted,
  afterPromoShown,
  campaignFrom,
  campaignsFromCatalogDocument,
  catalogUrl,
  isPromoDue,
  mayFetchCatalog,
  pickCampaign,
  promotionsAllowed,
  promotionsConfigErrors,
  stillValid,
  type PromoCampaign,
} from "./rules";

const now = new Date("2026-11-16T12:00:00Z");
const raw = {
  id: "geofr",
  name: " GéoFR ",
  audience: "adult",
  locale: "fr",
  videoUrl: "https://example.com/v.mp4",
  durationMs: 12_000,
  destinationUrl: "https://play.google.com/store/apps/details?id=x",
  weight: 2,
};
const open = { configured: true, entitlementsReady: true, adsRemoved: false };

describe("campagnes", () => {
  it("garde une campagne complète et nettoie le nom", () => {
    expect(campaignFrom(raw, "fr", now)).toMatchObject({
      id: "geofr",
      name: "GéoFR",
      weight: 2,
      startsAt: null,
    });
  });
  it("écarte ce qui n'est pas pour un adulte, en français, en HTTPS vers Play, de 15 s au plus", () => {
    expect(campaignFrom({ ...raw, audience: "all" }, "fr", now)).toBeNull();
    expect(campaignFrom({ ...raw, locale: "de" }, "fr", now)).toBeNull();
    expect(campaignFrom({ ...raw, videoUrl: "http://x/v.mp4" }, "fr", now)).toBeNull();
    expect(
      campaignFrom({ ...raw, destinationUrl: "https://evil.com/" }, "fr", now),
    ).toBeNull();
    expect(campaignFrom({ ...raw, durationMs: 15_001 }, "fr", now)).toBeNull();
    expect(
      campaignFrom({ ...raw, startsAt: "2026-12-01T00:00:00Z" }, "fr", now),
    ).toBeNull();
    expect(
      campaignFrom({ ...raw, endsAt: "2026-11-16T12:00:00Z" }, "fr", now),
    ).toBeNull();
  });
  it("lit un document REST Firestore sans doublon", () => {
    const value = (c: typeof raw) => ({
      mapValue: {
        fields: {
          id: { stringValue: c.id },
          name: { stringValue: c.name },
          audience: { stringValue: c.audience },
          locale: { stringValue: c.locale },
          videoUrl: { stringValue: c.videoUrl },
          durationMs: { integerValue: String(c.durationMs) },
          destinationUrl: { stringValue: c.destinationUrl },
          weight: { doubleValue: c.weight },
          startsAt: { nullValue: null },
        },
      },
    });
    const document = {
      fields: { campaigns: { arrayValue: { values: [value(raw), value(raw)] } } },
    };
    const campaigns = campaignsFromCatalogDocument(document, "fr", now);
    expect(campaigns).toHaveLength(1);
    expect(campaigns[0].durationMs).toBe(12_000);
    expect(campaignsFromCatalogDocument(null, "fr", now)).toEqual([]);
    // Recontrôle du cache : la période peut s'être terminée depuis la lecture.
    expect(stillValid(campaigns, "fr", now)).toHaveLength(1);
    expect(
      stillValid([{ ...campaigns[0], endsAt: "2026-11-01T00:00:00Z" }], "fr", now),
    ).toEqual([]);
  });
  it("ne rejoue pas la dernière vidéo quand une autre existe", () => {
    const a = campaignFrom(raw, "fr", now) as PromoCampaign;
    const b = { ...a, id: "motissimo" };
    expect(pickCampaign([a, b], "geofr", () => 0)?.id).toBe("motissimo");
    expect(pickCampaign([a], "geofr", () => 0)?.id).toBe("geofr");
    expect(pickCampaign([], null, () => 0)).toBeNull();
  });
});

describe("fréquence et accès", () => {
  it("une vidéo toutes les 3 victoires, compteur remis à zéro seulement après la vidéo", () => {
    let state = INITIAL_PROMO_STATE;
    for (let i = 0; i < PROMO_RULES.gamesBetween - 1; i++)
      state = afterGameCompleted(state);
    expect(isPromoDue(state)).toBe(false);
    state = afterGameCompleted(afterGameCompleted(state));
    expect(state.completedSinceLast).toBe(PROMO_RULES.gamesBetween);
    expect(isPromoDue(state)).toBe(true);
    state = afterPromoShown(state, "geofr");
    expect(state).toMatchObject({ completedSinceLast: 0, lastShownId: "geofr" });
  });
  it("sans publicité ou sans adulte déclaré : aucune requête", () => {
    const adult = { ...INITIAL_PROMO_STATE, adult: "adult" as const };
    expect(mayFetchCatalog(open, adult)).toBe(true);
    expect(mayFetchCatalog(open, INITIAL_PROMO_STATE)).toBe(false);
    expect(mayFetchCatalog(open, { ...adult, adult: "minor" })).toBe(false);
    expect(mayFetchCatalog({ ...open, adsRemoved: true }, adult)).toBe(false);
    expect(promotionsAllowed({ ...open, entitlementsReady: false })).toBe(false);
  });
  it("catalogue public de Cubelyo", () => {
    expect(promotionsConfigErrors(PROMOTIONS_CONFIG)).toEqual([]);
    expect(catalogUrl(PROMOTIONS_CONFIG)).toBe(
      "https://firestore.googleapis.com/v1/projects/motissimo-456ba/databases/(default)/documents/public_catalogs/cubelyo",
    );
  });
});
