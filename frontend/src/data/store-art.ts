import ingredients from "./ingredients.json";
import { ingredientAsset, menuIngredientIdFor } from "./menu";

/**
 * Every ingredient icon the store can show (color and silhouette variants), so
 * the shelves can be preloaded before the player opens them. Ingredients that
 * already carry their own image URL use it directly, matching `iconIdFor`.
 */
export function storeArtUrls(): string[] {
  const urls = new Set<string>();
  for (const ingredient of ingredients) {
    const id = menuIngredientIdFor(ingredient.name);
    if (id) {
      urls.add(ingredientAsset(id));
      urls.add(ingredientAsset(id, true));
    } else {
      urls.add(ingredient.image);
    }
  }
  return [...urls];
}
