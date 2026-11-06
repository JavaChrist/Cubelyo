"use client";
import dynamic from "next/dynamic";
import { Capacitor } from "@capacitor/core";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Box,
  Coins,
  Eraser,
  FlaskConical,
  Heart,
  Home,
  Layers3,
  Lightbulb,
  Medal,
  Music2,
  Pause,
  Play,
  Rotate3D,
  RotateCcw,
  Settings,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Trophy,
  Volume2,
} from "lucide-react";
import { LEVELS, difficultyAt } from "../levels/campaign";
import { tryExtract, type Face } from "./core/engine";
import {
  SAVE_KEY,
  POINTS_PER_ARROW,
  CONTINUE_PRICE,
  beginSession,
  claimChest,
  continueSession,
  newProfile,
  readProfile,
  refreshEnergy,
  removeFromSession,
  type Profile,
} from "../progression/profile";
import { EnergyCounter, EnergyCountdown } from "./EnergyDisplay";
import { Modal } from "./Modal";
import { PromotionOffer } from "./PromotionOffer";
import { HomeScreen } from "./HomeScreen";
import { TowerHelp } from "./TowerHelp";
import { ProgressScreens } from "./ProgressScreens";
import { ShopScreen } from "./ShopScreen";
import { useFeedback } from "./useFeedback";
import { wandTargets } from "./powerups";
import { useCloudSave } from "../cloud/useCloudSave";
import type { Motion } from "./render/CubeScene";
const CubeScene = dynamic(() => import("./render/CubeScene"), {
  ssr: false,
  loading: () => <div className="canvas-fallback">Préparation du cube…</div>,
});
type Screen = "home" | "game" | "tower" | "shop";
type Dialog =
  | "pause"
  | "restart"
  | "atouts"
  | "lost"
  | "update"
  | "settings"
  | "energy"
  | "privacy"
  | "starter"
  | "special"
  | "tower-info"
  | null;
