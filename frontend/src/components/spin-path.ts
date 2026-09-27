import type { Point, SpinType } from "../lib/types.ts";

/**
 * Match a continuous drag around a ring. Screen coordinates make increasing
 * angles clockwise. Backtracking subtracts progress; lifting clears the path.
 * Once completed, later points cannot undo the match.
 */
export function doesPathCompleteSpin(
  points: Point[],
  { center, radius, tolerance, direction, rotations }: SpinType,
  allowStartOutsideTarget = false,
): boolean {
  if (
    points.length < 2 ||
    ![center.x, center.y, radius, tolerance, rotations].every(
      Number.isFinite,
    ) ||
    radius <= 0 ||
    tolerance < 0 ||
    tolerance >= radius ||
    rotations <= 0 ||
    (direction !== "clockwise" && direction !== "counterclockwise")
  )
    return false;

  const inner = radius - tolerance;
  const outer = radius + tolerance;
  let previous: Point | undefined;
  let angle = 0;
  const sign = direction === "clockwise" ? 1 : -1;

  for (const point of points) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
    const relative = { x: point.x - center.x, y: point.y - center.y };
    const distance = Math.hypot(relative.x, relative.y);
    if (distance < inner - 1e-9 || distance > outer + 1e-9) {
      if (!previous && allowStartOutsideTarget) continue;
      return false;
    }

    if (previous) {
      // Check the segment, too: endpoints on the ring cannot hide a shortcut
      // through its center (or ambiguous jumps between opposite sides).
      const dx = relative.x - previous.x;
      const dy = relative.y - previous.y;
      const lengthSquared = dx * dx + dy * dy;
      const t =
        lengthSquared === 0
          ? 0
          : Math.max(
              0,
              Math.min(1, -(previous.x * dx + previous.y * dy) / lengthSquared),
            );
      if (Math.hypot(previous.x + t * dx, previous.y + t * dy) < inner - 1e-9)
        return false;

      const delta = Math.atan2(
        previous.x * relative.y - previous.y * relative.x,
        previous.x * relative.x + previous.y * relative.y,
      );
      angle += sign * delta;
      if (angle + 1e-9 >= rotations * 2 * Math.PI) return true;
    }
    previous = relative;
  }
  return false;
}
