"use client";
import {
  Check,
  ChevronRight,
  FlaskConical,
  Gift,
  LockKeyhole,
  Play,
  PackageOpen,
  TicketPercent,
  Layers3,
  Trophy,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LEVELS, difficultyAt } from "../levels/campaign";
import {
  isUnlocked,
  unlockedLevel,
  type Profile,
} from "../progression/profile";
// L’ordre visuel descend du sommet vers le départ : le joueur progresse en montant.
const MAP_LEVELS = [...LEVELS].reverse();

export function HomeScreen({
  profile,
  onPlay,
  onTests,
  onPromotion,
  onTower,
}: {
  profile: Profile;
  onPlay: (index: number) => void;
  onTests: () => void;
  onPromotion: (offer: "starter" | "special") => void;
  onTower: () => void;
}) {
  const active = profile.session.active && !profile.session.finished;
  const [choice, setSelected] = useState(
    active ? profile.session.index : unlockedLevel(profile) - 1,
  );
  const selected = isUnlocked(profile, choice)
    ? choice
    : unlockedLevel(profile) - 1;
  const target = useRef<HTMLButtonElement>(null);
  const map = useRef<HTMLDivElement>(null);
  const [mapWidth, setMapWidth] = useState(320);
  useEffect(() => {
    const element = map.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) =>
      setMapWidth(entries[0].contentRect.width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    target.current?.scrollIntoView({ block: "center", behavior: "instant" });
  }, []);
  const done = Object.keys(profile.completed).length;
  return (
    <section className="home-screen">
      <div className="home-progress">
        <div className="progress-gift">
          <Gift size={29} />
        </div>
        <div className="home-progress-body">
          <span>Votre aventure</span>
          <div
            role="progressbar"
            aria-label="Niveaux terminés"
            aria-valuenow={done}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <i style={{ width: `${done}%` }} />
            <strong>{done} / 100 niveaux</strong>
          </div>
        </div>
        <span className="reward-pending">
          Objectif bonus
          <br />à définir
        </span>
      </div>
      <div className="map-heading">
        <button
          className={`test-access ${profile.testAccess ? "enabled" : ""}`}
          onClick={onTests}
          aria-pressed={profile.testAccess}
        >
          <FlaskConical size={16} />
          {profile.testAccess ? "Accès test libre" : "Accès test"}
        </button>
      </div>
      <div className="map-stage">
        <aside
          className="home-side home-side-left"
          aria-label="Offres promotionnelles"
        >
          <button
            className="home-shortcut starter-shortcut"
            aria-label="Offre de départ"
            onClick={() => onPromotion("starter")}
          >
            <span className="shortcut-art">
              <PackageOpen size={33} />
            </span>
            <small>Départ</small>
          </button>
          <button
            className="home-shortcut special-shortcut"
            aria-label="Offre du moment"
            onClick={() => onPromotion("special")}
          >
            <span className="shortcut-art">
              <TicketPercent size={33} />
            </span>
            <small>Offres</small>
          </button>
        </aside>
        <div ref={map} className="level-map" aria-label="Chemin de progression">
          {MAP_LEVELS.map((level, row) => {
            const i = LEVELS.length - 1 - row;
            const open = isUnlocked(profile, i),
              completed = !!profile.completed[i + 1],
              current = i === selected;
            const amplitude = Math.max(0, Math.min(1, (mapWidth - 84) / 200));
            const offset = [0, 78, 100, 55, -45, -98, -72][i % 7] * amplitude;
            const nextOffset =
              [0, 78, 100, 55, -45, -98, -72][(i - 1) % 7] * amplitude;
            return (
              <div
                className={`map-row ${open ? "open" : ""} ${completed ? "done" : ""}`}
                style={{ "--node-x": `${offset}px` } as React.CSSProperties}
                key={level.id}
              >
                {i > 0 && (
                  <svg
                    className="map-link"
                    width="100%"
                    height="180"
                    aria-hidden="true"
                  >
                    <path
                      d={`M ${mapWidth / 2 + offset} 53 C ${mapWidth / 2 + offset} 101, ${mapWidth / 2 + nextOffset} 110, ${mapWidth / 2 + nextOffset} 164`}
                      fill="none"
                      stroke={
                        completed ? "#68c9b4" : open ? "#829fe9" : "#bdcce3"
                      }
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={open ? undefined : "3 9"}
                    />
                  </svg>
                )}
                <button
                  ref={current ? target : undefined}
                  disabled={!open}
                  className={`level-node ${current ? "selected" : ""} ${completed ? "finished" : ""} ${difficultyAt(i + 1) === "Très difficile" ? "hard-node" : ""}`}
                  aria-label={`Choisir le niveau ${i + 1}${!open ? ", verrouillé" : ""}`}
                  aria-pressed={current}
                  onClick={() => setSelected(i)}
                >
                  <span className="node-face">
                    {open ? (
                      <strong>{i + 1}</strong>
                    ) : (
                      <LockKeyhole size={24} />
                    )}
                  </span>
                  {completed && (
                    <span className="node-check">
                      <Check size={13} />
                    </span>
                  )}
                  {current && (
                    <span className="node-current">
                      {active && i === profile.session.index
                        ? "En cours"
                        : "À vous !"}
                    </span>
                  )}
                </button>
                <span className="node-caption">
                  {current
                    ? difficultyAt(i + 1)
                    : completed
                      ? "Terminé"
                      : !open
                        ? `Niveau ${i + 1}`
                        : ""}
                </span>
                {(i + 1) % 10 === 0 && (
                  <span className="map-milestone">
                    <Trophy size={15} />
                    Palier {i + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <aside
          className="home-side home-side-right"
          aria-label="Raccourci vers la tour"
        >
          <button
            className="home-shortcut tower-home-shortcut"
            aria-label="Tour des récompenses"
            onClick={onTower}
          >
            <span className="shortcut-art">
              <Layers3 size={33} />
            </span>
            <small>La tour</small>
          </button>
        </aside>
      </div>
      <div className="play-dock">
        <button
          className="play-3d"
          onClick={() => onPlay(selected)}
          aria-label={
            active && selected === profile.session.index ? "Reprendre" : "Jouer"
          }
        >
          <Play size={24} fill="currentColor" />
          <span>
            {active && selected === profile.session.index
              ? "Reprendre"
              : "Jouer"}
            <small>
              Niveau {selected + 1} <ChevronRight size={14} />
            </small>
          </span>
        </button>
      </div>
    </section>
  );
}
