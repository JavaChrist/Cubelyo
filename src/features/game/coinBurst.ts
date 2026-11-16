/**
 * Pièces qui jaillissent d'un coffre puis volent en arc jusqu'au compteur.
 * Purement visuel : le profil est déjà crédité avant le départ des pièces.
 */
export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

export function flyCoins({
  from,
  to,
  count,
  onArrive,
  onDone,
}: {
  from: Element;
  to: Element;
  count: number;
  onArrive: (index: number) => void;
  onDone: () => void;
}) {
  const start = from.getBoundingClientRect(),
    end = (to.querySelector("svg") ?? to).getBoundingClientRect();
  const sx = start.left + start.width / 2,
    sy = start.top + start.height * 0.4,
    ex = end.left + end.width / 2,
    ey = end.top + end.height / 2;
  let arrived = 0;
  for (let i = 0; i < count; i++) {
    const coin = document.createElement("span");
    coin.className = "flying-coin";
    coin.setAttribute("aria-hidden", "true");
    coin.style.left = `${sx}px`;
    coin.style.top = `${sy}px`;
    document.body.appendChild(coin);
    // Éclatement autour du coffre, puis arc vers le compteur.
    const angle = -Math.PI / 2 + (i / Math.max(1, count - 1) - 0.5) * 2.2,
      burst = 46 + (i % 3) * 14,
      bx = Math.cos(angle) * burst,
      by = Math.sin(angle) * burst,
      dx = ex - sx,
      dy = ey - sy,
      mx = bx + (dx - bx) * 0.5 + (i % 2 ? 30 : -30),
      my = Math.min(by, dy) - 70;
    const animation = coin.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.3)", opacity: 0, offset: 0 },
        {
          transform: `translate(calc(-50% + ${bx}px), calc(-50% + ${by}px)) scale(1.1)`,
          opacity: 1,
          offset: 0.28,
          easing: "ease-in-out",
        },
        {
          transform: `translate(calc(-50% + ${bx}px), calc(-50% + ${by + 6}px)) scale(1)`,
          opacity: 1,
          offset: 0.4,
          easing: "ease-in",
        },
        {
          transform: `translate(calc(-50% + ${mx}px), calc(-50% + ${my}px)) scale(0.9)`,
          opacity: 1,
          offset: 0.7,
          easing: "ease-out",
        },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.55)`,
          opacity: 0.9,
          offset: 1,
        },
      ],
      { duration: 1100, delay: i * 75, fill: "forwards" },
    );
    animation.onfinish = animation.oncancel = () => {
      coin.remove();
      onArrive(i);
      to.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.12)" },
          { transform: "scale(1)" },
        ],
        { duration: 220, easing: "ease-out" },
      );
      if (++arrived === count) onDone();
    };
  }
}
