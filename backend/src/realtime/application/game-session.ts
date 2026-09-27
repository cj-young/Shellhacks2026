import type { GameService } from "../../game/application/game-service.ts";
import type { GameState, GameStatus } from "../../game/domain/game.ts";
import type { PurchaseItem } from "../../game/domain/inventory.ts";
import { toPlayerSummary } from "../domain/player.ts";
import type { PlayerSummary } from "../domain/player.ts";
import type { ClientGameState, PlayerResult } from "../domain/protocol.ts";

export type JoinResult =
  | {
      ok: true;
      gameCode: string;
      status: GameStatus;
      player: PlayerSummary;
      reconnectToken: string;
      players: PlayerSummary[];
      state: ClientGameState;
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

export type EndRoundResult =
  | {
      ok: true;
      gameCode: string;
      state: ClientGameState;
      results: PlayerResult[];
    }
  | { ok: false; code: string; message: string };

export interface EndRoundInput {
  code: string;
}

export interface LeaveInput {
  code: string;
  playerId: string;
}

export type PurchaseResult =
  | { ok: true; gameCode: string; state: ClientGameState }
  | { ok: false; code: string; message: string };

export interface PurchaseInput {
  code: string;
  playerId: string;
  items: PurchaseItem[];
}

export type ConsumeIngredientsInput = PurchaseInput;
export type ConsumeIngredientsResult = PurchaseResult;
export type UpdateCartInput = PurchaseInput;
export type UpdateCartResult = PurchaseResult;

export interface SelectCharacterInput {
  code: string;
  playerId: string;
  character: unknown;
}

export type SelectCharacterResult =
  | { ok: true; player: PlayerSummary }
  | { ok: false; code: string; message: string };

export type FinishStageResult =
  | { ok: true; gameCode: string; state: ClientGameState }
  | { ok: false; code: string; message: string };

export interface FinishStageInput {
  code: string;
  playerId: string;
}

export type ExpireStagesResult =
  | { ok: true; gameCode: string; state: ClientGameState; changed: boolean }
  | { ok: false; code: string; message: string };

export interface ExpireStagesInput {
  code: string;
}

const JOIN_MESSAGES: Record<string, string> = {
  GAME_NOT_FOUND: "No game found for that code",
  GAME_STARTED: "This game has already started",
  GAME_FULL: "This game is full",
};

const PURCHASE_MESSAGES: Record<string, string> = {
  GAME_NOT_FOUND: "No game found for that code",
  GAME_NOT_ACTIVE: "The game is not active",
  PLAYER_NOT_FOUND: "Player not found in this game",
  INVALID_ITEM: "One or more items are invalid",
};

const CHARACTER_MESSAGES: Record<string, string> = {
  GAME_NOT_FOUND: "No game found for that code",
  GAME_STARTED: "The game has already started",
  PLAYER_NOT_FOUND: "Player not found in this game",
  HOST_CANNOT_PICK: "The host doesn't pick a chef",
  INVALID_CHARACTER: "That chef doesn't exist",
  CHARACTER_TAKEN: "Someone already picked that chef",
};

const CONSUME_MESSAGES: Record<string, string> = {
  ...PURCHASE_MESSAGES,
  INSUFFICIENT_INVENTORY: "You do not have enough ingredients for this step",
};
const END_MESSAGES: Record<string, string> = {
  GAME_NOT_FOUND: "No game found for that code",
  GAME_NOT_ACTIVE: "The game is not active",
};

const FINISH_MESSAGES: Record<string, string> = {
  GAME_NOT_FOUND: "No game found for that code",
  GAME_NOT_ACTIVE: "The game is not active",
  PLAYER_NOT_FOUND: "Player not found in this game",
  ALREADY_FINISHED: "This player has already finished all recipes",
};

const EXPIRE_MESSAGES: Record<string, string> = {
  GAME_NOT_FOUND: "No game found for that code",
  GAME_NOT_ACTIVE: "The game is not active",
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
      status: result.game.status,
      player: toPlayerSummary(result.player),
      reconnectToken: result.player.reconnectToken,
      players: result.game.state.players.map(toPlayerSummary),
      state: toClientGameState(result.game.state),
    };
  }

  async start(input: StartInput, durationMs?: number): Promise<StartResult> {
    if (!input.isHost) {
      return {
        ok: false,
        code: "NOT_HOST",
        message: "Only the host can start the game",
      };
    }

    const result = await this.#gameService.startGame(input.code, {
      durationMs,
    });

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

  async purchase(input: PurchaseInput): Promise<PurchaseResult> {
    const result = await this.#gameService.addItemsToInventory(
      input.code,
      input.playerId,
      input.items,
    );

    if (!result.ok) {
      return {
        ok: false,
        code: result.code,
        message:
          PURCHASE_MESSAGES[result.code] ?? "Unable to purchase these items",
      };
    }

    return {
      ok: true,
      gameCode: result.game.code,
      state: toClientGameState(result.game.state),
    };
  }

  async selectCharacter(
    input: SelectCharacterInput,
  ): Promise<SelectCharacterResult> {
    const result = await this.#gameService.selectCharacter(
      input.code,
      input.playerId,
      input.character,
    );

    if (!result.ok) {
      return {
        ok: false,
        code: result.code,
        message: CHARACTER_MESSAGES[result.code] ?? "Unable to pick that chef",
      };
    }

    return { ok: true, player: toPlayerSummary(result.player) };
  }

  async updateInterfaceState(input: {
    code: string;
    playerId: string;
    interfaceState: unknown;
  }): Promise<PurchaseResult> {
    const result = await this.#gameService.updateInterfaceState(
      input.code,
      input.playerId,
      input.interfaceState,
    );
    if (!result.ok) {
      return {
        ok: false,
        code: result.code,
        message: PURCHASE_MESSAGES[result.code] ?? "Invalid interface state",
      };
    }
    return {
      ok: true,
      gameCode: result.game.code,
      state: toClientGameState(result.game.state),
    };
  }

  async updateCart(input: UpdateCartInput): Promise<UpdateCartResult> {
    const result = await this.#gameService.updateCart(
      input.code,
      input.playerId,
      input.items,
    );

    if (!result.ok) {
      return {
        ok: false,
        code: result.code,
        message: PURCHASE_MESSAGES[result.code] ?? "Unable to update the cart",
      };
    }

    return {
      ok: true,
      gameCode: result.game.code,
      state: toClientGameState(result.game.state),
    };
  }

  async consumeIngredients(
    input: ConsumeIngredientsInput,
  ): Promise<ConsumeIngredientsResult> {
    const result = await this.#gameService.consumeItemsFromInventory(
      input.code,
      input.playerId,
      input.items,
    );

    if (!result.ok) {
      return {
        ok: false,
        code: result.code,
        message: END_MESSAGES[result.code] ?? "Unable to end the round",
      };
    }

    return {
      ok: true,
      gameCode: result.game.code,
      state: toClientGameState(result.game.state),
    };
  }

  async finishStage(input: FinishStageInput): Promise<FinishStageResult> {
    const result = await this.#gameService.finishStage(
      input.code,
      input.playerId,
    );

    if (!result.ok) {
      return {
        ok: false,
        code: result.code,
        message: FINISH_MESSAGES[result.code] ?? "Unable to finish the stage",
      };
    }

    return {
      ok: true,
      gameCode: result.game.code,
      state: toClientGameState(result.game.state),
    };
  }

  async expireStages(input: ExpireStagesInput): Promise<ExpireStagesResult> {
    const result = await this.#gameService.expireStages(input.code);

    if (!result.ok) {
      return {
        ok: false,
        code: result.code,
        message: EXPIRE_MESSAGES[result.code] ?? "Unable to expire stages",
      };
    }

    return {
      ok: true,
      gameCode: result.game.code,
      state: toClientGameState(result.game.state),
      changed: result.changed,
    };
  }

  async endRound(input: EndRoundInput): Promise<EndRoundResult> {
    const result = await this.#gameService.endRound(input.code);

    if (!result.ok) {
      return {
        ok: false,
        code: result.code,
        message:
          CONSUME_MESSAGES[result.code] ?? "Unable to consume ingredients",
      };
    }

    const results: PlayerResult[] = [...result.game.state.players]
      .sort((a, b) => b.score - a.score)
      .map((player) => ({
        playerId: player.id,
        name: player.name,
        score: player.score,
      }));

    return {
      ok: true,
      gameCode: result.game.code,
      state: toClientGameState(result.game.state),
      results,
    };
  }
}

function toClientGameState(state: GameState): ClientGameState {
  return {
    recipeOrder: state.recipeOrder,
    players: state.players.map(toPlayerSummary),
    roundStartedAt: state.roundStartedAt,
    roundEndsAt: state.roundEndsAt,
  };
}
