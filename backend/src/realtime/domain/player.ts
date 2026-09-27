import type { Inventory } from "../../game/domain/inventory.ts";
import type {
  CharacterId,
  Player,
  PlayerInterfaceState,
} from "../../game/domain/player.ts";

export interface PlayerSummary {
  readonly id: string;
  readonly name: string;
  readonly isHost: boolean;
  readonly joinedAt: number;
  readonly connected: boolean;
  readonly character: CharacterId | null;
  readonly cart: Inventory;
  readonly inventory: Inventory;
  readonly interfaceState: PlayerInterfaceState;
  readonly recipeIndex: number;
  readonly recipeStageIndex: number;
  readonly score: number;
  readonly sabotageCredits: number;
  /** Unused awarded sabotages by id, oldest first (e.g. ["freeze"]). */
  readonly heldSabotages: string[];
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
    interfaceState: player.interfaceState,
    recipeIndex: player.recipeIndex,
    recipeStageIndex: player.recipeStageIndex,
    score: player.score,
    sabotageCredits: player.sabotages.filter((entry) => entry.usedAt === null)
      .length,
    heldSabotages: player.sabotages
      .filter((entry) => entry.usedAt === null && entry.definitionId !== null)
      .map((entry) => entry.definitionId as string),
    stageDeadlineAt: player.stageDeadlineAt,
  };
}
