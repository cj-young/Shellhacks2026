import { generateGameCode, generateHostToken, normalizeGameCode } from '../domain/code.ts';
import type { Game } from '../domain/game.ts';
import type { GameStore } from '../ports/game-store.ts';

const MAX_CODE_ATTEMPTS = 5;

export class GameService {
  readonly #store: GameStore;

  constructor(store: GameStore) {
    this.#store = store;
  }

  async createGame(): Promise<Game> {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      const game: Game = {
        code: generateGameCode(),
        hostToken: generateHostToken(),
        createdAt: Date.now(),
      };

      if (await this.#store.createIfAbsent(game)) {
        return game;
      }
    }

    throw new Error('Failed to allocate a unique game code');
  }

  async getGame(code: string): Promise<Game | undefined> {
    return this.#store.get(normalizeGameCode(code));
  }
}
