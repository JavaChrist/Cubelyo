"use client";
import {
  ArrowLeft,
  Box,
  Check,
  Coins,
  Eraser,
  Flag,
  Hourglass,
  Info,
  Lightbulb,
  LockKeyhole,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { seasonEnd, type Profile } from "../progression/profile";
/** Lot affiché en récompense : seules les quantités non nulles apparaissent. */
export type Lot = Partial<
  Record<"stars" | "coins" | "hints" | "erasers" | "wands", number>
>;
const plural = (n: number, one: string, many: string) =>
  `${n} ${n > 1 ? many : one}`;
const LOT_PARTS = [
  { key: "stars", one: "étoile", many: "étoiles", Icon: Star },
  { key: "coins", one: "pièce", many: "pièces", Icon: Coins },
  { key: "hints", one: "indice", many: "indices", Icon: Lightbulb },
  { key: "erasers", one: "gomme", many: "gommes", Icon: Eraser },
  { key: "wands", one: "baguette", many: "baguettes", Icon: Sparkles },
] as const;
/** Lot en texte : « 120 pièces, 2 indices et 1 gomme ». */
export function describeLot(lot: Lot) {
  const parts = LOT_PARTS.filter((p) => lot[p.key]).map((p) =>
    plural(lot[p.key]!, p.one, p.many),
  );
  return parts.length > 1
    ? `${parts.slice(0, -1).join(", ")} et ${parts[parts.length - 1]}`
    : (parts[0] ?? "");
}
/** Temps restant avant la fin de saison : « 13 j 4 h », « 5 h 12 min », « 8 min ». */
export function formatSeasonLeft(ms: number) {
  const minutes = Math.max(1, Math.ceil(ms / 60000)),
    days = Math.floor(minutes / 1440),
    hours = Math.floor((minutes % 1440) / 60),
    rest = minutes % 60;
  return days
    ? `${days} j ${hours} h`
    : hours
      ? `${hours} h ${rest} min`
      : `${rest} min`;
}
/** Lot en icônes (étoiles, pièces, indices, gommes, baguettes). */
export function LotItems({ lot }: { lot: Lot }) {
  return (
    <ul className="lot-items" aria-label={describeLot(lot)}>
      {LOT_PARTS.filter((p) => lot[p.key]).map(({ key, Icon }) => (
        <li key={key} className={`lot-${key}`}>
          <Icon size={20} fill={key === "stars" ? "currentColor" : "none"} />
          {lot[key]!.toLocaleString("fr-FR")}
        </li>
      ))}
    </ul>
  );
}
/** Petite fenêtre non bloquante : les pièces restent visibles pendant leur vol. */
export function RewardCard({
  title,
  lot,
  note,
  onClose,
}: {
  title: string;
  lot: Lot;
  note?: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current;
    dialog?.show();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="chest-reward-card"
      aria-labelledby="reward-card-title"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <h2 id="reward-card-title">{title}</h2>
      {note && <p>{note}</p>}
      <LotItems lot={lot} />
      <button className="primary" autoFocus onClick={onClose}>
        Super
      </button>
    </dialog>
  );
}
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
  onClaim: (floor: number, chest: HTMLElement) => void;
  onBack: () => void;
  onInfo: () => void;
}) {
  const completed = profile.tower.floors;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const seasonLeft = formatSeasonLeft(seasonEnd(profile.tower.season) - now);
  const floors = Array.from({ length: 20 }, (_, i) => (i + 1) * 5).reverse();
  const next =
    [...floors].reverse().find((f) => !profile.claimed.includes(f)) ?? 100;
  const allClaimed = floors.every((f) => profile.claimed.includes(f));
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
        <p className="tower-season">
          <Hourglass size={14} />
          Saison {profile.tower.season} · fin dans {seasonLeft}
        </p>
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
              claimed = profile.claimed.includes(floor);
            return (
              <article
                key={floor}
                className={`tower-stop ${ready ? "stop-ready" : ""} ${claimed ? "stop-claimed" : ""} ${floor === completed ? "stop-here" : ""} ${floor >= 75 ? "royal-stop" : floor >= 35 ? "azure-stop" : "violet-stop"}`}
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
                  onClick={(e) => onClaim(floor, e.currentTarget)}
                >
                  <ChestArt claimed={claimed} />
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
            ? "Un coffre surprise vous attend."
            : `Encore ${next - completed} nouveau${next - completed > 1 ? "x" : ""} niveau${next - completed > 1 ? "x" : ""} pour le prochain coffre.`}
      </p>
    </section>
  );
}