export default function Game() {
  const [profile, setProfile] = useState<Profile>(newProfile),
    profileRef = useRef(profile);
  const [ready, setReady] = useState(false),
    [screen, setScreen] = useState<Screen>("home"),
    [modal, setModal] = useState<Dialog>(null);
  const [motion, setMotion] = useState<Motion | null>(null),
    busy = useRef(false),
    [storageError, setStorageError] = useState(false),
    [eraser, setEraser] = useState(false);
  const [message, setMessage] = useState(
    "Faites glisser pour tourner. Touchez une flèche pour la libérer.",
  );
  const [view, setView] = useState<{ face: Face | null; revision: number }>({
    face: null,
    revision: 0,
  });
  const [notice, setNotice] = useState("");
  const { feedback, syncMusic } = useFeedback(profile.settings);
  const commit = useCallback((next: Profile) => {
    profileRef.current = next;
    setProfile(next);
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(next));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, []);
  const restoreCloud = useCallback(
    (restored: Profile) => {
      const level = LEVELS[restored.session.index];
      const ids = new Set(level.arrows.map((a) => a.id));
      const session = {
        ...restored.session,
        removed: [...new Set(restored.session.removed)].filter((id) =>
          ids.has(id),
        ),
        blocked: [...new Set(restored.session.blocked)].filter((id) =>
          ids.has(id),
        ),
        hint:
          restored.session.hint && ids.has(restored.session.hint)
            ? restored.session.hint
            : null,
      };
      busy.current = false;
      setMotion(null);
      setEraser(false);
      setScreen("home");
      setModal(null);
      commit({ ...restored, session });
    },
    [commit],
  );
  const cloud = useCloudSave(ready, profile, restoreCloud);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = readProfile(localStorage.getItem(SAVE_KEY)),
          level = LEVELS[saved.session.index],
          ids = new Set(level.arrows.map((a) => a.id));
        saved.session.removed = [...new Set(saved.session.removed)].filter(
          (id) => ids.has(id),
        );
        saved.session.blocked = [...new Set(saved.session.blocked)].filter(
          (id) => ids.has(id),
        );
        if (saved.session.hint && !ids.has(saved.session.hint))
          saved.session.hint = null;
        if (saved.session.removed.length === level.arrows.length)
          saved.session.finished = true;
        commit(saved);
      } catch {
        setStorageError(true);
      }
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [commit]);
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const p = profileRef.current,
        next = refreshEnergy(p, now);
      if (next !== p) commit(next);
    };
    const timer = setInterval(tick, 1000);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", tick);
    };
  }, [commit]);
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    let initial: string | null = null;
    const check = async () => {
      try {
        const response = await fetch("/version.json", { cache: "no-store" }),
          data = await response.json();
        if (initial && initial !== data.version) setModal("update");
        initial = data.version;
      } catch {}
    };
    void check();
    const timer = setInterval(check, 60000);
    return () => clearInterval(timer);
  }, []);
  const { index, removed, blocked, lives, hint } = profile.session,
    level = LEVELS[index],
    arrows = level.arrows.filter((a) => !removed.includes(a.id)),
    won = arrows.length === 0,
    score = removed.length * POINTS_PER_ARROW;
  function load(next: number, force = false) {
    if (busy.current) return;
    const result = beginSession(profileRef.current, next, force);
    commit(result.profile);
    if (result.reason) {
      if (result.reason === "energy") setModal("energy");
      else
        setNotice(
          "Terminez le niveau précédent ou activez l’accès test dans les réglages.",
        );
      return;
    }
    setView((v) => ({ face: null, revision: v.revision + 1 }));
    setEraser(false);
    setScreen("game");
    window.scrollTo({ top: 0, behavior: "instant" });
    setModal(null);
    setMessage("Observez les passages. Chaque flèche compte.");
  }
  function removePower(ids: string[], kind: "erasers" | "wands") {
    const p = profileRef.current;
    if (!p[kind] || !ids.length || !p.session.lives) return;
    commit(
      removeFromSession(
        { ...p, [kind]: p[kind] - 1 },
        ids,
        level.arrows.length,
      ),
    );
    setEraser(false);
    feedback(true);
    setMessage(
      kind === "erasers"
        ? "La flèche sélectionnée a été effacée."
        : `${ids.length} flèches ont été libérées par la baguette.`,
    );
  }
  function extract(id: string) {
    if (busy.current || modal || screen !== "game" || !lives || won) return;
    if (eraser) {
      removePower([id], "erasers");
      return;
    }
    const result = tryExtract(level, arrows, id);
    busy.current = true;
    feedback(result.ok);
    setMessage(
      result.ok
        ? "La flèche sort du cube."
        : "Cette flèche est bloquée. Elle revient à sa place.",
    );
    setMotion({
      id,
      kind: result.ok ? "extract" : "blocked",
      route: result.ok
        ? result.route
        : {
            ...result.route,
            steps: result.route.steps.slice(0, result.collisionIndex + 1),
          },
      startedAt: performance.now(),
      reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
  }
  const finish = useCallback(
    (id: string, kind: Motion["kind"]) => {
      const p = profileRef.current,
        s = p.session;
      if (kind === "blocked") {
        const left = Math.max(0, s.lives - 1);
        commit({
          ...p,
          session: {
            ...s,
            lives: left,
            blocked: s.blocked.includes(id) ? s.blocked : [...s.blocked, id],
          },
        });
        setMessage(
          "Cette flèche est bloquée. Libérez son passage avant de réessayer.",
        );
        if (!left) setModal("lost");
      } else {
        commit(removeFromSession(p, [id], LEVELS[s.index].arrows.length));
        setMessage("Passage libéré. À vous de trouver le suivant.");
      }
      setMotion(null);
      busy.current = false;
    },
    [commit],
  );
  function showHint() {
    if (busy.current || modal || won || !lives) return;
    setEraser(false);
    const p = profileRef.current,
      s = p.session;
    if (s.hint && arrows.some((a) => a.id === s.hint)) {
      setView((v) => ({
        face: arrows.find((a) => a.id === s.hint)!.cells.at(-1)!.face,
        revision: v.revision + 1,
      }));
      return;
    }
    if (!p.hints) {
      setModal("atouts");
      return;
    }
    const a = arrows.find((a) => tryExtract(level, arrows, a.id).ok);
    if (a) {
      commit({ ...p, hints: p.hints - 1, session: { ...s, hint: a.id } });
      setView((v) => ({
        face: a.cells.at(-1)!.face,
        revision: v.revision + 1,
      }));
      setMessage("La flèche en bleu peut sortir. Touchez-la sur le cube.");
    }
  }
  function armEraser() {
    if (!profile.erasers) {
      setModal("atouts");
      return;
    }
    setEraser((v) => !v);
    setMessage(
      eraser
        ? "Gomme rangée."
        : "Gomme active : touchez la flèche à supprimer, même si elle est bloquée.",
    );
  }
  function useWand() {
    if (!profile.wands) {
      setModal("atouts");
      return;
    }
    removePower(wandTargets(level, removed), "wands");
  }
  function openChest(floor: number) {
    const p = profileRef.current,
      next = claimChest(p, floor);
    if (next === p) return;
    commit(next);
    setNotice(
      `Coffre ${floor} récupéré : +${next.coins - p.coins} pièces et +${next.hints - p.hints} indices.`,
    );
  }
  function toggleSetting(key: keyof Profile["settings"]) {
    const p = profileRef.current,
      value = !p.settings[key];
    if (key === "music") syncMusic(value);
    commit({ ...p, settings: { ...p.settings, [key]: value } });
  }
  const go = (next: Screen) => {
    if (busy.current) return;
    setEraser(false);
    setNotice("");
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const tests = () => {
    const p = profileRef.current;
    commit({ ...p, testAccess: !p.testAccess });
  };
  const closeModal = () => setModal(null);
  if (!ready)
    return (
      <main className="boot-screen">
        <Box size={38} />
        <h1>Cubelyo</h1>
        <p>Préparation de votre aventure…</p>
      </main>
    );
  return (
    <main
      className={`app-shell ${screen === "game" ? "playing" : "browsing new-home"} ${screen === "shop" ? "shop-mode" : ""}`}
    >
      <header className="topbar">
        <button
          className="icon-button settings-button"
          aria-label="Réglages"
          disabled={!!motion}
          onClick={() => setModal("settings")}
        >
          <Settings size={23} />
        </button>
        <button
          className="brand"
          aria-label="Cubelyo, accueil"
          disabled={!!motion}
          onClick={() => go("home")}
        >
          <Box size={24} />
          <span>Cubelyo</span>
        </button>
        <EnergyCounter
          profile={profile}
          disabled={!!motion}
          onOpen={() => setModal("energy")}
        />
        <button
          className="wallet"
          aria-label={`${profile.coins} pièces`}
          disabled={!!motion}
          onClick={() => go("shop")}
        >
          <Coins size={20} />
          <strong>{profile.coins.toLocaleString("fr-FR")}</strong>
        </button>
        {screen === "game" && (
          <button
            className="icon-button tower-shortcut"
            aria-label="Tour des récompenses"
            disabled={!!motion}
            onClick={() => go("tower")}
          >
            <Layers3 size={20} />
          </button>
        )}
      </header>
      {cloud.state === "conflict" && (
        <button
          className="cloud-conflict-notice"
          disabled={!!motion}
          onClick={() => setModal("settings")}
        >
          Une autre sauvegarde est disponible · Vérifier
        </button>
      )}
      {storageError && (
        <p className="save-warning" role="alert">
          La sauvegarde est indisponible sur cet appareil. Gardez cette page
          ouverte pour conserver la partie.
        </p>
      )}
      {screen === "home" ? (
        <HomeScreen
          profile={profile}
          onPlay={load}
          onTests={tests}
          onPromotion={setModal}
          onTower={() => go("tower")}
        />
      ) : screen === "tower" ? (
        <ProgressScreens
          profile={profile}
          onClaim={openChest}
          onBack={() => go("home")}
          onInfo={() => setModal("tower-info")}
        />
      ) : screen === "shop" ? (
        <ShopScreen />
      ) : (
        <section className="game-layout" aria-label={level.title}>
          <div className="game-top">
            <button
              className="icon-button"
              aria-label="Retour à l’accueil"
              disabled={!!motion}
              onClick={() => go("home")}
            >
              <ArrowLeft />
            </button>
            <div className="level-title">
              <span className="eyebrow">L’aventure · {index + 1} / 100</span>
              <h1>{level.title}</h1>
              <span
                className={`difficulty ${difficultyAt(index + 1) === "Très difficile" ? "expert" : ""}`}
              >
                {difficultyAt(index + 1)}
              </span>
            </div>
            <button
              className="icon-button"
              aria-label="Mettre en pause"
              disabled={!!motion || won}
              onClick={() => setModal(lives ? "pause" : "lost")}
            >
              <Pause />
            </button>
          </div>
          <div className="game-stats">
            <div
              className="lives"
              role="img"
              aria-label={`${lives} vies restantes`}
            >
              {[1, 2, 3].map((n) => (
                <Heart
                  key={n}
                  size={25}
                  fill={lives >= n ? "currentColor" : "none"}
                  className={lives >= n ? "" : "empty"}
                />
              ))}
            </div>
            <div className="score">
              <span>Score</span>
              <strong>{score.toLocaleString("fr-FR")}</strong>
            </div>
            <div className="remaining">
              <ArrowUp size={18} />
              <strong>{arrows.length}</strong>
              <span>flèches</span>
            </div>
          </div>
          <div className={`canvas-wrap ${eraser ? "eraser-active" : ""}`}>
            <CubeScene
              key={level.id}
              level={level}
              arrows={arrows}
              motion={motion}
              blocked={blocked}
              hint={hint}
              onTap={extract}
              onDone={finish}
              view={view}
              zoom={9}
            />
            {!won && (
              <span className="rotate-help">
                <Rotate3D size={15} />
                Glissez pour tourner · Pincez pour zoomer
              </span>
            )}
            {won && (
              <div className="victory">
                <div className="victory-icon">
                  <Trophy size={33} />
                </div>
                <h2>La voie est libre.</h2>
                <p>Les six faces n’ont plus de secrets pour vous.</p>
                <div
                  className="victory-medals"
                  aria-label={`${lives} médailles`}
                >
                  {[1, 2, 3].map((n) => (
                    <Medal
                      key={n}
                      size={29}
                      className={lives >= n ? "earned" : ""}
                    />
                  ))}
                </div>
                <div className="result-values">
                  <span>
                    <small>Score</small>
                    <strong>{score}</strong>
                  </span>
                  <span>
                    <small>
                      {profile.session.reward
                        ? "Pièces gagnées"
                        : "Déjà récompensé"}
                    </small>
                    <strong>
                      <Coins size={19} />
                      {profile.session.reward ?? 0}
                    </strong>
                  </span>
                </div>
                <p className="muted reward-note">
                  Récompense attribuée une seule fois par niveau.
                </p>
                <button
                  className="primary"
                  onClick={() => (index === 99 ? go("tower") : load(index + 1))}
                >
                  {index === 99 ? "Voir ma tour" : "Niveau suivant"}
                  <ArrowRight size={18} />
                </button>
                <button className="text-button" onClick={() => go("tower")}>
                  <Layers3 size={17} />
                  Voir ma tour
                </button>
              </div>
            )}
            {!lives && !modal && !won && (
              <div className="victory">
                <Heart size={38} />
                <h2>Plus de cœurs.</h2>
                <button className="primary" onClick={() => setModal("lost")}>
                  Voir les options
                </button>
              </div>
            )}
          </div>
          <div className="game-footer">
            <p role="status" aria-live="polite">
              {won
                ? "Casse-tête terminé. Votre progression est sauvegardée."
                : message}
            </p>
            <div className="powerups">
              <button
                className={`powerup ${hint ? "armed" : ""}`}
                aria-label="Un indice"
                aria-pressed={!!hint}
                disabled={!!motion || won || !lives}
                onClick={showHint}
              >
                <span className="powerup-art">
                  <Lightbulb size={29} />
                </span>
                <span>Indice</span>
                <small className="stock-badge">{profile.hints}</small>
              </button>
              <button
                className={`powerup ${eraser ? "armed" : ""}`}
                aria-label="Gomme"
                aria-pressed={eraser}
                disabled={!!motion || won || !lives}
                onClick={armEraser}
              >
                <span className="powerup-art">
                  <Eraser size={29} />
                </span>
                <span>Gomme</span>
                <small className="stock-badge">{profile.erasers}</small>
              </button>
              <button
                className="powerup"
                aria-label="Baguette"
                disabled={!!motion || won || !lives}
                onClick={useWand}
              >
                <span className="powerup-art">
                  <Sparkles size={29} />
                </span>
                <span>Baguette</span>
                <small className="stock-badge">{profile.wands}</small>
              </button>
            </div>
            <p className="gold-legend">
              <i /> Une arête dorée prolonge le trajet sur la face voisine.
            </p>
          </div>
          {profile.testAccess && (
            <label className="test-picker">
              Accès libre pour les tests
              <select
                aria-label="Choisir un niveau"
                value={index}
                disabled={!!motion}
                onChange={(e) => load(Number(e.target.value), true)}
              >
                {LEVELS.map((l, i) => (
                  <option key={l.id} value={i}>
                    {i + 1} · {difficultyAt(i + 1)} · {l.arrows.length} flèches
                  </option>
                ))}
              </select>
            </label>
          )}
        </section>
      )}
      {screen !== "game" && (
        <nav
          className="bottom-nav game-navigation"
          aria-label="Navigation principale"
        >
          {[
            { s: "shop", label: "Boutique", Icon: ShoppingBag },
            { s: "home", label: "Accueil", Icon: Home },
            { s: "tower", label: "Tour", Icon: Layers3 },
          ].map(({ s, label, Icon }) => (
            <button
              key={s}
              className={screen === s ? "active" : ""}
              onClick={() => go(s as Screen)}
            >
              <Icon size={24} />
              {label}
            </button>
          ))}
        </nav>
      )}
      {notice && (
        <p className="chest-notice" role="status">
          {notice}
          <button className="text-button" onClick={() => setNotice("")}>
            Fermer
          </button>
        </p>
      )}
      {modal && (
        <Modal
          title={
            modal === "pause"
              ? "Un instant pour réfléchir."
              : modal === "restart"
                ? "Nouvelle tentative ?"
                : modal === "lost"
                  ? "Plus de cœurs pour ce cube."
                  : modal === "atouts"
                    ? "Votre réserve d’atouts"
                    : modal === "settings"
                      ? "Réglages"
                      : modal === "energy"
                        ? "Vos étoiles"
                        : modal === "privacy"
                          ? "Vos données"
                          : modal === "starter"
                            ? "Offre de départ"
                            : modal === "special"
                              ? "Offre du moment"
                              : modal === "tower-info"
                                ? "La tour des récompenses"
                                : "Une mise à jour est disponible"
          }
          onClose={closeModal}
        >
          {modal === "tower-info" ? (
            <TowerHelp onClose={closeModal} />
          ) : modal === "starter" || modal === "special" ? (
            <PromotionOffer
              kind={modal}
              onShop={() => {
                setModal(null);
                go("shop");
              }}
            />
          ) : modal === "pause" ? (
            <>
              <p>
                Votre partie est sauvegardée. Reprendre ne coûte aucune étoile.
              </p>
              <div className="modal-actions">
                <button className="primary" onClick={() => setModal(null)}>
                  <Play size={18} />
                  Reprendre
                </button>
                <button onClick={() => setModal("restart")}>
                  <RotateCcw size={18} />
                  Recommencer · 1 étoile
                </button>
                <button
                  onClick={() => {
                    setModal(null);
                    go("home");
                  }}
                >
                  Retour à l’accueil
                </button>
              </div>
            </>
          ) : modal === "restart" ? (
            <>
              <p>
                Une nouvelle partie consomme une étoile et remet le cube à zéro
                avec trois cœurs. Vos gains sont conservés.
              </p>
              <div className="modal-actions">
                <button className="primary" onClick={() => load(index, true)}>
                  Recommencer · 1 étoile
                </button>
                <button onClick={() => setModal("pause")}>Annuler</button>
              </div>
            </>
          ) : modal === "lost" ? (
            <>
              <p>
                Vous pouvez continuer ce même cube avec des pièces. Le tarif
                sera défini plus tard.
              </p>
              <div className="modal-actions">
                <button
                  className="gold-button"
                  disabled={
                    CONTINUE_PRICE === null ||
                    profile.coins < (CONTINUE_PRICE ?? 0)
                  }
                  onClick={() => {
                    const next = continueSession(profileRef.current);
                    if (next !== profileRef.current) {
                      commit(next);
                      setModal(null);
                    }
                  }}
                >
                  <Coins size={18} />
                  Continuer · tarif à définir
                </button>
                <button className="primary" onClick={() => load(index, true)}>
                  Recommencer · 1 étoile
                </button>
                <button
                  onClick={() => {
                    setModal(null);
                    go("home");
                  }}
                >
                  Retour à l’accueil
                </button>
              </div>
            </>
          ) : modal === "atouts" ? (
            <>
              <p>
                L’indice révèle une sortie. La gomme efface la flèche choisie,
                même bloquée. La baguette libère jusqu’à trois flèches
                successives.
              </p>
              <div className="inventory-row">
                <span>
                  <Lightbulb />
                  {profile.hints}
                </span>
                <span>
                  <Eraser />
                  {profile.erasers}
                </span>
                <span>
                  <Sparkles />
                  {profile.wands}
                </span>
              </div>
              <p>
                Les prix seront définis plus tard. La PWA ne propose aucun
                achat.
              </p>
              <div className="modal-actions">
                <button
                  onClick={() => {
                    setModal(null);
                    go("tower");
                  }}
                >
                  Voir les récompenses
                </button>
                <button
                  onClick={() => {
                    setModal(null);
                    go("shop");
                  }}
                >
                  Voir la boutique
                </button>
              </div>
            </>
          ) : modal === "energy" ? (
            <>
              <div className="energy-big">
                <Star fill="currentColor" />
                {profile.energy.stars}
                <small>/ 5</small>
              </div>
              <p>
                Une étoile ouvre une nouvelle partie avec trois cœurs. Reprendre
                la partie sauvegardée ne coûte rien.
              </p>
              <p>
                {profile.energy.stars === 5 ? (
                  "Votre réserve est pleine."
                ) : (
                  <>
                    Prochaine étoile dans <EnergyCountdown profile={profile} />.
                    Une étoile toutes les 30 minutes.
                  </>
                )}
              </p>
              <button className="primary" onClick={() => setModal(null)}>
                Compris
              </button>
            </>
          ) : modal === "settings" ? (
            <>
              <div className="setting-list">
                {[
                  { key: "music", label: "Musique", Icon: Music2 },
                  { key: "sound", label: "Effets sonores", Icon: Volume2 },
                  { key: "vibration", label: "Vibrations", Icon: Smartphone },
                ].map(({ key, label, Icon }) => (
                  <label className="setting-row" key={key}>
                    <span>
                      <Icon size={21} />
                      {label}
                    </span>
                    <button
                      role="switch"
                      aria-label={label}
                      aria-checked={
                        profile.settings[key as keyof Profile["settings"]]
                      }
                      onClick={() =>
                        toggleSetting(key as keyof Profile["settings"])
                      }
                    >
                      <i />
                    </button>
                  </label>
                ))}
              </div>
              <div className="test-settings">
                <button
                  className="text-button"
                  onClick={tests}
                  aria-pressed={profile.testAccess}
                >
                  <FlaskConical size={18} />
                  {profile.testAccess
                    ? "Désactiver l’accès libre aux niveaux"
                    : "Activer l’accès libre aux niveaux"}
                </button>
                <small>
                  Réservé à vos essais. Les étoiles restent consommées.
                </small>
              </div>
              <div className="cloud-settings">
                <p role="status">
                  {
                    {
                      local: "Sauvegarde sur cet appareil",
                      connecting: "Connexion à la sauvegarde…",
                      saved: "Sauvegarde synchronisée",
                      saving: "Synchronisation en cours…",
                      error:
                        "Synchronisation indisponible · copie locale conservée",
                      conflict: "Deux sauvegardes à départager",
                    }[cloud.state]
                  }
                </p>
                {cloud.enabled && cloud.state !== "local" && (
                  <button onClick={cloud.pause}>
                    Désactiver la sauvegarde en ligne
                  </button>
                )}
                {cloud.state === "error" && (
                  <button onClick={cloud.retry}>
                    Réessayer la synchronisation
                  </button>
                )}
                {cloud.state === "local" && cloud.enabled && (
                  <button onClick={cloud.activate}>
                    Activer la sauvegarde en ligne
                  </button>
                )}
                {cloud.state === "conflict" && (
                  <>
                    <p>
                      Choisissez la version à conserver. Les pièces et atouts ne
                      sont pas additionnés.
                    </p>
                    <button onClick={() => cloud.resolve("local")}>
                      Conserver cet appareil
                    </button>
                    <button onClick={() => cloud.resolve("cloud")}>
                      Restaurer la sauvegarde en ligne
                    </button>
                  </>
                )}
              </div>
              <div className="settings-links">
                <button
                  className="text-button"
                  onClick={() => setModal("privacy")}
                >
                  Confidentialité
                </button>
                <a href="/confidentialite">Politique de confidentialité</a>
                <a href="/conditions-utilisation">Conditions d’utilisation</a>
                <a href="/conditions-vente">Conditions de vente</a>
                <a href="/mentions-legales">Mentions légales</a>
                <a href="/droits-rgpd">Droits RGPD et sauvegarde</a>
                <a href="mailto:support@javachrist.fr">Nous contacter</a>
                <button disabled className="text-button">
                  Restaurer les achats · sur les stores
                </button>
              </div>
              <small className="build-label">
                Cubelyo · PWA de test · 0.13.0
              </small>
            </>
          ) : modal === "privacy" ? (
            <>
              <p>
                Cette PWA de test conserve votre progression, vos réglages et
                vos récompenses dans ce navigateur. Aucun compte, paiement ou
                publicité n’est connecté.
              </p>
              <p>
                Effacer les données du navigateur supprime cette sauvegarde
                locale.
              </p>
              <a href="/confidentialite">
                Lire la politique de confidentialité
              </a>
              <a href="/droits-rgpd">Exporter ou effacer ma sauvegarde</a>
              <button onClick={() => setModal("settings")}>
                Retour aux réglages
              </button>
            </>
          ) : (
            <>
              <p>
                Votre progression est sauvegardée. Rechargez pour utiliser la
                nouvelle version.
              </p>
              <div className="modal-actions">
                <button
                  className="primary"
                  onClick={() => window.location.reload()}
                >
                  Mettre à jour
                </button>
                <button onClick={() => setModal(null)}>Plus tard</button>
              </div>
            </>
          )}
        </Modal>
      )}
    </main>
  );
}
