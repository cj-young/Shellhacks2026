import { useEffect, useMemo } from "react";
import type { CursorPoint } from "./CursorPathTracker";
import type { SpinType } from "../lib/types";
import { doesPathCompleteSpin } from "./spin-path";

export { doesPathCompleteSpin } from "./spin-path";

export type SpinGestureProps = SpinType & {
  points: CursorPoint[];
  /** Ignore the approach to the ring, then require the drag to stay inside it. */
  allowStartOutsideTarget?: boolean;
  /** Reports success until the path clears or the target changes. */
  onMatchChange?: (matches: boolean) => void;
};

export function SpinGesture({
  center,
  radius,
  tolerance,
  direction,
  rotations,
  points,
  allowStartOutsideTarget = false,
  onMatchChange,
}: SpinGestureProps) {
  const matches = useMemo(
    () =>
      doesPathCompleteSpin(
        points,
        { center, radius, tolerance, direction, rotations },
        allowStartOutsideTarget,
      ),
    [
      points,
      center,
      radius,
      tolerance,
      direction,
      rotations,
      allowStartOutsideTarget,
    ],
  );

  useEffect(() => {
    onMatchChange?.(matches);
  }, [matches, onMatchChange]);

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
        stroke={matches ? "rgb(74 222 128)" : "rgb(148 163 184)"}
        strokeWidth={Math.max(1, tolerance * 2)}
      />
      <text
        x={center.x}
        y={center.y - radius}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize="24"
      >
        {direction === "clockwise" ? "↻" : "↺"} {rotations}×
      </text>
    </svg>
  );
}
