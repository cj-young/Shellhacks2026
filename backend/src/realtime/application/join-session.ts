import { randomUUID } from 'node:crypto';

import type { GameService } from '../../game/application/game-service.ts';
import { normalizeGameCode } from '../../game/domain/code.ts';
import type { PlayerSummary } from '../domain/player.ts';

export type JoinResult =
  | { ok: true; gameCode: string; player: PlayerSummary }
  | { ok: false; code: string; message: string };

export interface JoinInput {
  code: string;
  hostToken?: string;
}

export class JoinSession {
  readonly #gameService: GameService;

  constructor(gameService: GameService) {
    this.#gameService = gameService;
  }

  async join(input: JoinInput): Promise<JoinResult> {
    const game = await this.#gameService.getGame(normalizeGameCode(input.code));

    if (!game) {
      return { ok: false, code: 'GAME_NOT_FOUND', message: 'No game found for that code' };
    }

    const isHost = input.hostToken !== undefined && input.hostToken === game.hostToken;
    const player: PlayerSummary = { id: randomUUID(), joinedAt: Date.now(), isHost };

    return { ok: true, gameCode: game.code, player };
  }
}
