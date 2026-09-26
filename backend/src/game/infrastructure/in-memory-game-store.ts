import type { Game } from '../domain/game.ts'
import type { GameStore } from '../ports/game-store.ts'

export class InMemoryGameStore implements GameStore {
  readonly #games = new Map<string, Game>()

  async createIfAbsent(game: Game): Promise<boolean> {
    if (this.#games.has(game.code)) {
      return false
    }

    this.#games.set(game.code, game)
    return true
  }

  async get(code: string): Promise<Game | undefined> {
    return this.#games.get(code)
  }

  async save(game: Game): Promise<void> {
    this.#games.set(game.code, game)
  }

  async delete(code: string): Promise<boolean> {
    return this.#games.delete(code)
  }
}
