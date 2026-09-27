import { useEffect, useRef, useState } from "react";
import type { StepTool } from "#/data/recipe-steps";

type Point = { x: number; y: number };

/**
 * A utensil (e.g. a whisk) that follows the finger or mouse inside its parent,
 * the gesture area, in place of a plain pointer. Rests at `rest` when idle.
 * Positions are in the area's own px, so it also works when the area is
 * scaled by a transform (the dev switcher).
 */
export function ToolCursor({ tool, rest }: { tool: StepTool; rest: Point }) {
  const ref = useRef<HTMLImageElement>(null);
  const [at, setAt] = useState<Point | null>(null);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    const area = ref.current?.parentElement;
    if (!area) return;
    let still: ReturnType<typeof setTimeout> | undefined;
    const move = (e: PointerEvent) => {
      const r = area.getBoundingClientRect();
      const k = area.offsetWidth ? r.width / area.offsetWidth : 1;
      setAt({ x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k });
      setMoving(true);
      clearTimeout(still);
      still = setTimeout(() => setMoving(false), 120);
    };
    const leave = () => setAt(null);
    area.addEventListener("pointermove", move);
    area.addEventListener("pointerleave", leave);
    return () => {
      clearTimeout(still);
      area.removeEventListener("pointermove", move);
      area.removeEventListener("pointerleave", leave);
    };
  }, []);

  const pos = at ?? rest;
  return (
    <img
      ref={ref}
      src={tool.src}
      alt=""
      draggable={false}
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        height: tool.height,
        zIndex: 20,
        pointerEvents: "none",
        // Hotspot under the finger; a little wobble while it's moving.
        transform: `translate(${-tool.hotspot[0] * 100}%, ${-tool.hotspot[1] * 100}%) rotate(${moving ? 4 : 0}deg)`,
        transformOrigin: `${tool.hotspot[0] * 100}% ${tool.hotspot[1] * 100}%`,
        transition: "transform 120ms ease-out",
        filter: "drop-shadow(2px 5px 4px rgba(61,40,23,.25))",
      }}
    />
  );
}

/** Where a utensil waits when nobody is touching: the stage's spin centre, or the middle. */
export function toolRest(stage: {
  type: string;
  spins?: { center: Point }[];
}): Point {
  return stage.type === "spin" && stage.spins?.[0]
    ? stage.spins[0].center
    : { x: 100, y: 100 };
}
