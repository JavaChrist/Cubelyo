"use client";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  Coins,
  Gift,
  Layers3,
  Lightbulb,
  LockKeyhole,
  Play,
  Star,
  Trophy,
} from "lucide-react";
import { LEVELS, difficultyAt } from "../levels/campaign";
import { chestReward, type Profile } from "../progression/profile";
export function ProgressScreens({
  screen,
  profile,
  onPlay,
  onScreen,
  onClaim,
}: {
  screen: "levels" | "tower";
  profile: Profile;
  onPlay: (index: number) => void;
  onScreen: (s: "levels" | "tower" | "game") => void;
  onClaim: (floor: number) => void;
}) {
  const completed = Object.keys(profile.completed).length;
  const sessionWon =
    profile.session.removed.length ===
    LEVELS[profile.session.index].arrows.length;
  const resumeIndex = sessionWon
    ? Math.min(99, profile.session.index + 1)
    : profile.session.index;
  const floors = Array.from({ length: 20 }, (_, i) => (i + 1) * 5);
  const next = floors.find((floor) => !profile.claimed.includes(floor)) ?? 100;
  const allClaimed = floors.every((floor) => profile.claimed.includes(floor));
  const reward = chestReward(next);
  return (
    <section className="progress-screen">
      <div className="section-heading">
        <button
          className="icon-button"
          aria-label="Reprendre la partie"
          onClick={() => onScreen("game")}
        >
          <ArrowLeft />
        </button>
        <div>
          <span className="eyebrow">Votre aventure</span>
          <h1>
            {screen === "levels" ? "Un cube à la fois." : "Toujours plus haut."}
          </h1>
        </div>
      </div>
      {screen === "levels" ? (
        <>
          <div className="journey-banner">
            <div className="journey-icon">
              <Play />
            </div>
            <div>
              <strong>Niveau {resumeIndex + 1}</strong>
              <p>
                {sessionWon
                  ? "Le prochain cube vous attend."
                  : profile.session.removed.length
                    ? "Votre partie vous attend."
                    : "Un nouveau passage à découvrir."}
              </p>
            </div>
            <button className="primary" onClick={() => onPlay(resumeIndex)}>
              Continuer <ArrowRight size={18} />
            </button>
          </div>
          <div className="section-label">
            <h2>Les 100 casse-têtes</h2>
            <span>{completed} terminés</span>
          </div>
          <p className="muted">
            Les niveaux restent tous accessibles pendant vos essais.
          </p>
          <div className="level-grid">
            {LEVELS.map((l, i) => (
              <button
                key={l.id}
                className={`level-tile ${profile.completed[i + 1] ? "completed" : ""} ${profile.session.index === i ? "current" : ""}`}
                aria-label={`Jouer au niveau ${i + 1}, ${difficultyAt(i + 1)}`}
                onClick={() => onPlay(i)}
              >
                <span>
                  {profile.completed[i + 1] ? (
                    <Check size={15} />
                  ) : difficultyAt(i + 1) === "Très difficile" ? (
                    <Trophy size={15} />
                  ) : null}
                </span>
                <strong>{i + 1}</strong>
                <small>{difficultyAt(i + 1)}</small>
                <div className="mini-stars">
                  {[1, 2, 3].map((n) => (
                    <Star
                      key={n}
                      size={12}
                      fill={
                        (profile.completed[i + 1]?.stars ?? 0) >= n
                          ? "currentColor"
                          : "none"
                      }
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="tower-summary">
            <div className="tower-miniature" aria-hidden="true">
              <Trophy size={25} />
              {Array.from({ length: 8 }, (_, i) => (
                <span
                  key={i}
                  className={completed >= (8 - i) * 12 ? "raised" : ""}
                  style={{ width: `${48 + i * 5}px` }}
                />
              ))}
              <i />
            </div>
            <span className="eyebrow">Votre tour des récompenses</span>
            <h2>
              {completed}
              <span> / 100 étages</span>
            </h2>
            <p>Chaque première victoire construit un étage.</p>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Étages construits"
              aria-valuenow={completed}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${completed}%` }} />
            </div>
          </div>
          <div className="next-chest">
            <Gift size={30} />
            <div>
              <strong>
                {allClaimed
                  ? "Le sommet est à vous !"
                  : completed >= next
                    ? `Coffre disponible · étage ${next}`
                    : `Prochain coffre · étage ${next}`}
              </strong>
              <p>
                {allClaimed
                  ? "Tous les coffres ont été récupérés."
                  : completed >= next
                    ? `${reward.coins} pièces + ${reward.hints} indice${reward.hints > 1 ? "s" : ""} vous attendent.`
                    : `Encore ${next - completed} victoire${next - completed > 1 ? "s" : ""} · ${reward.coins} pièces + ${reward.hints} indice${reward.hints > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <div className="tower-list">
            {Array.from({ length: 20 }, (_, i) => (i + 1) * 5).map((floor) => {
              const ready = completed >= floor,
                claimed = profile.claimed.includes(floor),
                lot = chestReward(floor);
              return (
                <article
                  key={floor}
                  className={`tower-floor ${ready ? "built" : ""} ${claimed ? "claimed" : ""}`}
                >
                  <div className="floor-marker">
                    {claimed ? (
                      <CheckCheck />
                    ) : ready ? (
                      <Gift />
                    ) : (
                      <LockKeyhole size={19} />
                    )}
                  </div>
                  <div className="floor-content">
                    <span className="eyebrow">
                      Étages {floor - 4} à {floor}
                    </span>
                    <h3>
                      {floor === 100
                        ? "Le grand sommet"
                        : `Coffre ${floor / 5}`}
                    </h3>
                    <div className="reward-line">
                      <span>
                        <Coins size={15} />
                        {lot.coins}
                      </span>
                      <span>
                        <Lightbulb size={15} />
                        {lot.hints}
                      </span>
                    </div>
                    <div className="floor-blocks">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className={completed >= floor - 4 + i ? "filled" : ""}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    className={
                      ready && !claimed ? "gold-button" : "small-button"
                    }
                    disabled={!ready || claimed}
                    onClick={() => onClaim(floor)}
                  >
                    {claimed ? "Récupéré" : ready ? "Ouvrir" : "Verrouillé"}
                  </button>
                </article>
              );
            })}
          </div>
        </>
      )}
      <nav className="bottom-nav" aria-label="Navigation principale">
        <button
          className={screen === "levels" ? "active" : ""}
          onClick={() => onScreen("levels")}
        >
          <Play size={20} />
          Niveaux
        </button>
        <button onClick={() => onScreen("game")}>
          <ArrowRight size={20} />
          Reprendre
        </button>
        <button
          className={screen === "tower" ? "active" : ""}
          onClick={() => onScreen("tower")}
        >
          <Layers3 size={20} />
          La tour
        </button>
      </nav>
    </section>
  );
}
