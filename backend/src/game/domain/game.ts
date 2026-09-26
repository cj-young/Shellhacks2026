import type { Player } from "./player.ts";
import type { Recipe } from "./recipe.ts";

export type GameStatus = "lobby" | "active" | "finished";

export const ROUND_DURATION_MS = 180_000;

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
    roundStartedAt: null,
    roundEndsAt: null,
  } as GameState;
}

export type GameState = {
  recipeOrder: Recipe[];
  players: Player[];
  roundStartedAt: number | null;
  roundEndsAt: number | null;
};
