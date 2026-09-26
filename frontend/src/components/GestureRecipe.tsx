import { useEffect, useMemo, useState } from 'react'
import type { CursorPoint } from './CursorPathTracker'
import { LineTarget } from './LineTarget'

export type GestureRecipeLine = {
  start: CursorPoint
  end: CursorPoint
  radius: number
}

export type GestureRecipeStage = {
  image?: string
  lines: GestureRecipeLine[]
}

/** Shape of one recipe entry in data/recipes.json. */
export type GestureRecipeDefinition = {
  name: string
  stages: GestureRecipeStage[]
}

export type GestureRecipeProps = {
  recipe: GestureRecipeDefinition
  points: CursorPoint[]
  /** True only while every line in this recipe has been matched. */
  onMatchChange?: (matches: boolean) => void
}

type MatchState = {
  recipeKey: string
  lines: boolean[]
}

export function GestureRecipe({
  recipe,
  points,
  onMatchChange,
}: GestureRecipeProps) {
  const recipeKey = useMemo(() => JSON.stringify(recipe), [recipe])
  const stageLines = recipe.stages[0]?.lines ?? []
  const [matchState, setMatchState] = useState<MatchState>({
    recipeKey,
    lines: Array(stageLines.length).fill(false),
  })

  const matches =
    stageLines.length > 0 &&
    matchState.recipeKey === recipeKey &&
    matchState.lines.length === stageLines.length &&
    matchState.lines.every(Boolean)

  useEffect(() => {
    onMatchChange?.(matches)
  }, [matches, onMatchChange])

  const updateLineMatch = (index: number, lineMatches: boolean) => {
    setMatchState((currentState) => {
      const currentMatches =
        currentState.recipeKey === recipeKey
          ? currentState.lines
          : Array(stageLines.length).fill(false)

      if (currentMatches[index] === lineMatches) return currentState

      const nextMatches = [...currentMatches]
      nextMatches[index] = lineMatches

      return { recipeKey, lines: nextMatches }
    })
  }

  return (
    <div className='relative w-75 h-75 pointer-events-none flex'>
      <p className='absolute top-0 left-0 bottom-0 right-0 m-auto w-fit h-fit z-50 text-white'>{matches ? "Success!" : "Failure"}</p>
      {stageLines.map((line, index) => (
        <LineTarget
          key={`${recipeKey}:${index}`}
          allowStartOutsideTarget
          end={line.end}
          onMatchChange={(lineMatches) => updateLineMatch(index, lineMatches)}
          origin={line.start}
          points={points}
          radius={line.radius}
        />
      ))}
    </div>
  )
}
