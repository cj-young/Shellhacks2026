export type Recipe = {
  name: string;
  stages: RecipeStage[];
};

export type RecipeStage = {
  type: string;
  image?: string;
  lines: LineType[];
  ingredientsConsumed: Map<number, number>;
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
