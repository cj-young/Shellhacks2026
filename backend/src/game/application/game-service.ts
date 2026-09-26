import { randomUUID } from "node:crypto";

import { generateRecipeOrder, isKnownIngredientId } from "../../util.ts";
import {
  generateGameCode,
  generateHostToken,
  generateReconnectToken,
  normalizeGameCode,
} from "../domain/code.ts";
import {
  MakeEmptyState,
  ROUND_DURATION_MS,
  type Game,
} from "../domain/game.ts";
import type { Inventory, PurchaseItem } from "../domain/inventory.ts";
import { normalizePlayerName, type Player } from "../domain/player.ts";
import type { GameStore } from "../ports/game-store.ts";

const MAX_CODE_ATTEMPTS = 5;
export const MAX_PLAYERS = 5;
export const MAX_ITEM_COUNT = 99;

export type StartGameResult =
  | { ok: true; game: Game }
  | { ok: false; code: "GAME_NOT_FOUND" | "ALREADY_STARTED" };

export interface StartGameOptions {
  durationMs?: number;
}

export type EndRoundResult =
  | { ok: true; game: Game }
  | { ok: false; code: "GAME_NOT_FOUND" | "GAME_NOT_ACTIVE" };

export interface JoinPlayerInput {
  name?: string;
  hostToken?: string;
  reconnectToken?: string;
}

export type JoinPlayerResult =
  | { ok: true; game: Game; player: Player }
  | { ok: false; code: "GAME_NOT_FOUND" | "GAME_STARTED" | "GAME_FULL" };

export type AddItemsResult =
  | { ok: true; game: Game }
  | {
      ok: false;
      code:
        | "GAME_NOT_FOUND"
        | "GAME_NOT_ACTIVE"
        | "PLAYER_NOT_FOUND"
        | "INVALID_ITEM";
    };

export type ConsumeItemsResult =
  | { ok: true; game: Game }
  | {
      ok: false;
      code:
        | "GAME_NOT_FOUND"
        | "GAME_NOT_ACTIVE"
        | "PLAYER_NOT_FOUND"
        | "INVALID_ITEM"
        | "INSUFFICIENT_INVENTORY";
    };

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

      recipeIndex: 0,
      recipeStageIndex: 0,
      inventory: {},
      score: 0,
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

  async startGame(
    code: string,
    options: StartGameOptions = {},
  ): Promise<StartGameResult> {
    const game = await this.#store.get(normalizeGameCode(code));

    if (!game) {
      return { ok: false, code: "GAME_NOT_FOUND" };
    }

    if (game.status !== "lobby") {
      return { ok: false, code: "ALREADY_STARTED" };
    }

    const order = generateRecipeOrder(3);
    const durationMs = options.durationMs ?? ROUND_DURATION_MS;
    const roundStartedAt = Date.now();

    const started: Game = {
      ...game,
      status: "active",
      state: {
        ...game.state,
        recipeOrder: order,
        roundStartedAt,
        roundEndsAt: roundStartedAt + durationMs,
      },
    };
    await this.#store.save(started);

    return { ok: true, game: started };
  }

  async endRound(code: string): Promise<EndRoundResult> {
    const game = await this.#store.get(normalizeGameCode(code));

    if (!game) {
      return { ok: false, code: "GAME_NOT_FOUND" };
    }

    if (game.status !== "active") {
      return { ok: false, code: "GAME_NOT_ACTIVE" };
    }

    const finished: Game = { ...game, status: "finished" };
    await this.#store.save(finished);

    return { ok: true, game: finished };
  }

  async addItemsToInventory(
    code: string,
    playerId: string,
    items: PurchaseItem[],
  ): Promise<AddItemsResult> {
    const game = await this.#store.get(normalizeGameCode(code));

    if (!game) {
      return { ok: false, code: "GAME_NOT_FOUND" };
    }

    if (game.status !== "active") {
      return { ok: false, code: "GAME_NOT_ACTIVE" };
    }

    const player = game.state.players.find((entry) => entry.id === playerId);

    if (!player) {
      return { ok: false, code: "PLAYER_NOT_FOUND" };
    }

    if (items.length === 0 || !items.every(isValidPurchaseItem)) {
      return { ok: false, code: "INVALID_ITEM" };
    }

    const inventory: Inventory = { ...player.inventory };
    for (const item of items) {
      inventory[item.id] = (inventory[item.id] ?? 0) + item.count;
    }

    const updated: Player = { ...player, inventory };
    const next = this.#withPlayers(
      game,
      game.state.players.map((entry) =>
        entry.id === updated.id ? updated : entry,
      ),
    );
    await this.#store.save(next);

    return { ok: true, game: next };
  }

  async consumeItemsFromInventory(
    code: string,
    playerId: string,
    items: PurchaseItem[],
  ): Promise<ConsumeItemsResult> {
    const game = await this.#store.get(normalizeGameCode(code));
    if (!game) return { ok: false, code: "GAME_NOT_FOUND" };
    if (game.status !== "active") return { ok: false, code: "GAME_NOT_ACTIVE" };

    const player = game.state.players.find((entry) => entry.id === playerId);
    if (!player) return { ok: false, code: "PLAYER_NOT_FOUND" };
    if (items.length === 0 || !items.every(isValidPurchaseItem)) {
      return { ok: false, code: "INVALID_ITEM" };
    }

    const requested: Inventory = {};
    for (const item of items) {
      requested[item.id] = (requested[item.id] ?? 0) + item.count;
    }
    if (
      Object.entries(requested).some(
        ([id, count]) => (player.inventory[Number(id)] ?? 0) < count,
      )
    ) {
      return { ok: false, code: "INSUFFICIENT_INVENTORY" };
    }

    const inventory: Inventory = { ...player.inventory };
    for (const [id, count] of Object.entries(requested)) {
      const ingredientId = Number(id);
      const remaining = inventory[ingredientId] - count;
      if (remaining === 0) delete inventory[ingredientId];
      else inventory[ingredientId] = remaining;
    }

    const updated: Player = { ...player, inventory };
    const next = this.#withPlayers(
      game,
      game.state.players.map((entry) =>
        entry.id === updated.id ? updated : entry,
      ),
    );
    await this.#store.save(next);
    return { ok: true, game: next };
  }

  #withPlayers(game: Game, players: Player[]): Game {
    return { ...game, state: { ...game.state, players } };
  }
}

function isValidPurchaseItem(item: PurchaseItem): boolean {
  return (
    isKnownIngredientId(item.id) &&
    Number.isInteger(item.count) &&
    item.count >= 1 &&
    item.count <= MAX_ITEM_COUNT
  );
}
