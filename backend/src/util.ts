import ingredients from "./data/ingredients.json" with { type: "json" };
import recipes from "./data/recipes.json" with { type: "json" };
import type { Recipe } from "./game/domain/recipe.ts";

export function getRandomIntInclusive(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateRecipeOrder(length: number): Recipe[] {
  const sanitizedRecipes: Recipe[] = recipes.map((recipe) => ({
    name: recipe.name,
    stages: recipe.stages.map((stage) => ({
      ...stage,
      ingredientsConsumed: new Map(
        Object.entries(stage.ingredientsConsumed).map(([a, b]) => [
          Number(a),
          b,
        ]),
      ),
    })),
  }));

  length = Math.min(length, recipes.length);

  // Shuffle the first <length> elements to get <length> random ones
  for (let i = 0; i < length; i++) {
    const idx = getRandomIntInclusive(0, sanitizedRecipes.length - 1);
    [sanitizedRecipes[idx], sanitizedRecipes[i]] = [
      sanitizedRecipes[i],
      sanitizedRecipes[idx],
    ];
  }

  return sanitizedRecipes.slice(0, length);
}

/** Ingredient ids are positional indexes into the ingredients catalogue. */
export function isKnownIngredientId(id: number): boolean {
  return Number.isInteger(id) && id >= 0 && id < ingredients.length;
}
