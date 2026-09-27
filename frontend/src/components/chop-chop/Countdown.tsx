import { useEffect, useRef, useState } from "react";
import { LEAF, SUN, TOMATO, lilita } from "./design";
import { handCut, paper } from "./paper";

/** Paper card per number (3, 2, 1): fill, text colour and resting tilt. */
const CARDS = [
  { fill: TOMATO, text: "#fff", tilt: -7, seed: 0 },
  { fill: SUN, text: "#fff", tilt: 4, seed: 1 },
  { fill: LEAF, text: "#fff", tilt: -3, seed: 2 },
];

const CSS = `
@keyframes cdIn {
  0% { transform: rotate(calc(var(--tilt) + 14deg)) scale(.4); opacity: 0; }
  60% { transform: rotate(calc(var(--tilt) - 3deg)) scale(1.08); opacity: 1; }
  100% { transform: rotate(var(--tilt)) scale(1); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) { .cd-card { animation: none !important; } }
`;

/**
 * 3 → 2 → 1 as coloured paper cards that stack left to right, each landing
 * slightly over the last. Every slot is laid out from the start (hidden until
 * its turn) so cards pop in where they finish and the row never shifts.
 * Calls `onDone` a beat after the last card lands.
 */
export function Countdown({
  from = 3,
  stepMs = 1000,
  cardWidth,
  onDone,
}: {
  from?: number;
  stepMs?: number;
  /** Card width in px; height and numbers scale with it. */
  cardWidth: number;
  onDone?: () => void;
}) {
  const [shown, setShown] = useState(1);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const id = setTimeout(() => {
      if (shown < from) setShown(shown + 1);
      else doneRef.current?.();
    }, stepMs);
    return () => clearTimeout(id);
  }, [shown, from, stepMs]);

  const height = Math.round(cardWidth * 1.32);
  return (
    <div
      role="timer"
      aria-live="assertive"
      aria-label={`${from - shown + 1}`}
      style={{ display: "flex", alignItems: "center" }}
    >
      <style>{CSS}</style>
      {Array.from({ length: from }, (_, i) => {
        const card = CARDS[i % CARDS.length];
        const visible = i < shown;
        return (
          <div
            key={i}
            aria-hidden={!visible}
            className="cd-card"
            style={{
              ...paper(0, card.seed),
              borderRadius: handCut(cardWidth * 0.16, card.seed),
              ["--tilt" as string]: `${card.tilt}deg`,
              width: cardWidth,
              height,
              // Each card tucks a third of the way over the one before it.
              marginLeft: i === 0 ? 0 : -cardWidth * 0.34,
              zIndex: i,
              background: card.fill,
              color: card.text,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              font: lilita(cardWidth * 0.78, 1),
              paddingBottom: cardWidth * 0.06,
              boxSizing: "border-box",
              transform: `rotate(${card.tilt}deg)`,
              visibility: visible ? "visible" : "hidden",
              animation: visible
                ? "cdIn 480ms cubic-bezier(.2,1.2,.35,1) both"
                : undefined,
            }}
          >
            {from - i}
          </div>
        );
      })}
    </div>
  );
}
