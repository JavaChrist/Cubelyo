import { beforeEach, describe, expect, it } from "vitest";
import { playProduct } from "./products";
import type { PlayProductPurchase } from "./verify";
import {
  creditProfile,
  entriesOf,
  mergeGrants,
  serverGrants,
  type PurchaseEntry,
} from "./attribution";
import {
  attributionId,
  settlePlayPurchase,
  type AttributionStore,
  type PlayGateway,
} from "../../server/settle";
import { SaveSync } from "../cloud/sync";
import { SaveConflict, type CloudRepository } from "../cloud/contracts";
import { newProfile, SAVE_KEY } from "../progression/profile";

/**
 * Non-régression T1 : un achat payé donne son contenu une seule fois, sans perte lors d'une coupure,
 * d'un nouvel essai, d'appels simultanés ou d'une réinstallation.
 * Doublures fidèles au contrat : la transaction du registre est atomique (crédit + preuve ensemble),
 * Google refuse une deuxième consommation, la sauvegarde en ligne refuse une révision périmée.
 */

type Doc = { profile: string; revision: number };

/** Firestore simulé : sauvegardes par joueur et registre des preuves. */
function fakeServer() {
  const saves = new Map<string, Doc>();
  const proofs = new Map<string, { uid: string; product: string }>();
  let finalizedMarks = 0;
  const store: AttributionStore = {
    async attribute(id, uid, entry) {
      await Promise.resolve(); // laisse s'entrelacer les appels simultanés
      // Corps synchrone = transaction sérialisable : lectures et écritures sans interruption.
      if (proofs.has(id)) return "exists";
      const save = saves.get(uid);
      if (!save) return "saveRequired";
      saves.set(uid, {
        profile: creditProfile(save.profile, entry),
        revision: save.revision + 1,
      });
      proofs.set(id, { uid, product: entry.product });
      return "credited";
    },
    async finalized() {
      finalizedMarks += 1;
    },
  };
  const repo = (uid: string): CloudRepository => ({
    async read() {
      const doc = saves.get(uid);
      return doc ? { ...doc } : null;
    },
    async write(profile, expected) {
      const doc = saves.get(uid);
      if ((doc?.revision ?? 0) !== expected) throw new SaveConflict();
      const next = { profile, revision: expected + 1 };
      saves.set(uid, next);
      return { ...next };
    },
    async erase() {
      saves.delete(uid);
    },
  });
  return { saves, proofs, store, repo, marks: () => finalizedMarks };
}

/** Google Play simulé pour un jeton : `cut` fait échouer la prochaine finalisation (coupure). */
function fakeGoogle(state: Partial<PlayProductPurchase> = {}) {
  const purchase: PlayProductPurchase = {
    purchaseState: 0,
    consumptionState: 0,
    acknowledgementState: 0,
    ...state,
  };
  const calls = { consume: 0, acknowledge: 0 };
  let cut = false;
  const gateway: PlayGateway = {
    async fetch() {
      return { ...purchase };
    },
    async consume() {
      calls.consume += 1;
      if (cut) {
        cut = false;
        throw new Error("network-cut");
      }
      if (purchase.consumptionState === 1) throw new Error("already-consumed");
      purchase.consumptionState = 1;
    },
    async acknowledge() {
      calls.acknowledge += 1;
      if (cut) {
        cut = false;
        throw new Error("network-cut");
      }
      if (purchase.acknowledgementState === 1)
        throw new Error("already-acknowledged");
      purchase.acknowledgementState = 1;
    },
  };
  return {
    gateway,
    purchase,
    calls,
    cutNext: () => {
      cut = true;
    },
  };
}

const TOKEN = "token-".padEnd(60, "x");
const NOW = 1_800_000_000_000;
const baseProfile = () => JSON.stringify(newProfile(NOW));
const coinsOf = (raw: string) => JSON.parse(raw).coins as number;
const hintsOf = (raw: string) => JSON.parse(raw).hints as number;

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    map,
  };
}

