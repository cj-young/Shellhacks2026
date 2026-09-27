import { useEffect, useMemo, useRef, useState } from "react";
import type { CursorPoint } from "./CursorPathTracker";
import { LineTarget } from "./LineTarget";
import { SpinGesture } from "./SpinGesture";
import { isDeliberateStroke, matchStage } from "./gesture-recognizer";
import type { LineType, RecipeStage, SpinType } from "../lib/types";

import { paper } from "#/components/chop-chop/paper";

export type GestureRecipeLine = LineType;
export type GestureRecipeStage = Omit<RecipeStage, "ingredientsConsumed"> &
  ({ type: "lines"; lines: LineType[] } | { type: "spin"; spins: SpinType[] });

/** Shape of one recipe entry in data/recipes.json. */
export type GestureRecipeDefinition = {
  name: string;
  stages: GestureRecipeStage[];
};

export type GestureRecipeProps = {
  stage: GestureRecipeStage;
  points: CursorPoint[];
  /** Holds the finished appearance while the parent waits to advance. */
  completed?: boolean;
  /** Freezes recognition without losing progress (e.g. a sabotage). */
  paused?: boolean;
  /** True only while the stage's gesture has been recognized. */
  onMatchChange?: (matches: boolean) => void;
  /** Called when a deliberate stroke ends without matching the stage. */
  onWrong?: () => void;
};

/**
 * Recognizes the drawn stroke against a stage's gesture and draws the stage's
 * targets as guides. Matching is forgiving (feature-based, rough proximity,
 * capped rotations); once a stroke matches it stays matched until it clears.
 */
/** Step art fades in; "Success!" pops, then floats up off the picture. */
const STEP_CSS = `
@keyframes stepArtIn { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: none; } }
.step-art-in { animation: stepArtIn 380ms ease-out both; }
@keyframes stepSuccess {
  0% { transform: translate(-50%, -50%) scale(.5); opacity: 0; }
  18% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
  30%, 55% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -160%) scale(.85); opacity: 0; }
}
@keyframes foodShake {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  12% { transform: translateX(-3px) rotate(-4deg); }
  28% { transform: translateX(3px) rotate(4deg); }
  44% { transform: translateX(-3px) rotate(-3deg); }
  62% { transform: translateX(2px) rotate(3deg); }
  80% { transform: translateX(-1px) rotate(-1deg); }
}
/* Two identical names so each wrong gesture restarts the shake without
   remounting the picture (which would replay its fade-in). */
@keyframes foodShake2 { from, to { transform: none; } }
.food-shake-0 { animation: foodShake 420ms ease-in-out; }
.food-shake-1 { animation: foodShake 420ms ease-in-out, foodShake2 1ms; }
@media (prefers-reduced-motion: reduce) {
  .step-art-in, .food-shake-0, .food-shake-1 { animation: none !important; }
}
`;

export function GestureRecipe({
  stage,
  points,
  completed = false,
  paused = false,
  onMatchChange,
  onWrong,
}: GestureRecipeProps) {
  const stageKey = useMemo(() => JSON.stringify(stage), [stage]);
  const [matchedKey, setMatchedKey] = useState<string | null>(null);
  const [shakeId, setShakeId] = useState(0);

  const result = useMemo(() => matchStage(points, stage), [points, stage]);
  const matches =
    result.matched || (points.length > 0 && matchedKey === stageKey);

  useEffect(() => {
    if (points.length === 0) {
      setMatchedKey(null);
      return;
    }
    if (result.matched) setMatchedKey(stageKey);
  }, [points.length, result.matched, stageKey]);

  useEffect(() => {
    onMatchChange?.(matches);
  }, [matches, onMatchChange]);

  // Punish a real stroke that ends without matching: shake the food and tell the
  // parent. A stroke only counts if it started on this stage (a match can advance
  // the stage mid-stroke), was not matched, and was a genuine attempt.
  const lastPointsRef = useRef<CursorPoint[]>(points);
  const prevLengthRef = useRef(points.length);
  const startedOnStageRef = useRef(false);
  const strokeMatchedRef = useRef(false);

  useEffect(() => {
    const prevLength = prevLengthRef.current;
    prevLengthRef.current = points.length;

    if (points.length > 0) {
      lastPointsRef.current = points;
      if (prevLength === 0) {
        startedOnStageRef.current = true;
        strokeMatchedRef.current = false;
      }
      if (matches) strokeMatchedRef.current = true;
      return;
    }

    const wrong =
      prevLength > 0 &&
      startedOnStageRef.current &&
      !strokeMatchedRef.current &&
      !paused &&
      !completed &&
      isDeliberateStroke(lastPointsRef.current);
    startedOnStageRef.current = false;
    strokeMatchedRef.current = false;

    if (wrong) {
      setShakeId((id) => id + 1);
      onWrong?.();
    }
  }, [points, matches, paused, completed, onWrong]);

  const foregroundImage = completed
    ? stage.finishedImage || stage.image
    : stage.image;

  return (
    <div className="relative h-full w-full overflow-hidden pointer-events-none">
      <style>{STEP_CSS}</style>
      {stage.backgroundImage && (
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-contain"
          src={stage.backgroundImage}
        />
      )}
      {foregroundImage && (
        // Over the stage's gesture space (targets use 0–200px), so the art sits
        // under the lines and circles rather than centred on the whole box.
        <img
          // Keyed by picture so each new one fades in rather than popping on.
          key={foregroundImage}
          alt=""
          className={`absolute left-0 top-0 h-50 w-50 object-contain step-art-in${
            shakeId > 0 ? ` food-shake-${shakeId % 2}` : ""
          }`}
          src={foregroundImage}
        />
      )}
      {(completed || matches) && (
        <p
          className="z-50 w-fit h-fit whitespace-nowrap"
          style={{
            ...paper(22, 0),
            position: "absolute",
            left: "50%",
            top: "50%",
            background: "#2FA84F",
            animation: "stepSuccess 650ms ease-out both",
            padding: "4px 16px",
            font: "400 26px 'Sniglet'",
            color: "#3D2817",
          }}
        >
          Success!
        </p>
      )}
      {completed
        ? null
        : stage.type === "spin"
          ? stage.spins.map((spin, index) => (
              <SpinGesture
                key={`${stageKey}:${index}`}
                {...spin}
                matched={matches}
              />
            ))
          : stage.lines.map((line, index) => (
              <LineTarget
                key={`${stageKey}:${index}`}
                matched={matches}
                end={line.end}
                origin={line.start}
                radius={line.radius}
              />
            ))}
    </div>
  );
}
