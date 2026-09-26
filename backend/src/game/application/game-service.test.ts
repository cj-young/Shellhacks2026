import { strict as assert } from "node:assert";
import { test } from "node:test";

import ingredients from "../../data/ingredients.json" with { type: "json" };
import type { Game } from "../domain/game.ts";
import { InMemoryGameStore } from "../infrastructure/in-memory-game-store.ts";
import type { GameStore } from "../ports/game-store.ts";
import {
  GameService,
  MAX_PLAYERS,
  POINTS_PER_RECIPE,
  WASTE_PENALTY_PER_ITEM,
} from "./game-service.ts";

const ITEM_ID = ingredients[0].id;

test("createGame stores the game and getGame finds it case-insensitively", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();

  assert.equal(game.status, "lobby");
  assert.ok(game.hostToken.length > 0);
  assert.equal(
    (await service.getGame(game.code.toLowerCase()))?.code,
    game.code,
  );
  assert.equal((await service.getGame(`  ${game.code}  `))?.code, game.code);
  assert.equal(await service.getGame("MISSING"), undefined);
});

test("createGame retries when a code is already taken", async () => {
  const attempts: string[] = [];
  const store: GameStore = {
    async createIfAbsent(game: Game): Promise<boolean> {
      attempts.push(game.code);
      return attempts.length >= 3;
    },
    async get(): Promise<Game | undefined> {
      return undefined;
    },
    async save(): Promise<void> {
      return;
    },
    async delete(): Promise<boolean> {
      return false;
    },
  };

  const game = await new GameService(store).createGame();

  assert.equal(attempts.length, 3);
  assert.equal(game.code, attempts[2]);
});

test("createGame rejects after exhausting all attempts", async () => {
  const store: GameStore = {
    async createIfAbsent(): Promise<boolean> {
      return false;
    },
    async get(): Promise<Game | undefined> {
      return undefined;
    },
    async save(): Promise<void> {
      return;
    },
    async delete(): Promise<boolean> {
      return false;
    },
  };

  await assert.rejects(() => new GameService(store).createGame());
});

test("startGame moves a lobby game to active and persists it", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();

  const result = await service.startGame(game.code.toLowerCase(), {
    durationMs: 60_000,
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    assert.fail("expected start to succeed");
  }
  assert.equal(result.game.status, "active");
  assert.equal(typeof result.game.state.roundStartedAt, "number");
  assert.equal(
    (result.game.state.roundEndsAt ?? 0) -
      (result.game.state.roundStartedAt ?? 0),
    60_000,
  );
  assert.equal((await service.getGame(game.code))?.status, "active");
});

test("startGame reports GAME_NOT_FOUND for an unknown code", async () => {
  const service = new GameService(new InMemoryGameStore());

  const result = await service.startGame("ZZZZZZ");

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("expected start to fail");
  }
  assert.equal(result.code, "GAME_NOT_FOUND");
});

test("startGame reports ALREADY_STARTED for an active game", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();
  await service.startGame(game.code);

  const result = await service.startGame(game.code);

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("expected start to fail");
  }
  assert.equal(result.code, "ALREADY_STARTED");
});

test("joinPlayer creates and persists a player, resolving the host", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();

  const host = await service.joinPlayer(game.code, {
    name: "  Ada   Lovelace ",
    hostToken: game.hostToken,
  });
  const guest = await service.joinPlayer(game.code, {});

  if (!host.ok || !guest.ok) {
    assert.fail("expected both joins to succeed");
  }
  assert.equal(host.player.isHost, true);
  assert.equal(host.player.name, "Ada Lovelace");
  assert.equal(guest.player.isHost, false);
  assert.equal(guest.player.name, "Player");
  assert.ok(host.player.reconnectToken.length > 0);
  assert.notEqual(host.player.reconnectToken, guest.player.reconnectToken);
  assert.equal((await service.getGame(game.code))?.state.players.length, 2);
});

