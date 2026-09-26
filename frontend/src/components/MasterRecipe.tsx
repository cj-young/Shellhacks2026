import { useEffect, useMemo, useRef, useState } from "react";
import type { CursorPoint } from "./CursorPathTracker";
import { GestureRecipe } from "./GestureRecipe";
import type { GestureRecipeDefinition } from "./GestureRecipe";

export type MasterRecipeProps = {
  recipe: GestureRecipeDefinition;
  points: CursorPoint[];
  /** Time to show a completed stage before proceeding, in milliseconds. */
  stageDelayMs?: number;
  /** Called once when every stage in the recipe has been completed. */
  onCompleteChange?: (complete: boolean) => void;
  /** Called whenever the active stage changes; -1 means the recipe is done. */
  onStageChange?: (stageIndex: number) => void;
};

/** Renders a recipe's stages one at a time and advances after each match. */
export function MasterRecipe({
  recipe,
  points,
  stageDelayMs = 500,
  onCompleteChange,
  onStageChange,
}: MasterRecipeProps) {
  const recipeKey = useMemo(() => JSON.stringify(recipe), [recipe]);
  const [progress, setProgress] = useState({
    recipeKey,
    stageIndex: 0,
    completedStageIndex: null as number | null,
  });
  const completedRecipeKey = useRef<string | null>(null);

  // A new recipe must begin at stage zero immediately, before effects run.
  const currentProgress =
    progress.recipeKey === recipeKey
      ? progress
      : { recipeKey, stageIndex: 0, completedStageIndex: null };

  useEffect(() => {
    completedRecipeKey.current = null;
    setProgress((current) =>
      current.recipeKey === recipeKey
        ? current
        : { recipeKey, stageIndex: 0, completedStageIndex: null },
    );
  }, [recipeKey]);

  const isComplete = currentProgress.stageIndex >= recipe.stages.length;
  const activeStage = isComplete
    ? undefined
    : recipe.stages[currentProgress.stageIndex];

  useEffect(() => {
    if (!isComplete || completedRecipeKey.current === recipeKey) return;

    completedRecipeKey.current = recipeKey;
    onCompleteChange?.(true);
  }, [isComplete, onCompleteChange, recipeKey]);

  useEffect(() => {
    onStageChange?.(isComplete ? -1 : currentProgress.stageIndex);
  }, [currentProgress.stageIndex, isComplete, onStageChange]);

  useEffect(() => {
    if (currentProgress.completedStageIndex === null) return;

    const timer = window.setTimeout(() => {
      setProgress((current) => {
        if (
          current.recipeKey !== recipeKey ||
          current.stageIndex !== currentProgress.completedStageIndex
        ) {
          return current;
        }

        return {
          ...current,
          stageIndex: current.stageIndex + 1,
          completedStageIndex: null,
        };
      });
    }, stageDelayMs);

    return () => window.clearTimeout(timer);
  }, [currentProgress.completedStageIndex, recipeKey, stageDelayMs]);

  if (!activeStage) return null;

  return (
    <GestureRecipe
      key={`${recipeKey}:${currentProgress.stageIndex}`}
      points={points}
      stage={activeStage}
      onMatchChange={(matches) => {
        if (!matches) return;

        setProgress((current) =>
          current.recipeKey === recipeKey &&
          current.completedStageIndex !== currentProgress.stageIndex
            ? { ...current, completedStageIndex: currentProgress.stageIndex }
            : current,
        );
      }}
    />
  );
}
