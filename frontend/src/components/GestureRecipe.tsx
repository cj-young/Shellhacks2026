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
  stage: GestureRecipeStage
  points: CursorPoint[]
  /** True only while every line in this stage has been matched. */
  onMatchChange?: (matches: boolean) => void
}

type MatchState = {
  stageKey: string
  lines: boolean[]
}

export function GestureRecipe({
  stage,
  points,
  onMatchChange,
}: GestureRecipeProps) {
  const stageKey = useMemo(() => JSON.stringify(stage), [stage])
  const stageLines = stage.lines
  const [matchState, setMatchState] = useState<MatchState>({
    stageKey,
    lines: Array(stageLines.length).fill(false),
  })

  const matches =
    stageLines.length > 0 &&
    matchState.stageKey === stageKey &&
    matchState.lines.length === stageLines.length &&
    matchState.lines.every(Boolean)

  useEffect(() => {
    onMatchChange?.(matches)
  }, [matches, onMatchChange])

  const updateLineMatch = (index: number, lineMatches: boolean) => {
    setMatchState((currentState) => {
      const currentMatches =
        currentState.stageKey === stageKey
          ? currentState.lines
          : Array(stageLines.length).fill(false)

      if (currentMatches[index] === lineMatches) return currentState

      const nextMatches = [...currentMatches]
      nextMatches[index] = lineMatches

      return { stageKey, lines: nextMatches }
    })
  }

  return (
    <div className="relative w-75 h-75 pointer-events-none flex">
      {stage.image && (
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-contain"
          src={stage.image}
        />
      )}
      <p className="absolute top-0 left-0 bottom-0 right-0 m-auto w-fit h-fit z-50 text-white">
        {matches ? 'Success!' : 'Failure'}
      </p>
      {stageLines.map((line, index) => (
        <LineTarget
          key={`${stageKey}:${index}`}
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
