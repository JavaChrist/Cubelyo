"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Box,
  Coins,
  Heart,
  Layers3,
  Lightbulb,
  Pause,
  Play,
  Rotate3D,
  RotateCcw,
  Star,
  Trophy,
} from "lucide-react";
import { LEVELS, difficultyAt } from "../levels/campaign";
import { tryExtract, type Face } from "./core/engine";
import {
  SAVE_KEY,
  POINTS_PER_ARROW,
  claimChest,
  completeLevel,
  levelReward,
  newProfile,
  newSession,
  readProfile,
  type Profile,
} from "../progression/profile";
import { Modal } from "./Modal";
import { ProgressScreens } from "./ProgressScreens";
import type { Motion } from "./render/CubeScene";
const CubeScene = dynamic(() => import("./render/CubeScene"), {
  ssr: false,
  loading: () => <div className="canvas-fallback">Préparation du cube…</div>,
});
type Dialog = "pause" | "restart" | "hints" | "lost" | "update" | null;
export default function Game() {
  const [profile, setProfile] = useState<Profile>(newProfile),
    profileRef = useRef(profile);
  const [ready, setReady] = useState(false),
    [screen, setScreen] = useState<"game" | "levels" | "tower">("game"),
    [modal, setModal] = useState<Dialog>(null);
  const [motion, setMotion] = useState<Motion | null>(null),
    busy = useRef(false),
    [storageError, setStorageError] = useState(false);
  const [message, setMessage] = useState(
    "Faites glisser pour tourner. Touchez une flèche pour la libérer.",
  );
  const [view, setView] = useState<{ face: Face | null; revision: number }>({
    face: null,
    revision: 0,
  });
  const [notice, setNotice] = useState("");
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
        profileRef.current = saved;
        setProfile(saved);
      } catch {
        setStorageError(true);
      }
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
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
    const p = profileRef.current;
    if (
      force ||
      next !== p.session.index ||
      !p.session.lives ||
      p.session.removed.length === LEVELS[next].arrows.length
    )
      commit({ ...p, session: newSession(next) });
    setView((v) => ({ face: null, revision: v.revision + 1 }));
    setScreen("game");
    setModal(null);
    setMessage("Observez les passages. Chaque flèche compte.");
  }
  function extract(id: string) {
    if (busy.current || modal || screen !== "game" || !lives || won) return;
    const result = tryExtract(level, arrows, id);
    busy.current = true;
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
            hint: s.hint,
          },
        });
        setMessage(
          "Cette flèche est bloquée. Libérez son passage avant de réessayer.",
        );
        if (!left) setModal("lost");
      } else {
        const removed = s.removed.includes(id) ? s.removed : [...s.removed, id];
        let next: Profile = { ...p, session: { ...s, removed, hint: null } };
        if (removed.length === LEVELS[s.index].arrows.length) {
          next.session = {
            ...next.session,
            reward: p.completed[s.index + 1] ? 0 : levelReward(s.index + 1),
          };
          next = completeLevel(
            next,
            s.index + 1,
            removed.length * POINTS_PER_ARROW,
            s.lives,
          );
        }
        commit(next);
        setMessage("Passage libéré. À vous de trouver le suivant.");
      }
      setMotion(null);
      busy.current = false;
    },
    [commit],
  );
  function showHint() {
    if (busy.current || modal || won || !lives) return;
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
      setModal("hints");
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
  function buyHint() {
    const p = profileRef.current;
    if (p.coins < 50) return;
    commit({ ...p, coins: p.coins - 50, hints: p.hints + 1 });
    setModal(null);
    setMessage("Un indice ajouté à votre réserve.");
  }
  function openChest(floor: number) {
    const p = profileRef.current,
      next = claimChest(p, floor);
    if (next === p) return;
    commit(next);
    setNotice(
      `Coffre de l’étage ${floor} récupéré : +${next.coins - p.coins} pièces et +${next.hints - p.hints} indices.`,
    );
  }
  const closeModal = () => {
    setModal(null);
    if (!lives) setScreen("levels");
  };
  if (!ready)
    return (
      <main className="boot-screen">
        <Box size={38} />
        <h1>Cubelyo</h1>
        <p>Préparation de votre aventure…</p>
      </main>
    );
  return (
    <main className={`app-shell ${screen === "game" ? "playing" : "browsing"}`}>
      <header className="topbar">
        <button
          className="brand"
          aria-label="Cubelyo, niveaux"
          disabled={!!motion}
          onClick={() => setScreen("levels")}
        >
          <Box size={27} strokeWidth={1.7} />
          <span>
            Cubelyo<small>Un passage. Six faces.</small>
          </span>
        </button>
        <div className="wallet" aria-label={`${profile.coins} pièces`}>
          <Coins size={20} />
          <strong>{profile.coins.toLocaleString("fr-FR")}</strong>
        </div>
        <button
          className="icon-button tower-shortcut"
          aria-label="Tour des récompenses"
          disabled={!!motion}
          onClick={() => setScreen("tower")}
        >
          <Layers3 size={22} />
        </button>
      </header>
      {storageError && (
        <p className="save-warning" role="alert">
          La sauvegarde est indisponible sur cet appareil. Gardez cette page
          ouverte pour conserver la partie.
        </p>
      )}
      {screen !== "game" ? (
        <>
          <ProgressScreens
            screen={screen}
            profile={profile}
            onPlay={load}
            onScreen={setScreen}
            onClaim={openChest}
          />
          {notice && (
            <p className="chest-notice" role="status">
              {notice}
            </p>
          )}
        </>
      ) : (
        <section className="game-layout" aria-label={level.title}>
          <div className="game-top">
            <button
              className="icon-button"
              aria-label="Retour aux niveaux"
              disabled={!!motion}
              onClick={() => setScreen("levels")}
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
          <div className="canvas-wrap">
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
                <div className="victory-stars" aria-label={`${lives} étoiles`}>
                  {[1, 2, 3].map((n) => (
                    <Star
                      key={n}
                      size={36}
                      fill={lives >= n ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                <h2>La voie est libre.</h2>
                <p>Les six faces n’ont plus de secrets pour vous.</p>
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
                  onClick={() =>
                    index === 99 ? setScreen("tower") : load(index + 1)
                  }
                >
                  {index === 99 ? "Voir ma tour" : "Niveau suivant"}
                  <ArrowRight size={18} />
                </button>
                <button
                  className="text-button"
                  onClick={() => setScreen("tower")}
                >
                  <Layers3 size={17} />
                  {Object.keys(profile.completed).length} étage
                  {Object.keys(profile.completed).length > 1 ? "s" : ""}{" "}
                  construit
                  {Object.keys(profile.completed).length > 1 ? "s" : ""} · Voir
                  ma tour
                </button>
              </div>
            )}
            {!lives && !modal && !won && (
              <div className="victory">
                <Heart size={38} />
                <h2>Une nouvelle approche ?</h2>
                <button className="primary" onClick={() => load(index, true)}>
                  Recommencer avec 3 vies
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
            <button
              className="hint-button"
              aria-label="Un indice"
              disabled={!!motion || won || !lives}
              onClick={showHint}
            >
              <span className="hint-icon">
                <Lightbulb size={30} />
              </span>
              <span>
                Un indice
                <small>
                  {hint
                    ? "Déjà révélé"
                    : `${profile.hints} disponible${profile.hints > 1 ? "s" : ""}`}
                </small>
              </span>
              <span className="stock-badge">{profile.hints}</span>
            </button>
            <p className="gold-legend">
              <i /> Une arête dorée prolonge le trajet sur la face voisine.
            </p>
          </div>
          <label className="test-picker">
            Sélection libre pour vos essais
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
        </section>
      )}
      {modal && (
        <Modal
          title={
            modal === "pause"
              ? "Un instant pour réfléchir."
              : modal === "restart"
                ? "Recommencer ce niveau ?"
                : modal === "lost"
                  ? "Plus de vies pour ce cube."
                  : modal === "hints"
                    ? "Un petit coup de pouce ?"
                    : "Une mise à jour est disponible"
          }
          onClose={closeModal}
        >
          {modal === "pause" ? (
            <>
              <p>
                Votre partie est sauvegardée. Vous pouvez reprendre exactement
                où vous en étiez.
              </p>
              <div className="modal-actions">
                <button className="primary" onClick={() => setModal(null)}>
                  <Play size={18} />
                  Reprendre
                </button>
                <button onClick={() => setModal("restart")}>
                  <RotateCcw size={18} />
                  Recommencer
                </button>
                <button
                  onClick={() => {
                    setModal(null);
                    setScreen("tower");
                  }}
                >
                  <Layers3 size={18} />
                  Voir ma tour
                </button>
              </div>
            </>
          ) : modal === "restart" ? (
            <>
              <p>
                Le cube et ses trois vies seront réinitialisés. Vos pièces,
                indices et récompenses sont conservés.
              </p>
              <div className="modal-actions">
                <button className="primary" onClick={() => load(index, true)}>
                  Oui, recommencer
                </button>
                <button onClick={() => setModal("pause")}>Annuler</button>
              </div>
            </>
          ) : modal === "lost" ? (
            <>
              <p>
                Trois passages bloqués, mais rien n’est perdu. Essayez un autre
                ordre pour libérer le cube.
              </p>
              <div className="modal-actions">
                <button className="primary" onClick={() => load(index, true)}>
                  Recommencer avec 3 vies
                </button>
                <button
                  onClick={() => {
                    setModal(null);
                    setScreen("levels");
                  }}
                >
                  Retour aux niveaux
                </button>
              </div>
            </>
          ) : modal === "hints" ? (
            <>
              <p>
                Un indice révèle une flèche qui peut sortir. Les coffres de la
                tour en contiennent aussi.
              </p>
              <div className="modal-actions">
                <button
                  className="gold-button"
                  disabled={profile.coins < 50}
                  onClick={buyHint}
                >
                  <Coins size={18} />1 indice · 50 pièces
                </button>
                {profile.coins < 50 && (
                  <small>
                    Vous avez {profile.coins} pièces. Aucun paiement n’est
                    nécessaire.
                  </small>
                )}
                <button
                  onClick={() => {
                    setModal(null);
                    setScreen("tower");
                  }}
                >
                  Voir les coffres
                </button>
              </div>
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
