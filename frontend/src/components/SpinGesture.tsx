import type { SpinType } from "../lib/types";

export type SpinGestureProps = SpinType & {
  /** Whether the stage's stroke has been recognized (colors the guide green). */
  matched: boolean;
};

/**
 * A visual guide for a circular stir. Recognition happens in
 * `gesture-recognizer.ts`; this only draws the target ring and its
 * direction/rotation label.
 */
export function SpinGesture({
  center,
  radius,
  tolerance,
  direction,
  rotations,
  matched,
}: SpinGestureProps) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <circle
        cx={center.x}
        cy={center.y}
        r={radius}
        fill="none"
        stroke={matched ? "#2FA84F" : "rgba(122,78,30,.28)"}
        strokeWidth={Math.max(1, tolerance * 2)}
      />
      <text
        x={center.x}
        y={center.y - radius}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#3D2817"
        stroke="#FFF6E3"
        strokeWidth="4"
        paintOrder="stroke"
        fontFamily="Sniglet"
        fontSize="24"
      >
        {direction === "clockwise" ? "↻" : "↺"} {rotations}×
      </text>
    </svg>
  );
}
