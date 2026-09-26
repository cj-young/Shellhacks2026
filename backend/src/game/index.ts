import type { Router } from 'express'

import { GameService } from './application/game-service.ts'
import { createGameRouter } from './http/game-routes.ts'
import { InMemoryGameStore } from './infrastructure/in-memory-game-store.ts'
import type { GameStore } from './ports/game-store.ts'

export interface GameModule {
  router: Router
  service: GameService
}

export function createGameModule(
  store: GameStore = new InMemoryGameStore(),
): GameModule {
  const service = new GameService(store)
  return { router: createGameRouter(service), service }
}

export { GameService } from './application/game-service.ts'
export { InMemoryGameStore } from './infrastructure/in-memory-game-store.ts'
export type { StartGameResult } from './application/game-service.ts'
export type { GameStore } from './ports/game-store.ts'
export type { Game, GameStatus } from './domain/game.ts'
