import type { Router } from 'express';

import { GameService } from './application/game-service.ts';
import { createGameRouter } from './http/game-routes.ts';
import { InMemoryGameStore } from './infrastructure/in-memory-game-store.ts';
import type { GameStore } from './ports/game-store.ts';

export function createGameModule(store: GameStore = new InMemoryGameStore()): Router {
  const gameService = new GameService(store);
  return createGameRouter(gameService);
}

export { GameService } from './application/game-service.ts';
export { InMemoryGameStore } from './infrastructure/in-memory-game-store.ts';
export type { GameStore } from './ports/game-store.ts';
export type { Game } from './domain/game.ts';
