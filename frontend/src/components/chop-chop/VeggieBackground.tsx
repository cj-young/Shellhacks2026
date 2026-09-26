import { useEffect, useRef } from "react";
import type React from "react";

/**
 * Cluster crops from the original 1402×1122 veggie art (public/assets/veggies/).
 * Positions keep each crop's original offset from the edges it was cut from, in
 * original-image pixels multiplied by --u, so the clusters line up like the source art.
 */
const CLUSTERS: {
  file: string;
  w: number;
  h: number;
  style: React.CSSProperties;
  /** Hidden on narrow portrait screens so it doesn't crowd the UI. */
  center?: boolean;
}[] = [
  {
    file: "veggie-top-left",
    w: 257,
    h: 316,
    style: { top: "calc(7 * var(--u))", left: 0 },
  },
  {
    file: "veggie-top-center",
    w: 259,
    h: 275,
    style: { top: "calc(6 * var(--u))", left: "calc(50% - 37 * var(--u))" },
    center: true,
  },
  { file: "veggie-top-right", w: 383, h: 381, style: { top: 0, right: 0 } },
  {
    file: "veggie-right",
    w: 298,
    h: 370,
    style: { right: 0, top: "calc(50% - 187 * var(--u))" },
  },
  {
    file: "veggie-bottom-right",
    w: 310,
    h: 431,
    style: { right: 0, bottom: 0 },
  },
  { file: "veggie-bottom-left", w: 516, h: 579, style: { left: 0, bottom: 0 } },
  {
    file: "veggie-bottom-center",
    w: 271,
    h: 184,
    style: { bottom: 0, left: "calc(50% - 88 * var(--u))" },
    center: true,
  },
];

/** Max distance (px) the clusters drift toward the mouse. */
const PAN = 12;

// Sizes use container units so the layout follows this component's box (also inside
// scaled previews), not the browser window. --u is px per original-image pixel:
// height-driven, capped so the widest cluster (516px) stays under 28% of the width.
const CSS = `
.vbg { position: absolute; inset: 0; container-type: size; overflow: hidden; pointer-events: none; z-index: 0; background: #FCEBC7; }
.vbg__paper { position: absolute; inset: 0; background: url(/assets/lobby-background.png) center / cover no-repeat; }
.vbg__clusters {
  position: absolute; inset: -${PAN}px;
  --u: clamp(0.35px, min(calc(28cqw / 516), calc(100cqh / 1122)), 1.3px);
  transition: transform 450ms cubic-bezier(.2,.8,.2,1);
  will-change: transform;
}
.vbg__cluster { position: absolute; display: block; }
@container (max-aspect-ratio: 1/1) {
  .vbg__clusters { --u: clamp(0.25px, calc(30cqw / 516), 0.6px); }
  .vbg__cluster--center { display: none; }
}
@media (prefers-reduced-motion: reduce) { .vbg__clusters { transition: none; } }
`;

/**
 * Paper texture plus veggie clusters pinned to the screen edges. Fills its nearest
 * positioned parent and sits behind the UI; give sibling content `position: relative`.
 */
export function VeggieBackground({ parallax = true }: { parallax?: boolean }) {
  const clustersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!parallax) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: MouseEvent) => {
      const el = clustersRef.current;
      if (!el) return;
      const dx = (e.clientX / window.innerWidth - 0.5) * 2;
      const dy = (e.clientY / window.innerHeight - 0.5) * 2;
      el.style.transform = `translate(${dx * PAN}px, ${dy * PAN}px)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [parallax]);

  return (
    <div className="vbg" aria-hidden>
      <style>{CSS}</style>
      <div className="vbg__paper" />
      <div ref={clustersRef} className="vbg__clusters">
        {CLUSTERS.map((c) => (
          <img
            key={c.file}
            src={`/assets/veggies/${c.file}.png`}
            alt=""
            draggable={false}
            className={`vbg__cluster${c.center ? " vbg__cluster--center" : ""}`}
            style={{
              ...c.style,
              width: `calc(${c.w} * var(--u))`,
              height: `calc(${c.h} * var(--u))`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
