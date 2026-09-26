import { generateRecipeOrder } from '../../util.ts'
import {
  generateGameCode,
  generateHostToken,
  normalizeGameCode,
} from '../domain/code.ts'
import { MakeEmptyState, type Game } from '../domain/game.ts'
import type { GameStore } from '../ports/game-store.ts'

const MAX_CODE_ATTEMPTS = 5

export type StartGameResult =
  | { ok: true; game: Game }
  | { ok: false; code: 'GAME_NOT_FOUND' | 'ALREADY_STARTED' }

export class GameService {
  readonly #store: GameStore

  constructor(store: GameStore) {
    this.#store = store
  }

  async createGame(): Promise<Game> {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      const game: Game = {
        code: generateGameCode(),
        hostToken: generateHostToken(),
        status: 'lobby',
        createdAt: Date.now(),
        state: MakeEmptyState(),
      }

      if (await this.#store.createIfAbsent(game)) {
        return game
      }
    }

    throw new Error('Failed to allocate a unique game code')
  }

  async getGame(code: string): Promise<Game | undefined> {
    return this.#store.get(normalizeGameCode(code))
  }

  async startGame(code: string): Promise<StartGameResult> {
    const game = await this.#store.get(normalizeGameCode(code))

    if (!game) {
      return { ok: false, code: 'GAME_NOT_FOUND' }
    }

    if (game.status !== 'lobby') {
      return { ok: false, code: 'ALREADY_STARTED' }
    }

    const order = generateRecipeOrder(3)

    const started: Game = {
      ...game,
      status: 'active',
      state: { ...game.state, recipeOrder: order },
    }
    await this.#store.save(started)

    return { ok: true, game: started }
  }
}