test("joinPlayer resumes a player with a matching reconnect token", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();

  const first = await service.joinPlayer(game.code, { name: "Ada" });
  if (!first.ok) {
    assert.fail("expected the join to succeed");
  }

  await service.startGame(game.code);

  const resumed = await service.joinPlayer(game.code, {
    reconnectToken: first.player.reconnectToken,
  });

  if (!resumed.ok) {
    assert.fail("expected the resume to succeed");
  }
  assert.equal(resumed.player.id, first.player.id);
  assert.equal(resumed.player.connected, true);
  assert.equal((await service.getGame(game.code))?.state.players.length, 1);
});

test("joinPlayer rejects a new player once the game is active", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();
  await service.startGame(game.code);

  const result = await service.joinPlayer(game.code, { name: "Late" });

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("expected the join to fail");
  }
  assert.equal(result.code, "GAME_STARTED");
});

test("joinPlayer rejects an unknown code", async () => {
  const service = new GameService(new InMemoryGameStore());

  const result = await service.joinPlayer("ZZZZZZ", {});

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("expected the join to fail");
  }
  assert.equal(result.code, "GAME_NOT_FOUND");
});

test("joinPlayer rejects once the game is full", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();

  for (let index = 0; index < MAX_PLAYERS; index += 1) {
    const result = await service.joinPlayer(game.code, { name: `P${index}` });
    assert.equal(result.ok, true);
  }

  const overflow = await service.joinPlayer(game.code, { name: "Extra" });

  assert.equal(overflow.ok, false);
  if (overflow.ok) {
    assert.fail("expected the join to fail");
  }
  assert.equal(overflow.code, "GAME_FULL");
});

test("markDisconnected keeps the player but marks them offline", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();
  const joined = await service.joinPlayer(game.code, { name: "Ada" });
  if (!joined.ok) {
    assert.fail("expected the join to succeed");
  }

  await service.markDisconnected(game.code, joined.player.id);

  const stored = await service.getGame(game.code);
  assert.equal(stored?.state.players.length, 1);
  assert.equal(stored?.state.players[0]?.connected, false);
});

test("addItemsToInventory merges counts into the player inventory", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();
  const joined = await service.joinPlayer(game.code, { name: "Ada" });
  if (!joined.ok) {
    assert.fail("expected the join to succeed");
  }
  await service.startGame(game.code);

  const result = await service.addItemsToInventory(
    game.code,
    joined.player.id,
    [
      { id: ITEM_ID, count: 2 },
      { id: ITEM_ID, count: 3 },
    ],
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    assert.fail("expected the purchase to succeed");
  }
  const stored = await service.getGame(game.code);
  assert.deepEqual(stored?.state.players[0]?.inventory, { [ITEM_ID]: 5 });
  assert.deepEqual(stored?.state.players[0]?.cart, {});
});

test("updateCart replaces the player's cart without changing inventory", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();
  const joined = await service.joinPlayer(game.code, { name: "Ada" });
  if (!joined.ok) {
    assert.fail("expected the join to succeed");
  }
  await service.startGame(game.code);

  const result = await service.updateCart(game.code, joined.player.id, [
    { id: ITEM_ID, count: 2 },
  ]);

  assert.equal(result.ok, true);
  const stored = await service.getGame(game.code);
  assert.deepEqual(stored?.state.players[0]?.cart, { [ITEM_ID]: 2 });
  assert.deepEqual(stored?.state.players[0]?.inventory, {});

  await service.updateCart(game.code, joined.player.id, []);
  const cleared = await service.getGame(game.code);
  assert.deepEqual(cleared?.state.players[0]?.cart, {});
});

test("consumeItemsFromInventory removes items atomically", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();
  const joined = await service.joinPlayer(game.code, { name: "Ada" });
  if (!joined.ok) {
    assert.fail("expected the join to succeed");
  }
  await service.startGame(game.code);
  await service.addItemsToInventory(game.code, joined.player.id, [
    { id: 0, count: 2 },
  ]);

  const result = await service.consumeItemsFromInventory(
    game.code,
    joined.player.id,
    [{ id: 0, count: 2 }],
  );

  assert.equal(result.ok, true);
  const stored = await service.getGame(game.code);
  assert.deepEqual(stored?.state.players[0]?.inventory, {});
});