/** Appareil : copie locale + synchronisation, comme useCloudSave (sans React). */
function device(server: ReturnType<typeof fakeServer>, uid: string, local = baseProfile()) {
  const storage = memoryStorage({ [SAVE_KEY]: local });
  const granted: PurchaseEntry[][] = [];
  const states: string[] = [];
  const make = () =>
    new SaveSync(
      server.repo(uid),
      `demo/${uid}`,
      storage,
      (raw) => storage.setItem(SAVE_KEY, raw),
      (s) => states.push(s),
      (_raw, entries) => granted.push(entries),
    );
  return {
    storage,
    granted,
    states,
    make,
    local: () => storage.getItem(SAVE_KEY)!,
    play: (mutate: (p: Record<string, unknown>) => void) => {
      const p = JSON.parse(storage.getItem(SAVE_KEY)!);
      mutate(p);
      storage.setItem(SAVE_KEY, JSON.stringify(p));
    },
  };
}

const settle = (
  server: ReturnType<typeof fakeServer>,
  google: ReturnType<typeof fakeGoogle>,
  id: string,
  uid: string | null,
) =>
  settlePlayPurchase(
    { play: google.gateway, store: server.store },
    { product: playProduct(id)!, token: TOKEN, uid },
  );

describe("serveur : crédit + preuve dans une transaction, puis finalisation Google", () => {
  let server: ReturnType<typeof fakeServer>;
  beforeEach(() => {
    server = fakeServer();
    server.saves.set("A", { profile: baseProfile(), revision: 1 });
  });

  for (const id of ["coins_220000", "noads_pack"]) {
    const grant = () => playProduct(id)!.grant;

    it(`${id} : coupure après la transaction, avant Google → reprise sans perte ni doublon`, async () => {
      const google = fakeGoogle();
      google.cutNext();
      await expect(settle(server, google, id, "A")).rejects.toThrow("network-cut");
      // Crédit déjà enregistré en ligne, achat encore ouvert chez Google (pas de remboursement auto si repris).
      expect(server.saves.get("A")!.revision).toBe(2);
      expect(server.proofs.size).toBe(1);

      const retry = await settle(server, google, id, "A");
      expect(retry).toEqual({
        status: "granted",
        adsRemoved: playProduct(id)!.removesAds,
        credited: false,
      });
      const saved = server.saves.get("A")!;
      expect(saved.revision).toBe(2);
      expect(coinsOf(saved.profile)).toBe(coinsOf(baseProfile()) + grant().coins);
      expect(hintsOf(saved.profile)).toBe(hintsOf(baseProfile()) + grant().hints);
      expect(entriesOf(saved.profile)).toHaveLength(1);
      expect(
        playProduct(id)!.consumable
          ? google.purchase.consumptionState
          : google.purchase.acknowledgementState,
      ).toBe(1);
    });

    it(`${id} : réponse perdue après finalisation → nouvel essai sans recrédit`, async () => {
      const google = fakeGoogle();
      expect(await settle(server, google, id, "A")).toMatchObject({
        status: "granted",
        credited: true,
      });
      const again = await settle(server, google, id, "A");
      expect(again).toEqual(
        playProduct(id)!.consumable
          ? { status: "consumed" }
          : { status: "granted", adsRemoved: true, credited: false },
      );
      expect(entriesOf(server.saves.get("A")!.profile)).toHaveLength(1);
      expect(server.saves.get("A")!.revision).toBe(2);
    });

    it(`${id} : appels simultanés → un seul crédit, les deux réussissent`, async () => {
      const google = fakeGoogle();
      const results = await Promise.all(
        Array.from({ length: 5 }, () => settle(server, google, id, "A")),
      );
      for (const r of results) expect("error" in r).toBe(false);
      expect(
        results.filter((r) => "credited" in r && r.credited),
      ).toHaveLength(1);
      expect(entriesOf(server.saves.get("A")!.profile)).toHaveLength(1);
      expect(coinsOf(server.saves.get("A")!.profile)).toBe(
        coinsOf(baseProfile()) + grant().coins,
      );
    });

    it(`${id} : sans identité vérifiée → refus, rien crédité ni finalisé (achat repris plus tard)`, async () => {
      const google = fakeGoogle();
      expect(await settle(server, google, id, null)).toEqual({
        error: "authRequired",
      });
      expect(server.proofs.size).toBe(0);
      expect(google.calls.consume + google.calls.acknowledge).toBe(0);
    });

    it(`${id} : sauvegarde en ligne absente → refus, rien finalisé`, async () => {
      const google = fakeGoogle();
      expect(await settle(server, google, id, "B")).toEqual({
        error: "saveRequired",
      });
      expect(server.proofs.size).toBe(0);
      expect(google.calls.consume + google.calls.acknowledge).toBe(0);
    });

    it(`${id} : réinstallation (nouvelle identité anonyme) → aucun second crédit`, async () => {
      const google = fakeGoogle();
      await settle(server, google, id, "A");
      server.saves.set("B", { profile: baseProfile(), revision: 1 });
      const restored = await settle(server, google, id, "B");
      expect(restored).toEqual(
        playProduct(id)!.consumable
          ? { status: "consumed" }
          : { status: "granted", adsRemoved: true, credited: false },
      );
      // Limite documentée : le contenu reste dans la sauvegarde de l'ancienne identité.
      expect(server.saves.get("B")!.profile).toBe(baseProfile());
    });

    it(`${id} : réinstallation pendant une finalisation interrompue → preuve trouvée, pas de doublon`, async () => {
      const google = fakeGoogle();
      google.cutNext();
      await expect(settle(server, google, id, "A")).rejects.toThrow();
      server.saves.set("B", { profile: baseProfile(), revision: 1 });
      expect(await settle(server, google, id, "B")).toMatchObject({
        status: "granted",
        credited: false,
      });
      expect(server.saves.get("B")!.profile).toBe(baseProfile());
      expect(entriesOf(server.saves.get("A")!.profile)).toHaveLength(1);
    });

    it(`${id} : achat finalisé par une version antérieure au registre → jamais recrédité`, async () => {
      const google = fakeGoogle(
        playProduct(id)!.consumable
          ? { consumptionState: 1, acknowledgementState: 1 }
          : { acknowledgementState: 1 },
      );
      await settle(server, google, id, "A");
      expect(server.proofs.size).toBe(0);
      expect(server.saves.get("A")!.revision).toBe(1);
    });
  }

  it("noads simple : aucun contenu, aucune identité requise, accusé de réception seulement", async () => {
    const google = fakeGoogle();
    expect(await settle(server, google, "noads", null)).toEqual({
      status: "granted",
      adsRemoved: true,
      credited: false,
    });
    expect(google.calls.acknowledge).toBe(1);
    expect(server.proofs.size).toBe(0);
  });

  it("la preuve ne contient pas le jeton", async () => {
    const google = fakeGoogle();
    await settle(server, google, "coins_220000", "A");
    const [id] = [...server.proofs.keys()];
    expect(id).toBe(attributionId(TOKEN));
    expect(id).not.toContain("token");
    expect(server.saves.get("A")!.profile).not.toContain(TOKEN);
  });
});

