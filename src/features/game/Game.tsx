"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { App } from "@capacitor/app";
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
  beginSession,
  buyItem,
  chestReward,
  claimChest,
  continueSession,
  medalsOf,
  newProfile,
  readProfile,
  refreshEnergy,
  refreshSeason,
  removeFromSession,
  type Profile,
} from "../progression/profile";
import { EnergyCounter, EnergyCountdown } from "./EnergyDisplay";
import { Modal } from "./Modal";
import { PromotionOffer } from "./PromotionOffer";
import { HomeScreen } from "./HomeScreen";
import { TowerHelp } from "./TowerHelp";
import { ProgressScreens, RewardCard, type Lot } from "./ProgressScreens";
import { CoinShop, itemLabel } from "../shop/CoinShop";
import { WELCOME_GIFT, type CoinItem } from "../shop/catalog";
import { flyCoins, prefersReducedMotion } from "./coinBurst";
import { ShopScreen } from "./ShopScreen";
import { useFeedback } from "./useFeedback";
import { wandTargets } from "./powerups";
import { isFreeRetry, type LastBlock } from "./retry";
import versionFile from "../../../public/version.json";
/** Numéro x.y.z de public/version.json (le suffixe ne sert qu'aux notes internes). */
const APP_VERSION = versionFile.version.split("-")[0];
import { useCloudSave } from "../cloud/useCloudSave";
import { useHideAdBanner } from "../ads/AdsProvider";
import { AdChoicesButton } from "../ads/AdChoices";
import { usePromotion } from "../promotions/PromotionProvider";
import { useBilling } from "../billing/BillingProvider";
import type { PurchaseEntry } from "../billing/attribution";
import { playProduct } from "../billing/products";
import { clearPromotions, hasPromotionsData } from "../promotions/storage";
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
    // Flèche rouge réessayée sans rien changer au cube : pas de cœur en moins.
    lastBlock = useRef<LastBlock | null>(null),
    freeRetry = useRef(false),
    [storageError, setStorageError] = useState(false),
    [eraser, setEraser] = useState(false);
  const [message, setMessage] = useState("");
  const [view, setView] = useState<{ face: Face | null; revision: number }>({
    face: null,
    revision: 0,
  });
  const [notice, setNotice] = useState("");
  /** Petite carte de récompense (coffre, achat, cadeau d'accueil). */
  const [reward, setReward] = useState<{
    title: string;
    lot: Lot;
    note?: string;
  } | null>(null);
  /** Confirmation d'achat dans la modale où il a eu lieu. */
  const [bought, setBought] = useState<{ modal: Dialog; text: string } | null>(
    null,
  );
  const boughtText = bought && bought.modal === modal ? bought.text : undefined;
  const { feedback, syncMusic } = useFeedback(profile.settings);
  const wallet = useRef<HTMLButtonElement>(null);
  /** Valeur affichée pendant le vol des pièces ; null = valeur réelle du profil. */
  const [shownCoins, setShownCoins] = useState<number | null>(null);
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
  // Achats crédités par le serveur dans la sauvegarde en ligne, reportés ici : carte de récompense sur place.
  const creditedOnline = useCallback(
    (credited: Profile, entries: PurchaseEntry[]) => {
      commit(credited);
      const lot: Lot = {};
      for (const { grant } of entries)
        for (const key of ["coins", "hints", "erasers", "wands"] as const)
          if (grant[key]) lot[key] = (lot[key] ?? 0) + grant[key];
      setModal(null);
      setReward({
        title: "Achat réussi",
        lot,
        note: entries
          .map((e) => playProduct(e.product)?.title ?? e.product)
          .join(", "),
      });
    },
    [commit],
  );
  const cloud = useCloudSave(ready, profile, restoreCloud, creditedOnline);
  const billing = useBilling();
  const {
    queue: purchased,
    settle,
    message: billingMessage,
    clearMessage,
  } = billing;
  // Achats vérifiés par une version précédente (file locale) : crédités dans la sauvegarde, puis carte de récompense.
  useEffect(() => {
    if (!ready || !purchased.length) return;
    let p = profileRef.current;
    const lot: Lot = {};
    for (const { grant } of purchased) {
      p = {
        ...p,
        coins: p.coins + grant.coins,
        hints: p.hints + grant.hints,
        erasers: p.erasers + grant.erasers,
        wands: p.wands + grant.wands,
      };
      for (const key of ["coins", "hints", "erasers", "wands"] as const)
        if (grant[key]) lot[key] = (lot[key] ?? 0) + grant[key];
    }
    commit(p);
    for (const { token } of purchased) settle(token);
    setModal(null);
    setReward({
      title: "Achat réussi",
      lot,
      note: purchased
        .map((q) => playProduct(q.productId)?.title ?? q.productId)
        .join(", "),
    });
  }, [ready, purchased, settle, commit]);
  // Message d'achat (paiement en attente, restauration) : affiché comme les autres avis.
  const shownNotice = notice || billingMessage;
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
        next = refreshSeason(refreshEnergy(p, now), now);
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
    medals = medalsOf(profile.session),
    score = removed.length * POINTS_PER_ARROW;
  const welcomeOpen =
    !reward && !profile.welcomed && screen === "home" && !modal;
  // Bannière AdMob (vue native au-dessus de la page) : jamais pendant un niveau ni sur une fenêtre.
  useHideAdBanner(screen === "game" || !!modal || !!reward || welcomeOpen);
  // Promotion JavaChrist : seulement à un moment calme, jamais pendant un niveau en cours.
  const gameCompleted = usePromotion(
    (screen === "game" && !won) || !!modal || !!reward || welcomeOpen,
  );
  // Une victoire compte une fois, au moment où le dernier coup est joué (pas au rechargement).
  const lastWin = useRef<{ index: number; won: boolean } | null>(null);
  useEffect(() => {
    if (!ready) return;
    const before = lastWin.current;
    lastWin.current = { index, won };
    if (won && before && before.index === index && !before.won) gameCompleted();
  }, [ready, index, won, gameCompleted]);
  const [, setPromoDataRevision] = useState(0);
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
    setMessage("");
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
    freeRetry.current =
      !result.ok && isFreeRetry(lastBlock.current, profile.session, id);
    feedback(result.ok, true);
    setMessage(
      result.ok
        ? "La flèche sort du cube."
        : freeRetry.current
          ? "Toujours bloquée. Libérez d’abord son passage."
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
      if (kind === "blocked" && freeRetry.current) {
        // Même flèche rouge, cube inchangé : l'erreur est déjà comptée.
        freeRetry.current = false;
        setMessage(
          "Toujours bloquée : aucun cœur en moins. Libérez d’abord son passage.",
        );
      } else if (kind === "blocked") {
        lastBlock.current = { index: s.index, id, removed: s.removed.length };
        const left = Math.max(0, s.lives - 1);
        commit({
          ...p,
          session: {
            ...s,
            lives: left,
            lost: (s.lost ?? 0) + 1,
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
  function openChest(floor: number, chest?: HTMLElement) {
    const p = profileRef.current,
      next = claimChest(p, floor);
    if (next === p) return;
    commit(next);
    setNotice("");
    setReward({ title: `Coffre de l’étage ${floor}`, lot: chestReward(floor) });
    const gain = next.coins - p.coins;
    if (!chest || !wallet.current || !gain || prefersReducedMotion()) return;
    const count = 12;
    setShownCoins(p.coins);
    flyCoins({
      from: chest,
      to: wallet.current,
      count,
      onArrive: (i) =>
        setShownCoins(p.coins + Math.round((gain * (i + 1)) / count)),
      onDone: () => setShownCoins(null),
    });
  }
  function buy(item: CoinItem, quantity: number) {
    const p = profileRef.current,
      next = buyItem(p, item, quantity);
    if (next === p) return;
    commit(next);
    feedback(true);
    const note = `${itemLabel(item, quantity)} pour ${(p.coins - next.coins).toLocaleString("fr-FR")} pièces`;
    // Dans une modale (au premier plan), la confirmation reste dans la modale.
    if (modal) setBought({ modal, text: `Achat réussi : ${note}.` });
    else setReward({ title: "Achat réussi", lot: { [item]: quantity }, note });
  }
  function welcome() {
    const p = profileRef.current;
    if (!p.welcomed) commit({ ...p, welcomed: true });
    setReward(null);
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
  const closeModal = () => {
    setModal(null);
    setBought(null);
  };
  // Retour arrière et mise en arrière-plan : lus via une ref pour ne pas
  // réabonner les écouteurs natifs à chaque rendu.
  const nav = useRef({ back: (): boolean => false, hide: () => {} });
  useEffect(() => {
    nav.current = {
      back() {
        if (busy.current) return true;
        if (reward) setReward(null);
        else if (!profile.welcomed && screen === "home" && !modal) welcome();
        else if (modal) closeModal();
        else if (notice) setNotice("");
        else if (eraser) setEraser(false);
        else if (screen !== "home") go("home");
        else return false;
        return true;
      },
      hide() {
        if (screen === "game" && !modal && lives && !won) setModal("pause");
      },
    };
  });
  useEffect(() => {
    const hidden = () => document.hidden && nav.current.hide();
    document.addEventListener("visibilitychange", hidden);
    if (!Capacitor.isNativePlatform())
      return () => document.removeEventListener("visibilitychange", hidden);
    const back = App.addListener("backButton", () => {
      if (!nav.current.back()) void App.exitApp();
    });
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      void back.then((l) => l.remove());
    };
  }, []);
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
          ref={wallet}
          className="wallet"
          aria-label={`${profile.coins} pièces`}
          disabled={!!motion}
          onClick={() => go("shop")}
        >
          <Coins size={20} />
          <strong>
            {(shownCoins ?? profile.coins).toLocaleString("fr-FR")}
          </strong>
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
        <ShopScreen profile={profile} onBuy={buy} />
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
            {won && (
              <div className="victory">
                <div className="victory-icon">
                  <Trophy size={33} />
                </div>
                <h2>La voie est libre.</h2>
                <p>Les six faces n’ont plus de secrets pour vous.</p>
                <div
                  className="victory-medals"
                  aria-label={`${medals} médailles`}
                >
                  {[1, 2, 3].map((n) => (
                    <Medal
                      key={n}
                      size={29}
                      className={medals >= n ? "earned" : ""}
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
            {(won || message) && (
              <p role="status" aria-live="polite">
                {won
                  ? "Casse-tête terminé. Votre progression est sauvegardée."
                  : message}
              </p>
            )}
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
      {reward ? (
        <RewardCard
          title={reward.title}
          lot={reward.lot}
          note={reward.note}
          onClose={() => setReward(null)}
        />
      ) : (
        !profile.welcomed &&
        screen === "home" &&
        !modal && (
          <RewardCard
            title="Bienvenue dans Cubelyo"
            note="Votre cadeau d’accueil pour bien démarrer"
            lot={WELCOME_GIFT}
            onClose={welcome}
          />
        )
      )}
      {shownNotice && (
        <p className="chest-notice" role="status">
          {shownNotice}
          <button
            className="text-button"
            onClick={() => {
              setNotice("");
              clearMessage();
            }}
          >
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
                  Recommencer
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
                Le cube est remis à zéro. Vous gardez vos {lives} cœur
                {lives > 1 ? "s" : ""} et vos gains : aucune étoile n’est
                consommée.
              </p>
              <div className="modal-actions">
                <button className="primary" onClick={() => load(index, true)}>
                  Recommencer
                </button>
                <button onClick={() => setModal("pause")}>Annuler</button>
              </div>
            </>
          ) : modal === "lost" ? (
            <>
              <p>
                Une étoile vous redonne trois cœurs. Continuer conserve les
                flèches déjà libérées ; recommencer remet le cube à zéro.
              </p>
              {!profile.energy.stars && (
                <p>
                  Plus d’étoile en réserve. Prochaine étoile dans{" "}
                  <EnergyCountdown profile={profile} />.
                </p>
              )}
              {/* Reste affiché après l’achat pour garder la confirmation. */}
              {(!profile.energy.stars || boughtText) && (
                <CoinShop
                  profile={profile}
                  items={["stars"]}
                  status={boughtText}
                  onBuy={buy}
                />
              )}
              <div className="modal-actions">
                <button
                  className="gold-button"
                  disabled={!profile.energy.stars}
                  onClick={() => {
                    const next = continueSession(profileRef.current);
                    if (next !== profileRef.current) {
                      commit(next);
                      setModal(null);
                      setMessage("Trois nouveaux cœurs. À vous de jouer.");
                    }
                  }}
                >
                  <Star size={18} fill="currentColor" />
                  Continuer · 1 étoile
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
              <CoinShop
                profile={profile}
                items={["hints", "erasers", "wands"]}
                status={boughtText}
                onBuy={buy}
              />
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
                Une étoile donne trois cœurs, qui vous suivent d’un niveau à
                l’autre. Une nouvelle étoile n’est utilisée que lorsque vos
                trois cœurs sont perdus.
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
              {(profile.energy.stars < 5 || boughtText) && (
                <CoinShop
                  profile={profile}
                  items={["stars"]}
                  status={boughtText}
                  onBuy={buy}
                />
              )}
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
                <Link href="/confidentialite">
                  Politique de confidentialité
                </Link>
                <Link href="/conditions-utilisation">
                  Conditions d’utilisation
                </Link>
                <Link href="/conditions-vente">Conditions de vente</Link>
                <Link href="/mentions-legales">Mentions légales</Link>
                <Link href="/droits-rgpd">Droits RGPD et sauvegarde</Link>
                <a href="mailto:support@javachrist.fr">Nous contacter</a>
                <AdChoicesButton />
                <button
                  className="text-button"
                  disabled={!billing.available || !!billing.busy}
                  onClick={() => void billing.restore()}
                >
                  {billing.available
                    ? billing.busy === "restore"
                      ? "Restauration des achats…"
                      : "Restaurer les achats"
                    : "Restaurer les achats · application Android"}
                </button>
              </div>
              <small className="build-label">
                Cubelyo · Version {APP_VERSION}
              </small>
            </>
          ) : modal === "privacy" ? (
            <>
              <p>
                Votre progression et vos réglages restent enregistrés sur cet
                appareil.
                {cloud.enabled
                  ? " Une identité Firebase anonyme permet aussi la sauvegarde en ligne de la progression, pièces et atouts compris ; vous pouvez la désactiver dans les réglages."
                  : " Aucun compte distant n’est actif dans cette version."}{" "}
                Dans l’application Android, les achats passent par Google Play.
                Notre serveur vérifie chaque achat auprès de Google sans
                l’enregistrer ; seuls des journaux techniques (adresse IP,
                date, résultat) sont gardés par notre hébergeur au plus 30
                jours. L’option sans publicité et la liste des achats crédités
                restent sur l’appareil ; l’historique de commandes reste chez
                Google Play.
              </p>
              <p>
                Dans l’application Android, une bannière Google AdMob s’affiche
                en bas des écrans d’accueil, de la tour et de la boutique,
                jamais pendant un niveau, et seulement si vous avez déclaré
                avoir 18 ans ou plus : sans cette déclaration, aucune publicité
                n’est demandée à Google. L’application ne lit jamais
                l’identifiant publicitaire Android. Après déclaration de
                majorité, le formulaire de Google demande votre accord avant la
                première annonce lorsque Google l’estime requis. Toutes les trois
                victoires, une courte vidéo peut présenter une autre application
                JavaChrist, seulement si vous avez déclaré avoir 18 ans ou plus.
              </p>
              {hasPromotionsData() && (
                <button
                  onClick={() => {
                    clearPromotions();
                    setPromoDataRevision((n) => n + 1);
                  }}
                >
                  Effacer ma réponse sur l’âge et le compteur de vidéos
                </button>
              )}
              <p>
                Désinstaller l’application ou effacer ses données dans Android
                retire la copie locale et fait perdre l’accès à la sauvegarde en
                ligne, sans la supprimer. Pour exporter ou supprimer aussi la
                sauvegarde en ligne, utilisez la page Droits RGPD.
              </p>
              <Link href="/confidentialite">
                Lire la politique de confidentialité
              </Link>
              <Link href="/droits-rgpd">Exporter ou effacer ma sauvegarde</Link>
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
