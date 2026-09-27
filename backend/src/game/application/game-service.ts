import { randomUUID } from "node:crypto";

import {
  getSabotageDefinition,
  generateRecipeOrder,
  getRandomIntInclusive,
  isKnownIngredientId,
} from "../../util.ts";
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
import {
  CHARACTERS,
  isCharacterId,
  normalizePlayerName,
  type CharacterId,
  type Player,
} from "../domain/player.ts";
import type { SabotageApplication } from "../domain/sabotage.ts";
import type { Recipe } from "../domain/recipe.ts";
import type { GameStore } from "../ports/game-store.ts";

const MAX_CODE_ATTEMPTS = 5;
/** Recipes dealt to each game; more than most players will finish in time. */
const RECIPES_PER_GAME = 5;
/** Sabotages a finished recipe can award (the ones with artwork). */
export const AWARDED_SABOTAGES = ["trash", "freeze", "blackout"];
export const MAX_PLAYERS = 5;
export const MAX_ITEM_COUNT = 99;
export const POINTS_PER_RECIPE = 100;
export const WASTE_PENALTY_PER_ITEM = 10;

export type StartGameResult =
  | { ok: true; game: Game }
  | { ok: false; code: "GAME_NOT_FOUND" | "ALREADY_STARTED" };

export type SelectCharacterResult =
  | { ok: true; game: Game; player: Player }
  | {
      ok: false;
      code:
        | "GAME_NOT_FOUND"
        | "GAME_STARTED"
        | "PLAYER_NOT_FOUND"
        | "HOST_CANNOT_PICK"
        | "INVALID_CHARACTER"
        | "CHARACTER_TAKEN";
    };

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
        | "PLAYER_FROZEN"
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
        | "PLAYER_FROZEN"
        | "INVALID_ITEM"
        | "INSUFFICIENT_INVENTORY";
    };

export type UpdateCartResult =
  | { ok: true; game: Game }
  | {
      ok: false;
      code:
        | "GAME_NOT_FOUND"
        | "GAME_NOT_ACTIVE"
        | "PLAYER_NOT_FOUND"
        | "PLAYER_FROZEN"
        | "INVALID_ITEM";
    };

export type UpdateInterfaceStateResult =
  | { ok: true; game: Game }
  | {
      ok: false;
      code:
        | "GAME_NOT_FOUND"
        | "GAME_NOT_ACTIVE"
        | "PLAYER_NOT_FOUND"
        | "PLAYER_FROZEN"
        | "INVALID_INTERFACE_STATE";
    };

export type FinishStageResult =
  | { ok: true; game: Game }
  | {
      ok: false;
      code:
        | "GAME_NOT_FOUND"
        | "GAME_NOT_ACTIVE"
        | "PLAYER_NOT_FOUND"
        | "PLAYER_FROZEN"
        | "ALREADY_FINISHED";
    };

export type ExpireStagesResult =
  | { ok: true; game: Game; changed: boolean }
  | { ok: false; code: "GAME_NOT_FOUND" | "GAME_NOT_ACTIVE" };

export type UseSabotageResult =
  | { ok: true; game: Game; application: SabotageApplication }
  | {
      ok: false;
      code:
        | "GAME_NOT_FOUND"
        | "GAME_NOT_ACTIVE"
        | "PLAYER_NOT_FOUND"
        | "PLAYER_FROZEN"
        | "SABOTAGE_NOT_FOUND"
        | "SABOTAGE_ALREADY_USED"
        | "SABOTAGE_NOT_HELD"
        | "INVALID_TARGET";
    };

export class GameService {
  readonly #store: GameStore;

  /**
   * Picks which sabotage a finished recipe awards. Random from the ones with
   * artwork by default; tests replace it to get a known sabotage. null gives an
   * untyped credit that can be spent on any sabotage.
   */
  pickSabotage: () => string | null = () =>
    AWARDED_SABOTAGES[getRandomIntInclusive(0, AWARDED_SABOTAGES.length - 1)];

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
      character: null,

      interfaceState: "store",
      recipeIndex: 0,
      recipeStageIndex: 0,
      cart: {},
      inventory: {},
      score: 0,
      stageDeadlineAt: null,
      sabotages: [],
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

    const order = generateRecipeOrder(RECIPES_PER_GAME);
    const durationMs = options.durationMs ?? ROUND_DURATION_MS;
    const roundStartedAt = Date.now();
    const players = assignMissingCharacters(game.state.players).map(
      (player) => ({
        ...player,
        stageDeadlineAt: stageDeadlineFor(player, order, roundStartedAt),
      }),
    );

