"use client";
import { useEffect, useRef, useState } from "react";
import { CLOUD_ENABLED } from "./config";
import {
  CLOUD_OPTOUT_KEY,
  SaveSync,
  setActiveSync,
  type SyncState,
} from "./sync";
import { decodeProfile, SAVE_KEY, type Profile } from "../progression/profile";
import type { PurchaseEntry } from "../billing/attribution";
export function useCloudSave(
  ready: boolean,
  profile: Profile,
  apply: (profile: Profile) => void,
  /** Achats crédités par le serveur, reportés sur la copie locale (carte de récompense, sans retour à l'accueil). */
  onGranted: (profile: Profile, entries: PurchaseEntry[]) => void = () => {},
) {
  const [state, setState] = useState<SyncState>("local");
  const [attempt, setAttempt] = useState(0);
  const sync = useRef<SaveSync | null>(null);
  const applyRef = useRef(apply);
  const grantedRef = useRef(onGranted);
  useEffect(() => {
    applyRef.current = apply;
    grantedRef.current = onGranted;
  }, [apply, onGranted]);
  useEffect(() => {
    if (!ready || !CLOUD_ENABLED) return;
    let cancelled = false;
    let controller: SaveSync | null = null;
    void (async () => {
      if (localStorage.getItem(CLOUD_OPTOUT_KEY) === "true") {
        setState("local");
        return;
      }
      setState("connecting");
      const { firebaseClient } = await import("./firebase");
      if (cancelled) return;
      const { cloudRepository } = await import("./repository");
      const client = await firebaseClient();
      if (cancelled || !client?.auth.currentUser) return;
      const uid = client.auth.currentUser.uid;
      controller = new SaveSync(
        cloudRepository(client.db, uid),
        `${client.projectId}/${uid}`,
        localStorage,
        (raw) => {
          const restored = decodeProfile(raw);
          if (restored) {
            localStorage.setItem(SAVE_KEY, JSON.stringify(restored));
            applyRef.current(restored);
          }
        },
        (value) => {
          if (!cancelled) setState(value);
        },
        (raw, entries) => {
          const credited = decodeProfile(raw);
          if (credited) grantedRef.current(credited, entries);
        },
      );
      sync.current = controller;
      setActiveSync(controller);
      await controller.start();
    })().catch(() => {
      if (!cancelled) setState("error");
    });
    const retry = () => {
      if (controller) void controller.retry();
      else setAttempt((value) => value + 1);
    };
    window.addEventListener("online", retry);
    window.addEventListener("focus", retry);
    const changed = (event: StorageEvent) => {
      if (event.key === CLOUD_OPTOUT_KEY) {
        void controller?.stop();
        setState("local");
      }
    };
    window.addEventListener("storage", changed);
    return () => {
      cancelled = true;
      void controller?.stop();
      sync.current = null;
      window.removeEventListener("online", retry);
      window.removeEventListener("focus", retry);
      window.removeEventListener("storage", changed);
    };
  }, [ready, attempt]);
  useEffect(() => {
    if (ready) sync.current?.changed();
  }, [ready, profile]);
  return {
    state,
    enabled: CLOUD_ENABLED,
    retry: () => {
      if (sync.current) void sync.current.retry();
      else setAttempt((value) => value + 1);
    },
    resolve: (choice: "local" | "cloud") => {
      void sync.current?.resolve(choice);
    },
    pause: () => {
      localStorage.setItem(CLOUD_OPTOUT_KEY, "true");
      void sync.current?.stop();
      setState("local");
      setAttempt((value) => value + 1);
    },
    activate: () => {
      localStorage.removeItem(CLOUD_OPTOUT_KEY);
      setAttempt((value) => value + 1);
    },
  };
}
