export function MakeEmptyState() {
  return {
    recipeOrder: []
  } as GameState
}

export type GameState = {
  recipeOrder: Recipe[]
}

export type Recipe = {
  name: string,
  stages: RecipeStage[]
}

export type RecipeStage = {
  type: string,
  image?: string,
  lines: LineType[]
} 

export type LineType = {
  start: Point,
  end: Point,
  radius: number
}

export type Point = {
  x: number,
  y: number
}