describe("appareil : report du crédit serveur sur la copie locale", () => {
  const id = "coins_220000";
  const grant = playProduct(id)!.grant;

  it("crédit serveur pendant que l'application tourne → reporté une fois, progression locale gardée", async () => {
    const server = fakeServer();
    const phone = device(server, "A");
    const sync = phone.make();
    await sync.start();
    expect(server.saves.get("A")!.revision).toBe(1);

    phone.play((p) => (p.coins = (p.coins as number) - 10)); // achat en pièces pas encore envoyé
    await settle(server, fakeGoogle(), id, "A");
    await sync.pull();

    expect(coinsOf(phone.local())).toBe(coinsOf(baseProfile()) - 10 + grant.coins);
    expect(phone.granted).toHaveLength(1);
    expect(server.saves.get("A")!.profile).toBe(phone.local());
    await sync.pull();
    await sync.flush();
    expect(phone.granted).toHaveLength(1);
    expect(entriesOf(phone.local())).toHaveLength(1);
  });

  it("application fermée avant la relecture (réponse perdue) → crédit repris au lancement suivant", async () => {
    const server = fakeServer();
    const phone = device(server, "A");
    const first = phone.make();
    await first.start();
    await settle(server, fakeGoogle(), id, "A");
    await first.stop(); // fermeture brutale : pull() jamais appelé

    phone.play((p) => (p.hints = (p.hints as number) + 1)); // progression hors ligne
    const second = phone.make();
    await second.start();
    expect(phone.states).not.toContain("conflict");
    expect(coinsOf(phone.local())).toBe(coinsOf(baseProfile()) + grant.coins);
    expect(hintsOf(phone.local())).toBe(hintsOf(baseProfile()) + 1 + grant.hints);
    expect(phone.granted).toHaveLength(1);
    expect(server.saves.get("A")!.profile).toBe(phone.local());

    const third = phone.make();
    await third.start();
    expect(phone.granted).toHaveLength(1);
    expect(entriesOf(phone.local())).toHaveLength(1);
  });

  it("envoi local refusé car le serveur a crédité entre-temps → fusion puis envoi, sans conflit", async () => {
    const server = fakeServer();
    const phone = device(server, "A");
    const sync = phone.make();
    await sync.start();
    await settle(server, fakeGoogle(), id, "A");
    phone.play((p) => (p.coins = (p.coins as number) + 5));
    await sync.flush();
    expect(phone.states.at(-1)).toBe("saved");
    expect(coinsOf(phone.local())).toBe(coinsOf(baseProfile()) + 5 + grant.coins);
    expect(server.saves.get("A")!.profile).toBe(phone.local());
    expect(phone.granted).toHaveLength(1);
  });

  it("vraie progression d'un autre appareil → conflit, puis « garder l'appareil » conserve l'achat", async () => {
    const server = fakeServer();
    const phone = device(server, "A");
    const sync = phone.make();
    await sync.start();
    // Autre appareil : progression réelle (pas un simple crédit d'achat).
    const other = JSON.parse(server.saves.get("A")!.profile);
    other.coins += 999;
    server.saves.set("A", { profile: JSON.stringify(other), revision: 2 });
    await settle(server, fakeGoogle(), id, "A");
    phone.play((p) => (p.hints = (p.hints as number) + 1));
    await sync.flush();
    expect(phone.states.at(-1)).toBe("conflict");

    await sync.resolve("local");
    expect(coinsOf(phone.local())).toBe(coinsOf(baseProfile()) + grant.coins);
    expect(entriesOf(phone.local())).toHaveLength(1);
    expect(server.saves.get("A")!.profile).toBe(phone.local());
    expect(phone.granted).toHaveLength(1);
  });
});

