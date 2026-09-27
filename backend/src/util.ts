import ingredients from "./data/ingredients.json" with { type: "json" };
import recipes from "./data/recipes.json" with { type: "json" };
import sabotageDefinitions from "./data/sabotages.json" with { type: "json" };
import type { Recipe } from "./game/domain/recipe.ts";
import type { SabotageDefinition, SabotageId } from "./game/domain/sabotage.ts";

export function getRandomIntInclusive(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateRecipeOrder(length: number): Recipe[] {
  const pool = recipes.map((recipe) => ({
    name: recipe.name,
    ingredients: recipe.ingredients,
    stages: recipe.stages.map((stage) => ({
      ...stage,
      ingredientsConsumed: { ...stage.ingredientsConsumed },
      timeLimitMs: stage.timeLimitMs,
    })),
  })) as Recipe[];

  length = Math.min(length, pool.length);

  // Shuffle the first <length> elements to get <length> random ones
  for (let i = 0; i < length; i++) {
    const idx = getRandomIntInclusive(0, pool.length - 1);
    [pool[idx], pool[i]] = [pool[i], pool[idx]];
  }

  return pool.slice(0, length);
}

/** Ingredient ids are positional indexes into the ingredients catalogue. */
export function isKnownIngredientId(id: number): boolean {
  return Number.isInteger(id) && !!ingredients.find((v) => v.id == id);
}

export function listSabotageDefinitions(): SabotageDefinition[] {
  return sabotageDefinitions as SabotageDefinition[];
}

export function getSabotageDefinition(
  id: SabotageId,
): SabotageDefinition | undefined {
  return listSabotageDefinitions().find((definition) => definition.id === id);
}
