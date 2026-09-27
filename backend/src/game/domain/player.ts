import type { Inventory } from "./inventory.ts";

export const MAX_PLAYER_NAME_LENGTH = 20;

export interface Player {
  readonly id: string;
  readonly name: string;
  readonly isHost: boolean;
  readonly reconnectToken: string;
  readonly joinedAt: number;
  readonly connected: boolean;

  recipeIndex: number;
  recipeStageIndex: number;
  cart: Inventory;
  inventory: Inventory;
  score: number;
  /** Epoch ms when the current stage's time limit expires; null = no limit. */
  stageDeadlineAt: number | null;
}

export function normalizePlayerName(raw: string | undefined): string {
  if (!raw) {
    return "";
  }

  return raw.trim().replace(/\s+/g, " ").slice(0, MAX_PLAYER_NAME_LENGTH);
}