describe("fusion des achats (fonctions pures)", () => {
  const entry = (id: string): PurchaseEntry => ({
    id,
    product: "coins_220000",
    grant: { coins: 100, hints: 1, erasers: 0, wands: 0 },
  });

  it("creditProfile est idempotent", () => {
    const once = creditProfile(baseProfile(), entry("a"));
    expect(creditProfile(once, entry("a"))).toBe(once);
    expect(coinsOf(once)).toBe(coinsOf(baseProfile()) + 100);
  });

  it("mergeGrants n'ajoute que les achats absents", () => {
    const remote = creditProfile(creditProfile(baseProfile(), entry("a")), entry("b"));
    const local = creditProfile(baseProfile(), entry("a"));
    const merged = mergeGrants(local, remote);
    expect(merged.added.map((e) => e.id)).toEqual(["b"]);
    expect(coinsOf(merged.raw)).toBe(coinsOf(baseProfile()) + 200);
    expect(mergeGrants(merged.raw, remote).added).toEqual([]);
  });

  it("serverGrants distingue un crédit serveur d'une autre modification", () => {
    const base = baseProfile();
    expect(serverGrants(base, creditProfile(base, entry("a")))).toHaveLength(1);
    const edited = JSON.parse(creditProfile(base, entry("a")));
    edited.hints += 1;
    expect(serverGrants(base, JSON.stringify(edited))).toBeNull();
    expect(serverGrants(base, base)).toBeNull();
    expect(serverGrants(base, "{")).toBeNull();
  });
});