    const started: Game = {
      ...game,
      status: "active",
      state: {
        ...game.state,
        recipeOrder: order,
        roundStartedAt,
        roundEndsAt: roundStartedAt + durationMs,
        players,
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

    const finished: Game = {
      ...game,
      status: "finished",
      state: { ...game.state, activeSabotages: [] },
    };
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

    if (isFrozen(game, playerId)) return { ok: false, code: "PLAYER_FROZEN" };

    if (items.length === 0 || !items.every(isValidPurchaseItem)) {
      return { ok: false, code: "INVALID_ITEM" };
    }

    const inventory: Inventory = { ...player.inventory };
    for (const item of items) {
      inventory[item.id] = (inventory[item.id] ?? 0) + item.count;
    }

    const merged: Player = { ...player, inventory };
    const updated: Player = {
      ...merged,
      cart: {},
      stageDeadlineAt: isMissingForStage(merged, game.state.recipeOrder)
        ? player.stageDeadlineAt
        : null,
    };
    const next = this.#withPlayers(
      game,
      game.state.players.map((entry) =>
        entry.id === updated.id ? updated : entry,
      ),
    );
    await this.#store.save(next);

    return { ok: true, game: next };
  }

  /** Claims a chef character for a player in the lobby; switching frees their old one. */
  async selectCharacter(
    code: string,
    playerId: string,
    character: unknown,
  ): Promise<SelectCharacterResult> {
    const game = await this.#store.get(normalizeGameCode(code));

    if (!game) return { ok: false, code: "GAME_NOT_FOUND" };
    if (game.status !== "lobby") return { ok: false, code: "GAME_STARTED" };

    const player = game.state.players.find((entry) => entry.id === playerId);
    if (!player) return { ok: false, code: "PLAYER_NOT_FOUND" };
    if (player.isHost) return { ok: false, code: "HOST_CANNOT_PICK" };
    if (!isCharacterId(character)) {
      return { ok: false, code: "INVALID_CHARACTER" };
    }

    const takenByOther = game.state.players.some(
      (entry) => entry.id !== playerId && entry.character === character,
    );
    if (takenByOther) return { ok: false, code: "CHARACTER_TAKEN" };

    const updated: Player = { ...player, character };
    const next = this.#withPlayers(
      game,
      game.state.players.map((entry) =>
        entry.id === updated.id ? updated : entry,
      ),
    );
    await this.#store.save(next);

