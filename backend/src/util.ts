import recipes from './data/recipes.json' with { type: 'json' }
import type { Recipe } from './game/domain/game.ts'

export function getRandomIntInclusive(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateRecipeOrder(length: number) {
  const chosen: number[] = []
  const res: Recipe[] = []
  let i = 0

  while (i < length) {
    const select = getRandomIntInclusive(0, recipes.length - 1)
    if (!chosen.includes(select)) {
      res.push(recipes[select])
      i++
    }
  }

  return res
}
