import type { Inventory } from "./inventory.ts";

export const MAX_PLAYER_NAME_LENGTH = 20;

/** Chef characters a player can pick in the lobby; each can belong to only one player. */
export const CHARACTERS = ["bear", "cat", "cow", "panda"] as const;
export type CharacterId = (typeof CHARACTERS)[number];

export function isCharacterId(value: unknown): value is CharacterId {
  return (CHARACTERS as readonly unknown[]).includes(value);
}

export interface Player {
  readonly id: string;
  readonly name: string;
  readonly isHost: boolean;
  readonly reconnectToken: string;
  readonly joinedAt: number;
  readonly connected: boolean;
  character: CharacterId | null;

  recipeIndex: number;
  recipeStageIndex: number;
  cart: Inventory;
  inventory: Inventory;
  score: number;
}

export function normalizePlayerName(raw: string | undefined): string {
  if (!raw) {
    return "";
  }

  return raw.trim().replace(/\s+/g, " ").slice(0, MAX_PLAYER_NAME_LENGTH);
}
