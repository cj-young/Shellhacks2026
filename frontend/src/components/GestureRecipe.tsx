import { useEffect, useMemo, useState } from "react";
import type { CursorPoint } from "./CursorPathTracker";
import { LineTarget } from "./LineTarget";
import { SpinGesture } from "./SpinGesture";
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
  /** True only while every target in this stage has been matched. */
  onMatchChange?: (matches: boolean) => void;
};

type MatchState = {
  stageKey: string;
  targets: boolean[];
};

export function GestureRecipe({
  stage,
  points,
  completed = false,
  onMatchChange,
}: GestureRecipeProps) {
  const stageKey = useMemo(() => JSON.stringify(stage), [stage]);
  const targetCount =
    stage.type === "spin" ? stage.spins.length : stage.lines.length;
  const [matchState, setMatchState] = useState<MatchState>({
    stageKey,
    targets: Array(targetCount).fill(false),
  });

  const matches =
    targetCount > 0 &&
    matchState.stageKey === stageKey &&
    matchState.targets.length === targetCount &&
    matchState.targets.every(Boolean);

  useEffect(() => {
    onMatchChange?.(matches);
  }, [matches, onMatchChange]);

  const updateTargetMatch = (index: number, targetMatches: boolean) => {
    setMatchState((currentState) => {
      const currentMatches =
        currentState.stageKey === stageKey
          ? currentState.targets
          : Array(targetCount).fill(false);

      if (currentMatches[index] === targetMatches) return currentState;

      const nextMatches = [...currentMatches];
      nextMatches[index] = targetMatches;

      return { stageKey, targets: nextMatches };
    });
  };

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
          className="absolute top-0 left-0 bottom-0 right-0 m-auto w-fit h-fit z-50"
          style={{
            ...paper(22, 0),
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
                allowStartOutsideTarget
                points={points}
                onMatchChange={(matches) => updateTargetMatch(index, matches)}
              />
            ))
          : stage.lines.map((line, index) => (
              <LineTarget
                key={`${stageKey}:${index}`}
                allowStartOutsideTarget
                end={line.end}
                onMatchChange={(matches) => updateTargetMatch(index, matches)}
                origin={line.start}
                points={points}
                radius={line.radius}
              />
            ))}
    </div>
  );
}
