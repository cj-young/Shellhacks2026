import type { Point } from "../lib/types";

export type LineTargetProps = {
  /** First endpoint of the target line, in gesture-canvas coordinates. */
  origin: Point;
  /** Second endpoint of the target line, in gesture-canvas coordinates. */
  end: Point;
  /** Width of the guide corridor on either side of the line, in pixels. */
  radius: number;
  /** Whether the stage's stroke has been recognized (colors the guide green). */
  matched: boolean;
};

/**
 * A visual guide for a line-shaped stage. Recognition happens in
 * `gesture-recognizer.ts`; this only draws the target and its endpoint dots.
 */
export function LineTarget({ origin, end, radius, matched }: LineTargetProps) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <line
        x1={origin.x}
        y1={origin.y}
        x2={end.x}
        y2={end.y}
        stroke={matched ? "#2FA84F" : "rgba(122,78,30,.28)"}
        strokeLinecap="round"
        strokeWidth={radius * 2}
      />
      <circle
        cx={origin.x}
        cy={origin.y}
        fill="#fff"
        stroke="#3D2817"
        strokeWidth="3"
        r="6"
      />
      <circle
        cx={end.x}
        cy={end.y}
        fill="#fff"
        stroke="#3D2817"
        strokeWidth="3"
        r="6"
      />
    </svg>
  );
}
