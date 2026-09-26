import type { Player } from "./player.ts";
import type { Recipe } from "./recipe.ts";

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
