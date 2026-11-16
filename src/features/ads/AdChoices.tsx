"use client";

import { useState } from "react";
import { useAds } from "./AdsProvider";

/**
 * Bouton « Choix publicitaires » des réglages. Il n'apparaît que dans l'application Android, pour un adulte déclaré,
 * quand Google l'exige (Espace économique européen, Royaume-Uni, Suisse) : il rouvre le formulaire UMP.
 */
export function AdChoicesButton() {
  const ads = useAds();
  const [error, setError] = useState(false);
  if (!ads?.consent?.privacyOptionsRequired) return null;
  const open = async () => {
    setError(false);
    try {
      await ads.openPrivacyOptions();
    } catch {
      setError(true);
    }
  };
  return (
    <>
      <button className="text-button" onClick={open}>
        Choix publicitaires
      </button>
      {error && (
        <small role="status">
          Le formulaire de Google ne peut pas s’ouvrir. Vérifiez la connexion
          et réessayez.
        </small>
      )}
    </>
  );
}
