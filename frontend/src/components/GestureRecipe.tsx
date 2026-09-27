import { useEffect, useMemo, useState } from "react";
import type { CursorPoint } from "./CursorPathTracker";
import { LineTarget } from "./LineTarget";
import { SpinGesture } from "./SpinGesture";
import { matchStage } from "./gesture-recognizer";
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
  /** True only while the stage's gesture has been recognized. */
  onMatchChange?: (matches: boolean) => void;
};

/**
 * Recognizes the drawn stroke against a stage's gesture and draws the stage's
 * targets as guides. Matching is forgiving (feature-based, rough proximity,
 * capped rotations); once a stroke matches it stays matched until it clears.
 */
export function GestureRecipe({
  stage,
  points,
  completed = false,
  onMatchChange,
}: GestureRecipeProps) {
  const stageKey = useMemo(() => JSON.stringify(stage), [stage]);
  const [matchedKey, setMatchedKey] = useState<string | null>(null);

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

  const foregroundImage = completed
    ? stage.finishedImage || stage.image
    : stage.image;

  return (
    <div className="relative w-75 h-75 pointer-events-none flex">
      {stage.backgroundImage && (
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-contain"
          src={stage.backgroundImage}
        />
      )}
      {foregroundImage && (
        <img
          alt=""
          className="absolute inset-0 m-auto h-[70%] w-[70%] object-contain"
          src={foregroundImage}
        />
      )}
      {(completed || matches) && (
        <p
          className="z-50 w-fit h-fit whitespace-nowrap"
          style={{
            ...paper(22, 0),
            // Centred on the stage's gesture space (0–200px), not the whole box.
            position: "absolute",
            left: 100,
            top: 100,
            transform: "translate(-50%, -50%)",
            background: "#2FA84F",
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
