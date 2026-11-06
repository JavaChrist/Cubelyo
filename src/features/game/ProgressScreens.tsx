"use client";
import {
  ArrowLeft,
  Box,
  Check,
  Coins,
  Flag,
  Info,
  Lightbulb,
  LockKeyhole,
  Trophy,
} from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { chestReward, type Profile } from "../progression/profile";
const FLOOR_HEIGHT = 56;
const LANDSCAPE_HEIGHT = 100 * FLOOR_HEIGHT + 360;
export function TowerBalloon({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`tower-balloon ${small ? "small-balloon" : ""}`}
      aria-hidden="true"
    >
      <div className="balloon-envelope">
        <i />
        <span>
          <Box size={19} strokeWidth={2} />
        </span>
      </div>
      <div className="balloon-rigging" />
      <div className="balloon-basket" />
    </div>
  );
}
export function ChestArt({ claimed = false }: { claimed?: boolean }) {
  return (
    <span
      className={`chest-art ${claimed ? "chest-open" : ""}`}
      aria-hidden="true"
    >
      <i className="chest-lid" />
      <i className="chest-bottom" />
      <i className="chest-belt belt-left" />
      <i className="chest-belt belt-right" />
      <span className="chest-lock">
        {claimed ? <Check size={16} /> : <LockKeyhole size={14} />}
      </span>
      {claimed && (
        <span className="chest-treasure">
          <Coins size={30} />
        </span>
      )}
    </span>
  );
}
export function ProgressScreens({
  profile,
  onClaim,
  onBack,
  onInfo,
}: {
  profile: Profile;
  onClaim: (floor: number) => void;
  onBack: () => void;
  onInfo: () => void;
}) {
  const completed = Object.keys(profile.completed).length;
  const floors = Array.from({ length: 20 }, (_, i) => (i + 1) * 5).reverse();
  const next =
    [...floors].reverse().find((f) => !profile.claimed.includes(f)) ?? 100;
  const allClaimed = floors.every((f) => profile.claimed.includes(f)),
    reward = chestReward(next);
  const world = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = world.current;
    if (!element) return;
    const centerPlayer = () => {
      element.scrollTop =
        element.scrollHeight -
        (80 + completed * FLOOR_HEIGHT) -
        element.clientHeight * 0.55;
    };
    centerPlayer();
    const observer = new ResizeObserver(centerPlayer);
    observer.observe(element);
    return () => observer.disconnect();
  }, [completed]);
  return (
    <section className="tower-adventure" aria-label="Tour des récompenses">
      <div className="tower-heading">
        <button
          className="icon-button"
          aria-label="Retour à l’accueil"
          onClick={onBack}
        >
          <ArrowLeft size={22} />
        </button>
        <div className="tower-name">
          <span className="eyebrow">Votre aventure</span>
          <h1>Tour Cubelyo</h1>
        </div>
        <button
          className="icon-button tower-info-button"
          aria-label="Comment fonctionne la tour ?"
          onClick={onInfo}
        >
          <Info size={23} />
        </button>
      </div>
      <div className="tower-status">
        <div>
          <Flag size={17} />
          <strong>
            {completed}
            <small> / 100 étages</small>
          </strong>
        </div>
        <span>
          {allClaimed
            ? "Tous les coffres récupérés"
            : completed >= next
              ? `Coffre disponible · étage ${next}`
              : `Prochain coffre · étage ${next}`}
        </span>
        <div
          className="tower-progress-meter"
          role="progressbar"
          aria-label="Étages construits"
          aria-valuenow={completed}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${completed}%` }} />
        </div>
      </div>
      <div
        ref={world}
        className="tower-world"
        tabIndex={0}
        role="region"
        aria-label="Tour à explorer, du bas vers le haut"
      >
        <div className="tower-landscape" style={{ height: LANDSCAPE_HEIGHT }}>
          <div className="tower-clouds" aria-hidden="true">
            {Array.from({ length: 24 }, (_, i) => (
              <i
                key={i}
                style={{
                  bottom: `${i * 245 + 60}px`,
                  left: `${i % 2 ? 58 : 30}%`,
                  opacity: i % 3 === 0 ? 0.7 : 0.45,
                }}
              />
            ))}
          </div>
          <div className="tower-building" aria-hidden="true">
            <div className="tower-roof">
              <i />
              <Trophy size={25} />
            </div>
            <div className="tower-cylinder">
              <div className="tower-rail" />
              {Array.from({ length: 100 }, (_, i) => (
                <div
                  key={i}
                  className={`tower-storey ${completed > i ? "storey-built" : ""}`}
                  style={{
                    bottom: i * FLOOR_HEIGHT + 35,
                    height: FLOOR_HEIGHT,
                  }}
                >
                  <span className="arched-window" />
                  {i % 5 === 0 && <i className="tower-ring" />}
                </div>
              ))}
            </div>
          </div>
          {floors.map((floor) => {
            const ready = completed >= floor,
              claimed = profile.claimed.includes(floor),
              lot = chestReward(floor);
            return (
              <article
                key={floor}
                className={`tower-stop ${ready ? "stop-ready" : ""} ${claimed ? "stop-claimed" : ""} ${floor >= 75 ? "royal-stop" : floor >= 35 ? "azure-stop" : "violet-stop"}`}
                style={{ bottom: floor * FLOOR_HEIGHT + 60 }}
                aria-label={`Coffre de l’étage ${floor}`}
              >
                <div className="tower-floor-badge">
                  <span>{floor}</span>
                </div>
                <div className="tower-door" aria-hidden="true">
                  <i />
                  <i />
                </div>
                <div className="tower-balcony" aria-hidden="true">
                  <span className="balcony-top" />
                  <span className="balcony-face" />
                  <span className="balcony-brace" />
                  <span className="balcony-banner" />
                </div>
                <div
                  className="tower-reward-bubble"
                  aria-label={`${lot.coins} pièces et ${lot.hints} indice${lot.hints > 1 ? "s" : ""}`}
                >
                  <span>
                    <Coins size={16} />
                    {lot.coins}
                  </span>
                  <span>
                    <Lightbulb size={16} />
                    {lot.hints}
                  </span>
                </div>
                <button
                  className="tower-chest-button"
                  aria-label={
                    claimed
                      ? `Coffre étage ${floor}, récupéré`
                      : ready
                        ? `Ouvrir le coffre de l’étage ${floor}`
                        : `Coffre étage ${floor}, verrouillé`
                  }
                  disabled={!ready || claimed}
                  onClick={() => onClaim(floor)}
                >
                  <ChestArt claimed={claimed} />
                  <span className="chest-caption">
                    {claimed ? "Récupéré" : ready ? "Ouvrir" : "Verrouillé"}
                  </span>
                </button>
              </article>
            );
          })}
          <div
            className="tower-player"
            style={{ bottom: 60 + completed * FLOOR_HEIGHT }}
            role="img"
            aria-label={`Votre montgolfière, étage ${completed}`}
          >
            <span className="player-location">Vous êtes ici</span>
            <TowerBalloon />
          </div>
          <div className="tower-ground" aria-hidden="true">
            <span />
            <span />
            <i />
          </div>
        </div>
      </div>
      <p className="tower-next-caption">
        {allClaimed
          ? "Le sommet est à vous !"
          : completed >= next
            ? `${reward.coins} pièces et ${reward.hints} indice${reward.hints > 1 ? "s" : ""} vous attendent.`
            : `Encore ${next - completed} victoire${next - completed > 1 ? "s" : ""} pour le prochain coffre.`}
      </p>
    </section>
  );
}
