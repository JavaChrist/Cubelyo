import { CLOUD_META_KEY } from "./config";
import {
  SaveConflict,
  type CloudRepository,
  type CloudSave,
} from "./contracts";
import { SAVE_KEY } from "../progression/profile";
import {
  mergeGrants,
  serverGrants,
  type PurchaseEntry,
} from "../billing/attribution";
export const CLOUD_OPTOUT_KEY = "cubelyo.cloud.disabled";
export type SyncState =
  "connecting" | "saved" | "saving" | "error" | "conflict" | "local";
type Metadata = { scope: string; revision: number; base: string };
/**
 * Serializes operations and uses Firestore revisions to protect concurrent or offline changes.
 * Seul autre écrivain de la sauvegarde : le serveur, qui y crédite les achats (src/server/settle.ts).
 * Une révision serveur qui n'ajoute que des achats est reportée sur la copie locale (une fois par achat),
 * jamais traitée comme un conflit ni écrasée.
 */
export class SaveSync {
  private stopped = false;
  private tail = Promise.resolve();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private revision = 0;
  private base: string | null = null;
  private conflict = false;
  private connected = false;
  constructor(
    private repo: CloudRepository,
    private scope: string,
    private storage: Pick<Storage, "getItem" | "setItem">,
    private apply: (raw: string) => void,
    private state: (state: SyncState) => void,
    /** Achats crédités en ligne reportés sur la copie locale (déjà écrite) : sans retour à l'accueil. */
    private granted: (raw: string, entries: PurchaseEntry[]) => void = () => {},
  ) {}
  /** Ajoute à la copie locale les achats de `remote` qu'elle n'a pas, une seule fois chacun. */
  private mergeFrom(remote: string) {
    const local = this.local();
    const merged = mergeGrants(local, remote);
    if (!merged.added.length) return;
    this.storage.setItem(SAVE_KEY, merged.raw);
    this.granted(merged.raw, merged.added);
  }
  /**
   * `remote` = `base` + achats crédités par le serveur : ces achats sont ajoutés à la copie locale
   * (progression locale non envoyée conservée), puis `remote` devient la base. Faux sinon.
   */
  private absorb(base: string | null | undefined, remote: CloudSave | null) {
    if (!base || !remote) return false;
    if (!serverGrants(base, remote.profile)) return false;
    this.mergeFrom(remote.profile);
    this.remember(remote);
    this.conflict = false;
    return true;
  }
  private enqueue(work: () => Promise<void>) {
    this.tail = this.tail
      .then(async () => {
        if (!this.stopped) await work();
      })
      .catch(() => {
        if (!this.stopped) this.state("error");
      });
    return this.tail;
  }
  private remember(save: CloudSave | null) {
    this.revision = save?.revision ?? 0;
    this.base = save?.profile ?? null;
    this.storage.setItem(
      CLOUD_META_KEY,
      JSON.stringify({
        scope: this.scope,
        revision: this.revision,
        base: this.base,
      }),
    );
  }
  private local() {
    const raw = this.storage.getItem(SAVE_KEY);
    if (!raw) throw new Error("cloud/local-save-missing");
    return raw;
  }
  private reconcile(remote: CloudSave | null) {
    const local = this.local();
    let meta: Metadata | null = null;
    try {
      const saved = JSON.parse(this.storage.getItem(CLOUD_META_KEY) ?? "null");
      if (saved?.scope === this.scope) meta = saved;
    } catch {}
    if (
      (!remote && !meta?.revision) ||
      remote?.profile === local ||
      (meta && meta.revision === remote?.revision)
    ) {
      this.remember(remote);
      this.conflict = false;
      return;
    }
    // Réponse d'achat perdue (coupure, fermeture) : le crédit serveur est repris ici.
    if (
      meta &&
      remote &&
      remote.revision > meta.revision &&
      this.absorb(meta.base, remote)
    )
      return;
    this.conflict = true;
    this.state("conflict");
  }
  private async startWork() {
    this.state("connecting");
    const remote = await this.repo.read();
    if (this.stopped) return;
    this.reconcile(remote);
    this.connected = true;
    if (!this.conflict) await this.save();
  }
  start() {
    return this.enqueue(() => this.startWork());
  }
  changed() {
    if (this.stopped || this.conflict || !this.connected) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      void this.enqueue(() => this.save());
    }, 1500);
  }
  private async save(): Promise<void> {
    if (this.conflict || this.stopped) return;
    const raw = this.local();
    if (raw === this.base) {
      this.state("saved");
      return;
    }
    this.state("saving");
    try {
      const saved = await this.repo.write(raw, this.revision);
      this.remember(saved);
      if (!this.stopped) {
        this.state("saved");
        if (this.local() !== raw) this.changed();
      }
    } catch (error) {
      if (!(error instanceof SaveConflict)) throw error;
      // Le serveur a crédité un achat entre-temps : reporté localement, puis nouvel envoi.
      if (this.absorb(this.base, await this.repo.read())) return this.save();
      this.conflict = true;
      this.state("conflict");
    }
  }
  retry() {
    return this.start();
  }
  /** Envoie la copie locale ; vrai si la sauvegarde en ligne est à jour et sans conflit (avant un achat). */
  async flush() {
    let ok = false;
    await this.enqueue(async () => {
      if (!this.connected) await this.startWork();
      await this.save();
      ok = this.connected && !this.conflict;
    });
    return ok;
  }
  /** Relit la sauvegarde après un achat réglé par le serveur et reporte le crédit. */
  pull() {
    return this.enqueue(async () => {
      if (!this.connected || this.conflict) return;
      const remote = await this.repo.read();
      if (this.stopped || !remote || remote.revision === this.revision) return;
      if (this.absorb(this.base, remote)) await this.save();
      else {
        this.conflict = true;
        this.state("conflict");
      }
    });
  }
  resolve(choice: "local" | "cloud") {
    return this.enqueue(async () => {
      const remote = await this.repo.read();
      if (this.stopped) return;
      if (choice === "cloud") {
        if (!remote) throw new Error("cloud/save-missing");
        this.apply(remote.profile);
        this.remember(remote);
        this.conflict = false;
        this.state("saved");
      } else {
        // La copie locale l'emporte, mais garde les achats crédités en ligne qu'elle n'a pas encore.
        if (remote) this.mergeFrom(remote.profile);
        this.remember(remote);
        this.conflict = false;
        await this.save();
      }
    });
  }
  async stop() {
    this.stopped = true;
    clearTimeout(this.timer);
    await this.tail;
  }
}
let active: SaveSync | null = null;
const waiting = new Set<(sync: SaveSync) => void>();
export function setActiveSync(sync: SaveSync) {
  active = sync;
  for (const resolve of waiting) resolve(sync);
  waiting.clear();
}
/** Synchronisation en cours, attendue au plus `ms` (lancement de l'application). */
export function activeSync(ms: number): Promise<SaveSync | null> {
  if (active) return Promise.resolve(active);
  return new Promise((resolve) => {
    const done = (sync: SaveSync | null) => {
      clearTimeout(timer);
      waiting.delete(done);
      resolve(sync);
    };
    const timer = setTimeout(() => done(null), ms);
    waiting.add(done);
  });
}
export async function stopActiveSync() {
  const previous = active;
  active = null;
  await previous?.stop();
}
