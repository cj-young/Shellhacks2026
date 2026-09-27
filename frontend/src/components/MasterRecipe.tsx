import { useEffect, useMemo, useRef, useState } from "react";
import type { CursorPoint } from "./CursorPathTracker";
import { GestureRecipe } from "./GestureRecipe";
import type { GestureRecipeDefinition } from "./GestureRecipe";

export type MasterRecipeProps = {
  /** Freeze gesture recognition and stage advancement without losing progress. */
  paused?: boolean;
  recipe: GestureRecipeDefinition;
  points: CursorPoint[];
  /** Stage to resume on mount; later recipe changes still start at stage zero. */
  initialStageIndex?: number;
  /** Time to show finishedImage before proceeding; unused when it is absent. */
  stageDelayMs?: number;
  /** Called once when every stage in the recipe has been completed. */
  onCompleteChange?: (complete: boolean) => void;
  /** Called whenever the active stage changes; -1 means the recipe is done. */
  onStageChange?: (stageIndex: number) => void;
  /** Called once each time a stage's gesture is recognized. */
  onStageMatch?: (stageIndex: number) => void;
  /** Called when a deliberate stroke ends without matching the active stage. */
  onWrong?: () => void;
};

/** Renders a recipe's stages one at a time and advances after each match. */
export function MasterRecipe({
  recipe,
  paused = false,
  points,
  initialStageIndex = 0,
  stageDelayMs = 1500,
  onCompleteChange,
  onStageChange,
  onStageMatch,
  onWrong,
}: MasterRecipeProps) {
  const recipeKey = useMemo(() => JSON.stringify(recipe), [recipe]);
  const [progress, setProgress] = useState({
    recipeKey,
    stageIndex: initialStageIndex,
    completedStageIndex: null as number | null,
  });
  const completedRecipeKey = useRef<string | null>(null);
  const matchedStageKey = useRef<string | null>(null);

  // A new recipe must begin at stage zero immediately, before effects run.
  const currentProgress =
    progress.recipeKey === recipeKey
      ? progress
      : { recipeKey, stageIndex: 0, completedStageIndex: null };

  useEffect(() => {
    completedRecipeKey.current = null;
    matchedStageKey.current = null;
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
    if (paused || !isComplete || completedRecipeKey.current === recipeKey)
      return;

    completedRecipeKey.current = recipeKey;
    onCompleteChange?.(true);
  }, [paused, isComplete, onCompleteChange, recipeKey]);

  useEffect(() => {
    onStageChange?.(isComplete ? -1 : currentProgress.stageIndex);
  }, [currentProgress.stageIndex, isComplete, onStageChange]);

  useEffect(() => {
    if (paused || currentProgress.completedStageIndex === null) return;

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
  }, [paused, currentProgress.completedStageIndex, recipeKey, stageDelayMs]);

  if (!activeStage) return null;

  return (
    <GestureRecipe
      key={`${recipeKey}:${currentProgress.stageIndex}`}
      points={paused ? [] : points}
      stage={activeStage}
      paused={paused}
      completed={
        currentProgress.completedStageIndex === currentProgress.stageIndex
      }
      onWrong={onWrong}
      onMatchChange={(matches) => {
        if (paused || !matches) return;

        const matchKey = `${recipeKey}:${currentProgress.stageIndex}`;
        if (matchedStageKey.current !== matchKey) {
          matchedStageKey.current = matchKey;
          onStageMatch?.(currentProgress.stageIndex);
        }

        setProgress((current) =>
          current.recipeKey === recipeKey &&
          current.stageIndex === currentProgress.stageIndex &&
          current.completedStageIndex !== currentProgress.stageIndex
            ? activeStage.finishedImage
              ? { ...current, completedStageIndex: currentProgress.stageIndex }
              : {
                  ...current,
                  stageIndex: current.stageIndex + 1,
                  completedStageIndex: null,
                }
            : current,
        );
      }}
    />
  );
}