test("consumeItemsFromInventory does not partially consume inventory", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();
  const joined = await service.joinPlayer(game.code, { name: "Ada" });
  if (!joined.ok) {
    assert.fail("expected the join to succeed");
  }
  await service.startGame(game.code);
  await service.addItemsToInventory(game.code, joined.player.id, [
    { id: 0, count: 1 },
  ]);

  const result = await service.consumeItemsFromInventory(
    game.code,
    joined.player.id,
    [{ id: 0, count: 2 }],
  );

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "INSUFFICIENT_INVENTORY");
  const stored = await service.getGame(game.code);
  assert.deepEqual(stored?.state.players[0]?.inventory, { 0: 1 });
});

test("addItemsToInventory is all-or-nothing for unknown ids", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();
  const joined = await service.joinPlayer(game.code, { name: "Ada" });
  if (!joined.ok) {
    assert.fail("expected the join to succeed");
  }
  await service.startGame(game.code);

  const result = await service.addItemsToInventory(
    game.code,
    joined.player.id,
    [
      { id: ITEM_ID, count: 1 },
      { id: 999, count: 1 },
    ],
  );

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("expected the purchase to fail");
  }
  assert.equal(result.code, "INVALID_ITEM");
  const stored = await service.getGame(game.code);
  assert.deepEqual(stored?.state.players[0]?.inventory, {});
});

test("addItemsToInventory rejects invalid counts", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();
  const joined = await service.joinPlayer(game.code, { name: "Ada" });
  if (!joined.ok) {
    assert.fail("expected the join to succeed");
  }
  await service.startGame(game.code);

  for (const count of [0, -1, 1.5, 1000]) {
    const result = await service.addItemsToInventory(
      game.code,
      joined.player.id,
      [{ id: ITEM_ID, count }],
    );
    assert.equal(result.ok, false);
    if (result.ok) {
      assert.fail("expected the purchase to fail");
    }
    assert.equal(result.code, "INVALID_ITEM");
  }
});

test("addItemsToInventory rejects an empty list", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();
  const joined = await service.joinPlayer(game.code, { name: "Ada" });
  if (!joined.ok) {
    assert.fail("expected the join to succeed");
  }
  await service.startGame(game.code);

  const result = await service.addItemsToInventory(
    game.code,
    joined.player.id,
    [],
  );

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("expected the purchase to fail");
  }
  assert.equal(result.code, "INVALID_ITEM");
});

test("addItemsToInventory rejects a lobby game", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();
  const joined = await service.joinPlayer(game.code, { name: "Ada" });
  if (!joined.ok) {
    assert.fail("expected the join to succeed");
  }

  const result = await service.addItemsToInventory(
    game.code,
    joined.player.id,
    [{ id: ITEM_ID, count: 1 }],
  );

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("expected the purchase to fail");
  }
  assert.equal(result.code, "GAME_NOT_ACTIVE");
});

test("addItemsToInventory rejects an unknown player", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();
  await service.startGame(game.code);

  const result = await service.addItemsToInventory(game.code, "nobody", [
    { id: ITEM_ID, count: 1 },
  ]);

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("expected the purchase to fail");
  }
  assert.equal(result.code, "PLAYER_NOT_FOUND");
});

test("endRound finishes an active game", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();
  await service.startGame(game.code);

  const result = await service.endRound(game.code);

  assert.equal(result.ok, true);
  if (!result.ok) {
    assert.fail("expected end to succeed");
  }
  assert.equal(result.game.status, "finished");
  assert.equal((await service.getGame(game.code))?.status, "finished");
});

test("endRound rejects a lobby game", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();

  const result = await service.endRound(game.code);

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("expected end to fail");
  }
  assert.equal(result.code, "GAME_NOT_ACTIVE");
});

