import type { GameService } from "../../game/application/game-service.ts";
import type { GameState } from "../../game/domain/game.ts";
import { toPlayerSummary } from "../domain/player.ts";
import type { PlayerSummary } from "../domain/player.ts";
import type { ClientGameState } from "../domain/protocol.ts";

export type JoinResult =
  | {
      ok: true;
      gameCode: string;
      player: PlayerSummary;
      reconnectToken: string;
      players: PlayerSummary[];
    }
  | { ok: false; code: string; message: string };

export interface JoinInput {
  code: string;
  name?: string;
  hostToken?: string;
  reconnectToken?: string;
}

export type StartResult =
  | { ok: true; gameCode: string; state: ClientGameState }
  | { ok: false; code: string; message: string };

export interface StartInput {
  code: string;
  isHost: boolean;
}

export interface LeaveInput {
  code: string;
  playerId: string;
}

const JOIN_MESSAGES: Record<string, string> = {
  GAME_NOT_FOUND: "No game found for that code",
  GAME_STARTED: "This game has already started",
  GAME_FULL: "This game is full",
};

export class GameSession {
  readonly #gameService: GameService;

  constructor(gameService: GameService) {
    this.#gameService = gameService;
  }

  async join(input: JoinInput): Promise<JoinResult> {
    const result = await this.#gameService.joinPlayer(input.code, {
      name: input.name,
      hostToken: input.hostToken,
      reconnectToken: input.reconnectToken,
    });

    if (!result.ok) {
      return {
        ok: false,
        code: result.code,
        message: JOIN_MESSAGES[result.code] ?? "Unable to join the game",
      };
    }

    return {
      ok: true,
      gameCode: result.game.code,
      player: toPlayerSummary(result.player),
      reconnectToken: result.player.reconnectToken,
      players: result.game.state.players.map(toPlayerSummary),
    };
  }

  async start(input: StartInput): Promise<StartResult> {
    if (!input.isHost) {
      return {
        ok: false,
        code: "NOT_HOST",
        message: "Only the host can start the game",
      };
    }

    const result = await this.#gameService.startGame(input.code);

    if (!result.ok) {
      if (result.code === "GAME_NOT_FOUND") {
        return {
          ok: false,
          code: "GAME_NOT_FOUND",
          message: "No game found for that code",
        };
      }

      return {
        ok: false,
        code: "ALREADY_STARTED",
        message: "This game has already started",
      };
    }

    return {
      ok: true,
      gameCode: result.game.code,
      state: toClientGameState(result.game.state),
    };
  }

  async leave(input: LeaveInput): Promise<void> {
    await this.#gameService.markDisconnected(input.code, input.playerId);
  }
}

function toClientGameState(state: GameState): ClientGameState {
  return {
    recipeOrder: state.recipeOrder,
    players: state.players.map(toPlayerSummary),
  };
}
