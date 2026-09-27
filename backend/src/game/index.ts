import type { Router } from "express";

import { GameService } from "./application/game-service.ts";
import { createGameRouter } from "./http/game-routes.ts";
import { InMemoryGameStore } from "./infrastructure/in-memory-game-store.ts";
import type { GameStore } from "./ports/game-store.ts";

export interface GameModule {
  router: Router;
  service: GameService;
}

export function createGameModule(
  store: GameStore = new InMemoryGameStore(),
): GameModule {
  const service = new GameService(store);
  return { router: createGameRouter(service), service };
}

export {
  GameService,
  MAX_ITEM_COUNT,
  MAX_PLAYERS,
  POINTS_PER_RECIPE,
  WASTE_PENALTY_PER_ITEM,
} from "./application/game-service.ts";
export { InMemoryGameStore } from "./infrastructure/in-memory-game-store.ts";
export type {
  AddItemsResult,
  ConsumeItemsResult,
  EndRoundResult,
  ExpireStagesResult,
  FinishStageResult,
  UseSabotageResult,
  JoinPlayerInput,
  JoinPlayerResult,
  StartGameOptions,
  StartGameResult,
} from "./application/game-service.ts";
export type { GameStore } from "./ports/game-store.ts";
export type { Game, GameStatus } from "./domain/game.ts";
export type { Inventory, PurchaseItem } from "./domain/inventory.ts";
export type { Player } from "./domain/player.ts";
export type {
  Sabotage,
  SabotageApplication,
  UseSabotagePayload,
  SabotageDefinition,
  SabotageId,
  SabotageTargetScope,
} from "./domain/sabotage.ts";