    return { ok: true, game: next, player: updated };
  }

  async updateInterfaceState(
    code: string,
    playerId: string,
    interfaceState: unknown,
  ): Promise<UpdateInterfaceStateResult> {
    const game = await this.#store.get(normalizeGameCode(code));
    if (!game) return { ok: false, code: "GAME_NOT_FOUND" };
    if (game.status !== "active") return { ok: false, code: "GAME_NOT_ACTIVE" };
    if (!game.state.players.some((player) => player.id === playerId)) {
      return { ok: false, code: "PLAYER_NOT_FOUND" };
    }
    if (isFrozen(game, playerId)) return { ok: false, code: "PLAYER_FROZEN" };

    if (interfaceState !== "store" && interfaceState !== "recipe") {
      return { ok: false, code: "INVALID_INTERFACE_STATE" };
    }
    const next = this.#withPlayers(
      game,
      game.state.players.map((player) =>
        player.id === playerId ? { ...player, interfaceState } : player,
      ),
    );
    await this.#store.save(next);
    return { ok: true, game: next };
  }

  async updateCart(
    code: string,
    playerId: string,
    items: PurchaseItem[],
  ): Promise<UpdateCartResult> {
    const game = await this.#store.get(normalizeGameCode(code));

    if (!game) return { ok: false, code: "GAME_NOT_FOUND" };
    if (game.status !== "active") {
      return { ok: false, code: "GAME_NOT_ACTIVE" };
    }

    const player = game.state.players.find((entry) => entry.id === playerId);
    if (!player) return { ok: false, code: "PLAYER_NOT_FOUND" };
    if (isFrozen(game, playerId)) return { ok: false, code: "PLAYER_FROZEN" };

    if (!items.every(isValidPurchaseItem)) {
      return { ok: false, code: "INVALID_ITEM" };
    }

    const cart: Inventory = {};
    for (const item of items) {
      cart[item.id] = (cart[item.id] ?? 0) + item.count;
    }

    const updated: Player = { ...player, cart };
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
    if (isFrozen(game, playerId)) return { ok: false, code: "PLAYER_FROZEN" };

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

    const updated: Player = { ...player, inventory, stageDeadlineAt: null };
    const next = this.#withPlayers(
      game,
      game.state.players.map((entry) =>
        entry.id === updated.id ? updated : entry,
      ),
    );
    await this.#store.save(next);
    return { ok: true, game: next };
  }

  async finishStage(
    code: string,
    playerId: string,
  ): Promise<FinishStageResult> {
    const game = await this.#store.get(normalizeGameCode(code));
    if (!game) return { ok: false, code: "GAME_NOT_FOUND" };
    if (game.status !== "active") return { ok: false, code: "GAME_NOT_ACTIVE" };

    const player = game.state.players.find((entry) => entry.id === playerId);
    if (!player) return { ok: false, code: "PLAYER_NOT_FOUND" };

    if (isFrozen(game, playerId)) return { ok: false, code: "PLAYER_FROZEN" };

    const recipe = game.state.recipeOrder[player.recipeIndex];
    if (!recipe) return { ok: false, code: "ALREADY_FINISHED" };

    const isLastStage = player.recipeStageIndex + 1 >= recipe.stages.length;
    const now = Date.now();

    const progressed: Player = isLastStage
      ? {
          ...player,
          score:
            player.score +
            POINTS_PER_RECIPE -
            countInventory(player.inventory) * WASTE_PENALTY_PER_ITEM,
          sabotages: player.isHost
            ? player.sabotages
            : [
                ...player.sabotages,
                {
                  id: randomUUID(),
                  definitionId: this.pickSabotage(),
                  acquiredAt: now,
                  usedAt: null,
                },
              ],
          recipeIndex: player.recipeIndex + 1,
          recipeStageIndex: 0,
          inventory: {},
        }
      : { ...player, recipeStageIndex: player.recipeStageIndex + 1 };

    const updated: Player = {
      ...progressed,
      stageDeadlineAt: stageDeadlineFor(
        progressed,
        game.state.recipeOrder,
        now,
      ),
    };

    const next = this.#withPlayers(
      game,
      game.state.players.map((entry) =>
        entry.id === updated.id ? updated : entry,
      ),
    );
    await this.#store.save(next);

    return { ok: true, game: next };
  }

  /** Spend an earned choice credit only after the entire action is validated. */
  async useSabotage(
    code: string,
    playerId: string,
    payload: unknown,
  ): Promise<UseSabotageResult> {
    const game = await this.#store.get(normalizeGameCode(code));
    if (!game) return { ok: false, code: "GAME_NOT_FOUND" };
    const now = Date.now();
    if (
      game.status !== "active" ||
      (game.state.roundEndsAt !== null && game.state.roundEndsAt <= now)
    )
      return { ok: false, code: "GAME_NOT_ACTIVE" };
    const source = game.state.players.find((player) => player.id === playerId);
    if (!source || source.isHost || !source.connected)
      return { ok: false, code: "PLAYER_NOT_FOUND" };
    if (isFrozen(game, playerId, now))
      return { ok: false, code: "PLAYER_FROZEN" };
    const input =
      typeof payload === "object" && payload !== null
        ? (payload as Record<string, unknown>)
        : {};
    const definition =
      typeof input.definitionId === "string"
        ? getSabotageDefinition(input.definitionId)
        : undefined;
    if (!definition) return { ok: false, code: "SABOTAGE_NOT_FOUND" };
    const unused = source.sabotages.filter((entry) => entry.usedAt === null);
    if (!unused.length) return { ok: false, code: "SABOTAGE_ALREADY_USED" };
    // Each award is one specific sabotage (older untyped credits allow any).
    const credit =
      unused.find((entry) => entry.definitionId === definition.id) ??
      unused.find((entry) => entry.definitionId === null);
    if (!credit) return { ok: false, code: "SABOTAGE_NOT_HELD" };
    const target =
      definition.targetScope === "single"
        ? game.state.players.find(
            (player) => player.id === input.targetPlayerId,
          )
        : undefined;
    if (
      definition.targetScope === "single" &&
      (!target || target.id === source.id || target.isHost || !target.connected)
    )
      return { ok: false, code: "INVALID_TARGET" };
    let ingredientId: number | null = null;
    const sourceInventory = { ...source.inventory };
    const targetInventory = { ...target?.inventory };
    if (definition.id === "steal" || definition.id === "trash") {
      const ids = Object.keys(targetInventory)
        .map(Number)
        .filter((id) => targetInventory[id] > 0);
      if (!ids.length) return { ok: false, code: "INVALID_TARGET" };
      ingredientId = ids[getRandomIntInclusive(0, ids.length - 1)];
      targetInventory[ingredientId] -= 1;
      if (targetInventory[ingredientId] === 0)
        delete targetInventory[ingredientId];
      if (definition.id === "steal")
        sourceInventory[ingredientId] =
          (sourceInventory[ingredientId] ?? 0) + 1;
    }
    const application: SabotageApplication = {
      id: credit.id,
      definition: { ...definition },
      sourcePlayerId: source.id,
      targetPlayerId: target?.id ?? null,
      appliedAt: now,
      expiresAt:
        definition.durationMs === null ? null : now + definition.durationMs,
      ingredientId,
    };
    const players = game.state.players.map((player) => {
      if (player.id === source.id) {
        const updated = {
          ...player,
          inventory: sourceInventory,
          sabotages: player.sabotages.map((entry) =>
            entry.id === credit.id
              ? { ...entry, definitionId: definition.id, usedAt: now }
              : entry,
          ),
        };
        // Stolen ingredients can satisfy an existing missing-ingredient deadline.
        return {
          ...updated,
          stageDeadlineAt: isMissingForStage(updated, game.state.recipeOrder)
            ? updated.stageDeadlineAt
            : null,
        };
      }
      return player.id === target?.id && ingredientId !== null
        ? { ...player, inventory: targetInventory }
        : player;
    });
    const next = this.#withPlayers(game, players);
    next.state.activeSabotages = [
      ...game.state.activeSabotages.filter(
        (entry) => entry.expiresAt !== null && entry.expiresAt > now,
      ),
      ...(application.expiresAt === null ? [] : [application]),
    ];
    await this.#store.save(next);
    return { ok: true, game: next, application };
  }

  async expireStages(
    code: string,
    now: number = Date.now(),
  ): Promise<ExpireStagesResult> {
    const game = await this.#store.get(normalizeGameCode(code));
    if (!game) return { ok: false, code: "GAME_NOT_FOUND" };
    if (game.status !== "active") return { ok: false, code: "GAME_NOT_ACTIVE" };

    let changed = false;
    const players = game.state.players.map((player) => {
      if (player.stageDeadlineAt === null || player.stageDeadlineAt > now) {
        return player;
      }

      changed = true;

      // Remove the timer if the user retrieved their items
      if (!isMissingForStage(player, game.state.recipeOrder)) {
        return { ...player, stageDeadlineAt: null };
      }

      const reset: Player = {
        ...player,
        recipeStageIndex: 0,
        inventory: {},
      };
      return {
        ...reset,
        stageDeadlineAt: stageDeadlineFor(reset, game.state.recipeOrder, now),
      };
    });

    if (!changed) {
      return { ok: true, game, changed: false };
    }

    const next = this.#withPlayers(game, players);
    await this.#store.save(next);

    return { ok: true, game: next, changed: true };
  }

  #withPlayers(game: Game, players: Player[]): Game {
    return { ...game, state: { ...game.state, players } };
  }
}

