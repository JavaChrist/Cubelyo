import { CLOUD_META_KEY } from "./config";
import {
  SaveConflict,
  type CloudRepository,
  type CloudSave,
} from "./contracts";
import { SAVE_KEY } from "../progression/profile";
export const CLOUD_OPTOUT_KEY = "cubelyo.cloud.disabled";
export type SyncState =
  "connecting" | "saved" | "saving" | "error" | "conflict" | "local";
type Metadata = { scope: string; revision: number; base: string };
/** Serializes operations and uses Firestore revisions to protect concurrent or offline changes. */
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
  ) {}
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
    this.conflict = true;
    this.state("conflict");
  }
  start() {
    return this.enqueue(async () => {
      this.state("connecting");
      const remote = await this.repo.read();
      if (this.stopped) return;
      this.reconcile(remote);
      this.connected = true;
      if (!this.conflict) await this.save();
    });
  }
  changed() {
    if (this.stopped || this.conflict || !this.connected) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      void this.enqueue(() => this.save());
    }, 1500);
  }
  private async save() {
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
      if (error instanceof SaveConflict) {
        this.conflict = true;
        this.state("conflict");
      } else throw error;
    }
  }
  retry() {
    return this.start();
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
export function setActiveSync(sync: SaveSync) {
  active = sync;
}
export async function stopActiveSync() {
  const previous = active;
  active = null;
  await previous?.stop();
}
