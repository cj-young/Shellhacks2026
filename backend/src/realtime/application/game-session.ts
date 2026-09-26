import { randomUUID } from 'node:crypto'

import type { GameService } from '../../game/application/game-service.ts'
import { normalizeGameCode } from '../../game/domain/code.ts'
import type { GameState } from '../../game/domain/game.ts'
import { normalizePlayerName } from '../domain/player.ts'
import type { PlayerSummary } from '../domain/player.ts'

export type JoinResult =
  | { ok: true; gameCode: string; player: PlayerSummary }
  | { ok: false; code: string; message: string }

export interface JoinInput {
  code: string
  name?: string
  hostToken?: string
}

export type StartResult =
  | { ok: true; gameCode: string; state: GameState }
  | { ok: false; code: string; message: string }

export interface StartInput {
  code: string
  isHost: boolean
}

export class GameSession {
  readonly #gameService: GameService

  constructor(gameService: GameService) {
    this.#gameService = gameService
  }

  async join(input: JoinInput): Promise<JoinResult> {
    const game = await this.#gameService.getGame(normalizeGameCode(input.code))

    if (!game) {
      return {
        ok: false,
        code: 'GAME_NOT_FOUND',
        message: 'No game found for that code',
      }
    }

    if (game.status !== 'lobby') {
      return {
        ok: false,
        code: 'GAME_STARTED',
        message: 'This game has already started',
      }
    }

    const isHost =
      input.hostToken !== undefined && input.hostToken === game.hostToken
    const name = normalizePlayerName(input.name) || (isHost ? 'Host' : 'Player')
    const player: PlayerSummary = {
      id: randomUUID(),
      name,
      joinedAt: Date.now(),
      isHost,
    }

    return { ok: true, gameCode: game.code, player }
  }

  async start(input: StartInput): Promise<StartResult> {
    if (!input.isHost) {
      return {
        ok: false,
        code: 'NOT_HOST',
        message: 'Only the host can start the game',
      }
    }

    const result = await this.#gameService.startGame(input.code)

    if (!result.ok) {
      if (result.code === 'GAME_NOT_FOUND') {
        return {
          ok: false,
          code: 'GAME_NOT_FOUND',
          message: 'No game found for that code',
        }
      }

      return {
        ok: false,
        code: 'ALREADY_STARTED',
        message: 'This game has already started',
      }
    }

    return { ok: true, gameCode: result.game.code, state: result.game.state }
  }
}