/** Assigns a random unclaimed chef to every non-host player who didn't pick one. */
function assignMissingCharacters(players: Player[]): Player[] {
  const taken = new Set<CharacterId>(
    players
      .filter((player) => !player.isHost && player.character !== null)
      .map((player) => player.character as CharacterId),
  );

  return players.map((player) => {
    if (player.isHost || player.character !== null) {
      return player;
    }

    // With more players than chefs, fall back to reusing one (duplicate avatars).
    const free = CHARACTERS.filter((character) => !taken.has(character));
    const pool = free.length > 0 ? free : CHARACTERS;
    const character = pool[getRandomIntInclusive(0, pool.length - 1)];
    taken.add(character);
    return { ...player, character };
  });
}

function stageDeadlineFor(
  player: Player,
  recipeOrder: Recipe[],
  now: number,
): number | null {
  const stage =
    recipeOrder[player.recipeIndex]?.stages[player.recipeStageIndex];
  const limit = stage?.timeLimitMs;

  if (limit === undefined || limit === null) return null;
  if (!isMissingForStage(player, recipeOrder)) return null;

  return now + limit;
}

function isMissingForStage(player: Player, recipeOrder: Recipe[]): boolean {
  const stage =
    recipeOrder[player.recipeIndex]?.stages[player.recipeStageIndex];

  if (!stage) return false;

  return Object.entries(stage.ingredientsConsumed).some(
    ([id, count]) => (player.inventory[Number(id)] ?? 0) < count,
  );
}

function isValidPurchaseItem(item: PurchaseItem): boolean {
  return (
    isKnownIngredientId(item.id) &&
    Number.isInteger(item.count) &&
    item.count >= 1 &&
    item.count <= MAX_ITEM_COUNT
  );
}

function countInventory(inventory: Inventory): number {
  return Object.values(inventory).reduce((total, count) => total + count, 0);
}

function isFrozen(game: Game, playerId: string, now = Date.now()): boolean {
  return game.state.activeSabotages.some(
    (effect) =>
      effect.definition.id === "freeze" &&
      effect.targetPlayerId === playerId &&
      effect.expiresAt !== null &&
      effect.expiresAt > now,
  );
}
