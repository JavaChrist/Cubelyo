"use client";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { nextStarIn, type Profile } from "../progression/profile";
function useCountdown(profile: Profile) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setNow(Date.now()));
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(timer);
    };
  }, []);
  const remaining = nextStarIn(profile, now || profile.energy.updatedAt);
  return `${Math.floor(remaining / 60000)
    .toString()
    .padStart(2, "0")}:${Math.floor((remaining / 1000) % 60)
    .toString()
    .padStart(2, "0")}`;
}
export function EnergyCounter({
  profile,
  onOpen,
  disabled,
}: {
  profile: Profile;
  onOpen: () => void;
  disabled: boolean;
}) {
  const label = useCountdown(profile);
  return (
    <button
      className="energy-counter"
      disabled={disabled}
      aria-label={`${profile.energy.stars} étoiles sur 5`}
      onClick={onOpen}
    >
      <Star fill="currentColor" size={25} />
      <span>
        <strong>
          {profile.energy.stars}
          <small>/5</small>
        </strong>
        <small>{profile.energy.stars === 5 ? "Plein" : label}</small>
      </span>
    </button>
  );
}
export function EnergyCountdown({ profile }: { profile: Profile }) {
  return <span>{useCountdown(profile)}</span>;
}
