import type { Inventory } from "../../game/domain/inventory.ts";
import type { CharacterId, Player } from "../../game/domain/player.ts";

export interface PlayerSummary {
  readonly id: string;
  readonly name: string;
  readonly isHost: boolean;
  readonly joinedAt: number;
  readonly connected: boolean;
  readonly character: CharacterId | null;
  readonly cart: Inventory;
  readonly inventory: Inventory;
  readonly recipeIndex: number;
  readonly recipeStageIndex: number;
  readonly score: number;
  readonly stageDeadlineAt: number | null;
}

export function toPlayerSummary(player: Player): PlayerSummary {
  return {
    id: player.id,
    name: player.name,
    isHost: player.isHost,
    joinedAt: player.joinedAt,
    connected: player.connected,
    character: player.character,
    cart: player.cart,
    inventory: player.inventory,
    recipeIndex: player.recipeIndex,
    recipeStageIndex: player.recipeStageIndex,
    score: player.score,
    stageDeadlineAt: player.stageDeadlineAt,
  };
}
