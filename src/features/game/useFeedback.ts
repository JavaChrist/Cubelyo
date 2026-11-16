"use client";
import { useCallback, useEffect, useRef } from "react";

/**
 * Sons du jeu (voir public/sounds/CREDITS.md).
 * - Musique : « Cozy Puzzle Title » en boucle sans blanc (AudioBufferSourceNode.loop).
 * - Flèche qui sort : tir d'arc enregistré. Les autres retours restent des bips synthétisés.
 * Les fichiers sont décodés une fois par AudioContext ; tant qu'ils chargent, la flèche joue le bip.
 */
const MUSIC_URL = "/sounds/music.ogg";
const ARROW_URL = "/sounds/arrow.wav";
const MUSIC_VOLUME = 0.13;
const ARROW_VOLUME = 0.5;

export function useFeedback(settings: {
  music: boolean;
  sound: boolean;
  vibration: boolean;
}) {
  const audio = useRef<AudioContext | null>(null),
    music = useRef<{ gain: GainNode; source: AudioBufferSourceNode } | null>(
      null,
    ),
    // Incrémenté à chaque bascule : un chargement de musique devenu inutile ne démarre pas.
    musicTurn = useRef(0),
    buffers = useRef(new Map<string, Promise<AudioBuffer | null>>()),
    arrow = useRef<AudioBuffer | null>(null);
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const load = useCallback((a: AudioContext, url: string) => {
    let buffer = buffers.current.get(url);
    if (!buffer) {
      buffer = fetch(url)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
        .then((data) => a.decodeAudioData(data))
        .catch(() => null);
      buffers.current.set(url, buffer);
    }
    return buffer;
  }, []);

  const init = useCallback(() => {
    if (!audio.current || audio.current.state === "closed") {
      audio.current = new AudioContext();
      buffers.current.clear();
      arrow.current = null;
      const a = audio.current;
      void load(a, ARROW_URL).then((b) => {
        if (audio.current === a) arrow.current = b;
      });
    }
    void audio.current.resume();
    return audio.current;
  }, [load]);

  const stopMusic = useCallback(() => {
    const m = music.current;
    if (!m) return;
    music.current = null;
    const a = m.gain.context;
    // Fondu court pour éviter le clic à la coupure.
    m.gain.gain.setTargetAtTime(0, a.currentTime, 0.05);
    m.source.stop(a.currentTime + 0.3);
    m.source.onended = () => m.gain.disconnect();
  }, []);

  const syncMusic = useCallback(
    (enabled: boolean) => {
      const turn = ++musicTurn.current;
      stopMusic();
      if (!enabled) return;
      const a = init();
      void load(a, MUSIC_URL).then((buffer) => {
        if (!buffer || turn !== musicTurn.current || audio.current !== a)
          return;
        const gain = a.createGain(),
          source = a.createBufferSource();
        gain.gain.setValueAtTime(0, a.currentTime);
        gain.gain.linearRampToValueAtTime(MUSIC_VOLUME, a.currentTime + 1.5);
        gain.connect(a.destination);
        source.buffer = buffer;
        source.loop = true;
        source.connect(gain);
        source.start();
        music.current = { gain, source };
      });
    },
    [init, load, stopMusic],
  );

  useEffect(() => {
    // La préférence restaurée attend une interaction pour respecter l'autoplay.
    const activate = () => {
      if (settingsRef.current.music && !music.current) {
        // Musique déjà en chargement : on ne relance pas un second chargement.
        if (audio.current && buffers.current.has(MUSIC_URL)) {
          void audio.current.resume();
          return;
        }
        syncMusic(true);
      }
    };
    window.addEventListener("pointerdown", activate);
    const turns = musicTurn;
    return () => {
      window.removeEventListener("pointerdown", activate);
      turns.current++;
      music.current?.source.stop();
      music.current = null;
      if (audio.current?.state !== "closed") void audio.current?.close();
      audio.current = null;
    };
  }, [syncMusic]);

  useEffect(() => {
    // Application en arrière-plan (ou onglet masqué) : silence, reprise au retour.
    const sync = () => {
      const a = audio.current;
      if (!a || a.state === "closed") return;
      void (document.hidden ? a.suspend() : a.resume());
    };
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  function beep(a: AudioContext, success: boolean) {
    const o = a.createOscillator(),
      g = a.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(success ? 660 : 180, a.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      success ? 880 : 100,
      a.currentTime + 0.12,
    );
    g.gain.setValueAtTime(0.035, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.15);
    o.connect(g);
    g.connect(a.destination);
    o.start();
    o.stop(a.currentTime + 0.16);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }

  function shoot(a: AudioContext, buffer: AudioBuffer) {
    const source = a.createBufferSource(),
      g = a.createGain();
    g.gain.value = ARROW_VOLUME;
    // Légère variation de hauteur : deux tirs de suite ne sonnent pas identiques.
    source.playbackRate.value = 0.94 + Math.random() * 0.12;
    source.buffer = buffer;
    source.connect(g);
    g.connect(a.destination);
    source.onended = () => {
      source.disconnect();
      g.disconnect();
    };
    source.start();
  }

  /** `arrowShot` : la flèche sort du cube, on joue le tir d'arc à la place du bip. */
  function feedback(success: boolean, arrowShot = false) {
    const s = settingsRef.current;
    if (s.vibration && navigator.vibrate)
      navigator.vibrate(success ? 15 : [25, 20, 25]);
    if (!s.sound) return;
    const a = init();
    if (success && arrowShot && arrow.current) shoot(a, arrow.current);
    else beep(a, success);
  }
  return { feedback, syncMusic };
}
