import { randomUUID } from "node:crypto";

import { generateRecipeOrder } from "../../util.ts";
import {
  generateGameCode,
  generateHostToken,
  generateReconnectToken,
  normalizeGameCode,
} from "../domain/code.ts";
import { MakeEmptyState, type Game } from "../domain/game.ts";
import { normalizePlayerName, type Player } from "../domain/player.ts";
import type { GameStore } from "../ports/game-store.ts";

const MAX_CODE_ATTEMPTS = 5;
export const MAX_PLAYERS = 5;

export type StartGameResult =
  | { ok: true; game: Game }
  | { ok: false; code: "GAME_NOT_FOUND" | "ALREADY_STARTED" };

export interface JoinPlayerInput {
  name?: string;
  hostToken?: string;
  reconnectToken?: string;
}

export type JoinPlayerResult =
  | { ok: true; game: Game; player: Player }
  | { ok: false; code: "GAME_NOT_FOUND" | "GAME_STARTED" | "GAME_FULL" };

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
        status: "lobby",
        createdAt: Date.now(),
        state: MakeEmptyState(),
      };

      if (await this.#store.createIfAbsent(game)) {
        return game;
      }
    }

    throw new Error("Failed to allocate a unique game code");
  }

  async getGame(code: string): Promise<Game | undefined> {
    return this.#store.get(normalizeGameCode(code));
  }

  async joinPlayer(
    code: string,
    input: JoinPlayerInput,
  ): Promise<JoinPlayerResult> {
    const game = await this.#store.get(normalizeGameCode(code));

    if (!game) {
      return { ok: false, code: "GAME_NOT_FOUND" };
    }

    const existing = input.reconnectToken
      ? game.state.players.find(
          (player) => player.reconnectToken === input.reconnectToken,
        )
      : undefined;

    if (existing) {
      const resumed: Player = { ...existing, connected: true };
      const resumedGame = this.#withPlayers(
        game,
        game.state.players.map((player) =>
          player.id === resumed.id ? resumed : player,
        ),
      );
      await this.#store.save(resumedGame);
      return { ok: true, game: resumedGame, player: resumed };
    }

    if (game.status !== "lobby") {
      return { ok: false, code: "GAME_STARTED" };
    }

    if (game.state.players.length >= MAX_PLAYERS) {
      return { ok: false, code: "GAME_FULL" };
    }

    const isHost =
      input.hostToken !== undefined && input.hostToken === game.hostToken;
    const name =
      normalizePlayerName(input.name) || (isHost ? "Host" : "Player");
    const player: Player = {
      id: randomUUID(),
      name,
      isHost,
      reconnectToken: generateReconnectToken(),
      joinedAt: Date.now(),
      connected: true,
    };

    const joinedGame = this.#withPlayers(game, [...game.state.players, player]);
    await this.#store.save(joinedGame);

    return { ok: true, game: joinedGame, player };
  }

  async markDisconnected(code: string, playerId: string): Promise<void> {
    const game = await this.#store.get(normalizeGameCode(code));

    if (!game) {
      return;
    }

    const players = game.state.players.map((player) =>
      player.id === playerId ? { ...player, connected: false } : player,
    );
    await this.#store.save(this.#withPlayers(game, players));
  }

  async startGame(code: string): Promise<StartGameResult> {
    const game = await this.#store.get(normalizeGameCode(code));

    if (!game) {
      return { ok: false, code: "GAME_NOT_FOUND" };
    }

    if (game.status !== "lobby") {
      return { ok: false, code: "ALREADY_STARTED" };
    }

    const order = generateRecipeOrder(3);

    const started: Game = {
      ...game,
      status: "active",
      state: { ...game.state, recipeOrder: order },
    };
    await this.#store.save(started);

    return { ok: true, game: started };
  }

  #withPlayers(game: Game, players: Player[]): Game {
    return { ...game, state: { ...game.state, players } };
  }
}
