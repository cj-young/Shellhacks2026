import menu from "./menu.json";

export type Gesture = "chop" | "stir" | "flip" | "plate";

export type Shelf = { id: string; name: string };

export type MenuIngredient = {
  id: string;
  name: string;
  shelf: string;
  /** Main color; used for chop bits and anywhere a flat swatch is needed. */
  color: string;
  /** Short label printed on placeholder art. */
  label: string;
  /** On the shelves to trip people up; in no recipe. */
  decoy?: boolean;
  lookalike?: string;
};

export type RecipeStep = {
  gesture: Gesture;
  ingredient?: string;
  label: string;
};

export type MenuRecipe = {
  id: string;
  name: string;
  ingredients: string[];
  steps: RecipeStep[];
};

export const SHELVES: Shelf[] = menu.shelves;
export const INGREDIENTS: MenuIngredient[] = menu.ingredients;
export const RECIPES: MenuRecipe[] = menu.recipes as MenuRecipe[];

const byId = new Map(INGREDIENTS.map((i) => [i.id, i]));

export const getIngredient = (id: string) => byId.get(id);
export const ingredientName = (id: string) => byId.get(id)?.name ?? id;
export const isMenuIngredient = (id: string) => byId.has(id);
export const getRecipe = (id: string) => RECIPES.find((r) => r.id === id);

/** Swap final art into public/assets under the same names — no code changes needed. */
export const ingredientAsset = (id: string, silhouette = false) =>
  `/assets/ingredient-${id}${silhouette ? "-silhouette" : ""}.svg`;
export const dishAsset = (recipeId: string) => `/assets/dish-${recipeId}.svg`;

export const shelfItems = (shelfId: string) =>
  INGREDIENTS.filter((i) => i.shelf === shelfId).map((i) => i.id);
