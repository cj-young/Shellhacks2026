import { useEffect, useMemo, useRef, useState } from "react";
import type { CursorPoint } from "./CursorPathTracker";

export type LineTargetProps = {
  /** First endpoint of the target line, in viewport coordinates. */
  origin: CursorPoint;
  /** Second endpoint of the target line, in viewport coordinates. */
  end: CursorPoint;
  /** Width of the accepted corridor on either side of the line, in pixels. */
  radius: number;
  /** The drag path to evaluate. */
  points: CursorPoint[];
  /**
   * Whether leading points before the drag reaches the target should be
   * ignored. Once inside, the drag must remain within the target radius. A
   * successful match remains successful for this target.
   */
  allowStartOutsideTarget?: boolean;
  /** Receives the current result whenever the path or target changes. */
  onMatchChange?: (matches: boolean) => void;
};

const distanceBetween = (first: CursorPoint, second: CursorPoint) =>
  Math.hypot(first.x - second.x, first.y - second.y);

/** Returns the shortest distance from a point to a finite line segment. */
function distanceToSegment(
  point: CursorPoint,
  origin: CursorPoint,
  end: CursorPoint,
) {
  const deltaX = end.x - origin.x;
  const deltaY = end.y - origin.y;
  const lengthSquared = deltaX ** 2 + deltaY ** 2;

  if (lengthSquared === 0) return distanceBetween(point, origin);

  const projection =
    ((point.x - origin.x) * deltaX + (point.y - origin.y) * deltaY) /
    lengthSquared;
  const position = Math.max(0, Math.min(1, projection));

  return Math.hypot(
    point.x - (origin.x + position * deltaX),
    point.y - (origin.y + position * deltaY),
  );
}

/**
 * A path matches when it stays inside the line's radius and visits both ends,
 * in either direction.
 */
export function doesPathConnectLine(
  points: CursorPoint[],
  origin: CursorPoint,
  end: CursorPoint,
  radius: number,
  allowStartOutsideTarget = false,
) {
  if (points.length < 2 || radius < 0 || distanceBetween(origin, end) === 0) {
    return false;
  }

  const firstPointWithinTarget = points.findIndex(
    (point) => distanceToSegment(point, origin, end) <= radius,
  );
  const targetPoints = allowStartOutsideTarget
    ? points.slice(firstPointWithinTarget)
    : points;

  if (
    targetPoints.length < 2 ||
    targetPoints.some((point) => distanceToSegment(point, origin, end) > radius)
  ) {
    return false;
  }

  const firstOriginPoint = targetPoints.findIndex(
    (point) => distanceBetween(point, origin) <= radius,
  );
  const firstEndPoint = targetPoints.findIndex(
    (point) => distanceBetween(point, end) <= radius,
  );

  return firstOriginPoint !== -1 && firstEndPoint !== -1;
}

/**
 * Displays a line-shaped target and evaluates whether a cursor path connects
 * its two endpoint zones while staying within the target radius.
 */
export function LineTarget({
  origin,
  end,
  radius,
  points,
  allowStartOutsideTarget = false,
  onMatchChange,
}: LineTargetProps) {
  const targetElement = useRef<SVGSVGElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const element = targetElement.current;
    if (!element) return;

    const updatePosition = () => {
      const bounds = element.getBoundingClientRect();
      setPosition((currentPosition) =>
        currentPosition.x === bounds.left && currentPosition.y === bounds.top
          ? currentPosition
          : { x: bounds.left, y: bounds.top },
      );
    };

    updatePosition();

    const observer = new ResizeObserver(updatePosition);
    observer.observe(element);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, []);

  const positionedOrigin = {
    x: origin.x + position.x,
    y: origin.y + position.y,
  };
  const positionedEnd = {
    x: end.x + position.x,
    y: end.y + position.y,
  };
  const targetKey = `${positionedOrigin.x}:${positionedOrigin.y}:${positionedEnd.x}:${positionedEnd.y}:${radius}:${allowStartOutsideTarget}`;
  const [matchedTargetKey, setMatchedTargetKey] = useState<string | null>(null);
  const pathMatches = useMemo(
    () =>
      doesPathConnectLine(
        points,
        positionedOrigin,
        positionedEnd,
        radius,
        allowStartOutsideTarget,
      ),
    [allowStartOutsideTarget, points, positionedEnd, positionedOrigin, radius],
  );
  const matches =
    pathMatches ||
    (points.length > 0 &&
      allowStartOutsideTarget &&
      matchedTargetKey === targetKey);

  useEffect(() => {
    if (points.length === 0) {
      setMatchedTargetKey(null);
      return;
    }

    if (allowStartOutsideTarget && pathMatches) {
      setMatchedTargetKey(targetKey);
    }
  }, [allowStartOutsideTarget, pathMatches, points.length, targetKey]);

  useEffect(() => {
    onMatchChange?.(matches);
  }, [matches, onMatchChange]);

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      ref={targetElement}
    >
      <line
        x1={origin.x}
        y1={origin.y}
        x2={end.x}
        y2={end.y}
        stroke={matches ? "#3CB54A" : "rgba(43,42,107,.28)"}
        strokeLinecap="round"
        strokeWidth={radius * 2}
      />
      <circle
        cx={origin.x}
        cy={origin.y}
        fill="#fff"
        stroke="#2B2A6B"
        strokeWidth="3"
        r="6"
      />
      <circle
        cx={end.x}
        cy={end.y}
        fill="#fff"
        stroke="#2B2A6B"
        strokeWidth="3"
        r="6"
      />
    </svg>
  );
}
