import type { Game } from '../domain/game.ts';

export interface GameStore {
  createIfAbsent(game: Game): Promise<boolean>;
  get(code: string): Promise<Game | undefined>;
  delete(code: string): Promise<boolean>;
}
