import type { Player } from "./player.ts";

export type GameStatus = "lobby" | "active";

export type Game = {
  readonly code: string;
  readonly hostToken: string;
  readonly status: GameStatus;
  readonly createdAt: number;

  state: GameState;
};

export function MakeEmptyState() {
  return {
    recipeOrder: [],
    players: [],
  } as GameState;
}

export type GameState = {
  recipeOrder: Recipe[];
  players: Player[];
};

export type Recipe = {
  name: string;
  ingredients: { id: number; count: number }[];
  stages: RecipeStage[];
};

export type RecipeStage = {
  type: string;
  image?: string;
  lines: LineType[];
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
  name: string;
  image: string;
  category: string;
};
