import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";

export type CursorPoint = {
  x: number;
  y: number;
};

type CursorPathTrackerProps = {
  /** Called whenever the in-progress path changes, and with [] when it clears. */
  onPointsChange?: (points: CursorPoint[]) => void;
};

/**
 * Draws a temporary trail while a mouse, pen, or touch pointer is held down.
 */
export function CursorPathTracker({ onPointsChange }: CursorPathTrackerProps) {
  const [points, setPoints] = useState<CursorPoint[]>([]);
  const activePointerId = useRef<number | null>(null);

  useEffect(() => {
    onPointsChange?.(points);
  }, [onPointsChange, points]);

  const getPoint = (event: PointerEvent<HTMLDivElement>): CursorPoint => {
    const bounds = event.currentTarget.getBoundingClientRect();

    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  };

  const addPoint = (event: PointerEvent<HTMLDivElement>) => {
    const point = getPoint(event);
    setPoints((currentPoints) => [...currentPoints, point]);
  };

  const clearPath = () => {
    activePointerId.current = null;
    setPoints([]);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== null) return;

    activePointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setPoints([getPoint(event)]);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerId !== activePointerId.current) return;
    addPoint(event);
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerId === activePointerId.current) clearPath();
  };

  return (
    <div
      aria-label="Drag anywhere to draw a temporary path"
      className="absolute z-10 w-full h-full touch-none overflow-hidden bg-transparent"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onLostPointerCapture={handlePointerEnd}
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        {points.length > 1 && (
          <polyline
            fill="none"
            points={points.map(({ x, y }) => `${x},${y}`).join(" ")}
            stroke="#127C78"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="6"
          />
        )}
      </svg>

      {/* <div className="pointer-events-none relative mx-auto flex min-h-screen max-w-3xl items-center justify-center p-8 text-center">
        <div className="flex flex-row gap-1 text-sm flex-wrap max-w-[90vw]">
          {points.map(({ x, y }, index) => (
            <div key={index} className="text-white">
              {x},{y}
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
}
