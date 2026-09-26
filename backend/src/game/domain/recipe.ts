export type Recipe = {
  name: string;
  ingredients: {id: number, count: number}[];
  stages: RecipeStage[];
};

export type RecipeStage = {
  type: string;
  image?: string;
  lines: LineType[];
  ingredientsConsumed: Inventory;
};

export type LineType = {
  start: Point;
  end: Point;
  radius: number;
};

export type Point = {
  x: number;
  y: number;
};

export type Ingredient = {
  id: number;
  name: string;
  image: string;
  category: string;
};
import type { Inventory } from "./inventory.ts";
