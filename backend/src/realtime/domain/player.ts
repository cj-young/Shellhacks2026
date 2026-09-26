import type { Inventory } from "../../game/domain/inventory.ts";
import type { Player } from "../../game/domain/player.ts";

export interface PlayerSummary {
  readonly id: string;
  readonly name: string;
  readonly isHost: boolean;
  readonly joinedAt: number;
  readonly connected: boolean;
  readonly inventory: Inventory;
  readonly recipeIndex: number;
  readonly recipeStageIndex: number;
  readonly score: number;
}

export function toPlayerSummary(player: Player): PlayerSummary {
  return {
    id: player.id,
    name: player.name,
    isHost: player.isHost,
    joinedAt: player.joinedAt,
    connected: player.connected,
    inventory: player.inventory,
    recipeIndex: player.recipeIndex,
    recipeStageIndex: player.recipeStageIndex,
    score: player.score,
  };
}
