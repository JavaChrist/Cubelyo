"use client";

import { ExternalLink, Play, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type SyntheticEvent } from "react";
import { PROMO_RULES, type PromoCampaign } from "./rules";

/**
 * Vidéo verticale de 15 s au plus, entre deux niveaux seulement.
 * Elle démarre sans le son quand le navigateur l'autorise ; le son reste au choix du joueur.
 * La fermeture apparaît à la fin, et plus tôt en cas d'erreur, de blocage ou de passage en arrière-plan.
 */
export function PromoPlayer({
  campaign,
  onClose,
}: {
  campaign: PromoCampaign;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [failed, setFailed] = useState(false);
  const [closable, setClosable] = useState(false);
  const closableRef = useRef(false);

  const limitMs = Math.min(PROMO_RULES.maxDurationMs, campaign.durationMs);

  const allowClose = () => {
    if (closableRef.current) return;
    closableRef.current = true;
    setClosable(true);
  };

  const stop = () => {
    videoRef.current?.pause();
    allowClose();
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    const video = videoRef.current;
    video?.play().catch(() => setNeedsTap(true));

    // Secours : aucune image après quelques secondes, ou durée maximale dépassée quoi qu'il arrive.
    const stall = window.setTimeout(() => {
      if (!video || video.paused || video.readyState < 3) allowClose();
    }, PROMO_RULES.stallMs);
    const hard = window.setTimeout(() => {
      videoRef.current?.pause();
      allowClose();
    }, PROMO_RULES.hardLimitMs);
    // Application en arrière-plan : la vidéo s'arrête et peut être fermée au retour.
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        videoRef.current?.pause();
        allowClose();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(stall);
      window.clearTimeout(hard);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (closable) closeRef.current?.focus();
  }, [closable]);

  const onTimeUpdate = (event: SyntheticEvent<HTMLVideoElement>) => {
    if (event.currentTarget.currentTime * 1000 >= limitMs) stop();
  };

  const onError = () => {
    setFailed(true);
    allowClose();
  };

  const playByTap = () => {
    const video = videoRef.current;
    if (!video) return;
    setNeedsTap(false);
    video.play().catch(onError);
  };

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
    if (video.paused && !closableRef.current) playByTap();
  };

  const close = () => {
    videoRef.current?.pause();
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={dialogRef}
      className="promo-player"
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Bouton retour : seulement quand la fermeture est proposée.
        if (!closableRef.current) event.preventDefault();
      }}
      onClose={onClose}
    >
      <div className="promo-frame">
        <div className="promo-top">
          <p id={titleId}>Publicité JavaChrist · {campaign.name}</p>
          {closable && (
            <button
              ref={closeRef}
              className="promo-round"
              aria-label="Fermer la vidéo"
              onClick={close}
            >
              <X aria-hidden size={24} />
            </button>
          )}
        </div>
        <div className="promo-stage">
          <video
            ref={videoRef}
            src={campaign.videoUrl}
            muted={muted}
            playsInline
            preload="auto"
            disablePictureInPicture
            controlsList="nodownload noplaybackrate noremoteplayback"
            aria-label={`Vidéo de présentation de ${campaign.name}`}
            onPlaying={() => setStarted(true)}
            onTimeUpdate={onTimeUpdate}
            onEnded={stop}
            onError={onError}
          />
          {needsTap && !failed && !closable && (
            <button
              className="promo-round promo-play"
              aria-label="Lancer la vidéo"
              onClick={playByTap}
            >
              <Play aria-hidden size={32} />
            </button>
          )}
          {failed && (
            <p role="status" className="promo-failed">
              La vidéo ne peut pas être lue. Vous pouvez la fermer.
            </p>
          )}
        </div>
        <div className="promo-bottom">
          {!failed && (
            <button
              className="promo-round"
              disabled={closable && !started}
              aria-label={muted ? "Activer le son" : "Couper le son"}
              aria-pressed={!muted}
              onClick={toggleSound}
            >
              {muted ? (
                <VolumeX aria-hidden size={24} />
              ) : (
                <Volume2 aria-hidden size={24} />
              )}
            </button>
          )}
          <button
            className="primary"
            onClick={() =>
              window.open(campaign.destinationUrl, "_blank", "noopener,noreferrer")
            }
          >
            <ExternalLink aria-hidden size={20} />
            Découvrir {campaign.name}
          </button>
        </div>
      </div>
    </dialog>
  );
}
