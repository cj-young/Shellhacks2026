import { useEffect, useMemo, useState } from 'react'
import type { CursorPoint } from './CursorPathTracker'
import { GestureRecipe } from './GestureRecipe'
import type { GestureRecipeDefinition } from './GestureRecipe'

export type MasterRecipeProps = {
  recipe: GestureRecipeDefinition
  points: CursorPoint[]
  /** Time to show a completed stage before proceeding, in milliseconds. */
  stageDelayMs?: number
  /** Called when every stage in the recipe has been completed. */
  onCompleteChange?: (complete: boolean) => void
  /** Called whenever the active stage changes; -1 means the recipe is done. */
  onStageChange?: (stageIndex: number) => void
}

/** Renders a recipe's stages one at a time and advances after each match. */
export function MasterRecipe({
  recipe,
  points,
  stageDelayMs = 500,
  onCompleteChange,
  onStageChange,
}: MasterRecipeProps) {
  const recipeKey = useMemo(() => JSON.stringify(recipe), [recipe])
  const [stageIndex, setStageIndex] = useState(0)
  const [completedStageIndex, setCompletedStageIndex] = useState<number | null>(
    null,
  )

  useEffect(() => {
    setStageIndex(0)
    setCompletedStageIndex(null)
  }, [recipeKey])

  const isComplete = stageIndex >= recipe.stages.length
  const activeStage = isComplete ? undefined : recipe.stages[stageIndex]

  useEffect(() => {
    onCompleteChange?.(isComplete)
  }, [isComplete, onCompleteChange])

  useEffect(() => {
    onStageChange?.(isComplete ? -1 : stageIndex)
  }, [isComplete, onStageChange, stageIndex])

  useEffect(() => {
    if (completedStageIndex === null) return

    const timer = window.setTimeout(() => {
      setStageIndex((currentStage) =>
        currentStage === completedStageIndex ? currentStage + 1 : currentStage,
      )
      setCompletedStageIndex(null)
    }, stageDelayMs)

    return () => window.clearTimeout(timer)
  }, [completedStageIndex, stageDelayMs])

  if (!activeStage) return null

  return (
    <GestureRecipe
      key={`${recipeKey}:${stageIndex}`}
      points={points}
      stage={activeStage}
      onMatchChange={(matches) => {
        if (matches) setCompletedStageIndex(stageIndex)
      }}
    />
  )
}
