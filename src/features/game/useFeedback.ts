"use client";
import { useCallback, useEffect, useRef } from "react";
export function useFeedback(settings: {
  music: boolean;
  sound: boolean;
  vibration: boolean;
}) {
  const audio = useRef<AudioContext | null>(null),
    music = useRef<{ gain: GainNode; tones: OscillatorNode[] } | null>(null);
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  const init = useCallback(() => {
    if (!audio.current || audio.current.state === "closed")
      audio.current = new AudioContext();
    void audio.current.resume();
    return audio.current;
  }, []);
  const syncMusic = useCallback(
    (enabled: boolean) => {
      if (music.current) {
        music.current.tones.forEach((t) => t.stop());
        music.current.gain.disconnect();
        music.current = null;
      }
      if (!enabled) return;
      const a = init(),
        gain = a.createGain();
      gain.gain.value = 0.008;
      gain.connect(a.destination);
      const tones = [130.81, 196, 261.63].map((f) => {
        const o = a.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        o.connect(gain);
        o.start();
        return o;
      });
      music.current = { gain, tones };
    },
    [init],
  );
  useEffect(() => {
    const activate = () => {
      if (settingsRef.current.music && !music.current) syncMusic(true);
    };
    window.addEventListener("pointerdown", activate);
    return () => {
      window.removeEventListener("pointerdown", activate);
      music.current?.tones.forEach((t) => t.stop());
      music.current = null;
      if (audio.current?.state !== "closed") void audio.current?.close();
      audio.current = null;
    };
  }, [syncMusic]); // La préférence restaurée attend une interaction pour respecter l'autoplay.
  function feedback(success: boolean) {
    const s = settingsRef.current;
    if (s.vibration && navigator.vibrate)
      navigator.vibrate(success ? 15 : [25, 20, 25]);
    if (!s.sound) return;
    const a = init(),
      o = a.createOscillator(),
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
  return { feedback, syncMusic };
}
