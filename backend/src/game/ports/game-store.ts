import type { Game } from '../domain/game.ts'

export interface GameStore {
  createIfAbsent(game: Game): Promise<boolean>
  get(code: string): Promise<Game | undefined>
  save(game: Game): Promise<void>
  delete(code: string): Promise<boolean>
}