test("finishStage advances the stage without scoring", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();
  const joined = await service.joinPlayer(game.code, { name: "Ada" });
  if (!joined.ok) {
    assert.fail("expected the join to succeed");
  }
  await service.startGame(game.code);

  const result = await service.finishStage(game.code, joined.player.id);

  assert.equal(result.ok, true);
  if (!result.ok) {
    assert.fail("expected finish to succeed");
  }
  const player = result.game.state.players[0];
  assert.equal(player?.recipeStageIndex, 1);
  assert.equal(player?.recipeIndex, 0);
  assert.equal(player?.score, 0);
});

test("finishStage completes a recipe and applies the waste penalty", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();
  const joined = await service.joinPlayer(game.code, { name: "Ada" });
  if (!joined.ok) {
    assert.fail("expected the join to succeed");
  }
  await service.startGame(game.code);
  await service.addItemsToInventory(game.code, joined.player.id, [
    { id: ITEM_ID, count: 2 },
  ]);

  const stored = await service.getGame(game.code);
  const totalStages = stored?.state.recipeOrder[0]?.stages.length ?? 0;
  for (let index = 0; index < totalStages; index += 1) {
    const result = await service.finishStage(game.code, joined.player.id);
    assert.equal(result.ok, true);
  }

  const player = (await service.getGame(game.code))?.state.players[0];
  assert.equal(player?.score, POINTS_PER_RECIPE - 2 * WASTE_PENALTY_PER_ITEM);
  assert.deepEqual(player?.inventory, {});
  assert.equal(player?.recipeIndex, 1);
  assert.equal(player?.recipeStageIndex, 0);
});

test("finishStage can push the score below zero", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();
  const joined = await service.joinPlayer(game.code, { name: "Ada" });
  if (!joined.ok) {
    assert.fail("expected the join to succeed");
  }
  await service.startGame(game.code);
  await service.addItemsToInventory(game.code, joined.player.id, [
    { id: ITEM_ID, count: 20 },
  ]);

  const totalStages =
    (await service.getGame(game.code))?.state.recipeOrder[0]?.stages.length ??
    0;
  for (let index = 0; index < totalStages; index += 1) {
    await service.finishStage(game.code, joined.player.id);
  }

  const player = (await service.getGame(game.code))?.state.players[0];
  assert.equal(player?.score, POINTS_PER_RECIPE - 20 * WASTE_PENALTY_PER_ITEM);
  assert.ok((player?.score ?? 0) < 0);
});

test("finishStage returns ALREADY_FINISHED once all recipes are complete", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();
  const joined = await service.joinPlayer(game.code, { name: "Ada" });
  if (!joined.ok) {
    assert.fail("expected the join to succeed");
  }
  await service.startGame(game.code);

  const order = (await service.getGame(game.code))?.state.recipeOrder ?? [];
  const totalStages = order.reduce(
    (total, recipe) => total + recipe.stages.length,
    0,
  );
  for (let index = 0; index < totalStages; index += 1) {
    const result = await service.finishStage(game.code, joined.player.id);
    assert.equal(result.ok, true);
  }

  const result = await service.finishStage(game.code, joined.player.id);

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("expected finish to fail");
  }
  assert.equal(result.code, "ALREADY_FINISHED");
});

test("finishStage rejects a lobby game", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();
  const joined = await service.joinPlayer(game.code, { name: "Ada" });
  if (!joined.ok) {
    assert.fail("expected the join to succeed");
  }

  const result = await service.finishStage(game.code, joined.player.id);

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("expected finish to fail");
  }
  assert.equal(result.code, "GAME_NOT_ACTIVE");
});

test("finishStage rejects an unknown player", async () => {
  const service = new GameService(new InMemoryGameStore());
  const game = await service.createGame();
  await service.startGame(game.code);

  const result = await service.finishStage(game.code, "nobody");

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("expected finish to fail");
  }
  assert.equal(result.code, "PLAYER_NOT_FOUND");
});
