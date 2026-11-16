"use client";

import { UserRound } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import type { AdultAnswer } from "./rules";

/**
 * Posée une seule fois, avant la première promotion. Les deux réponses ont le même poids :
 * rien n'est choisi d'avance et aucune ne débloque quoi que ce soit dans le jeu.
 * `null` : pas de réponse (« Plus tard »), la question reviendra.
 */
export function AgeQuestion({
  onAnswer,
}: {
  onAnswer: (answer: AdultAnswer) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const answer = useRef<AdultAnswer>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const closeWith = (value: AdultAnswer) => {
    answer.current = value;
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal age-question"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onClose={() => onAnswer(answer.current)}
    >
      <UserRound aria-hidden size={34} className="age-icon" />
      <h2 id={titleId}>Une question avant de continuer</h2>
      <div id={bodyId}>
        <p>
          Cubelyo adapte certains contenus affichés entre deux niveaux à l’âge
          de la personne qui utilise cet appareil. Le jeu reste le même quelle
          que soit la réponse.
        </p>
        <p className="age-ask">Avez-vous 18 ans ou plus ?</p>
      </div>
      <div className="modal-actions">
        <button onClick={() => closeWith("adult")}>J’ai 18 ans ou plus</button>
        <button onClick={() => closeWith("minor")}>
          J’ai moins de 18 ans
        </button>
      </div>
      <small className="age-note">
        Votre réponse reste sur cet appareil. Vous pouvez l’effacer dans
        Réglages › Confidentialité.
      </small>
      <button className="text-button" onClick={() => closeWith(null)}>
        Plus tard
      </button>
    </dialog>
  );
}
