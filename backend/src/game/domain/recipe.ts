export type Recipe = {
  name: string;
  ingredients: { id: number; count: number }[];
  stages: RecipeStage[];
};

export type RecipeStage = {
  type: string;
  image?: string;
  lines: LineType[];
  ingredientsConsumed: Record<number, number>;
  /** How long the player has on this stage before it fails; null/absent = no limit. */
  timeLimitMs?: number | null;
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
