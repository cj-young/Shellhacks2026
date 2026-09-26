import { strict as assert } from "node:assert";
import { test } from "node:test";

import ingredients from "../../data/ingredients.json" with { type: "json" };
import { GameService } from "../../game/application/game-service.ts";
import { InMemoryGameStore } from "../../game/infrastructure/in-memory-game-store.ts";
import { GameSession } from "./game-session.ts";

const ITEM_ID = ingredients[0].id;

function setup(): { gameService: GameService; session: GameSession } {
  const gameService = new GameService(new InMemoryGameStore());
  return { gameService, session: new GameSession(gameService) };
}

test("join rejects an unknown code", async () => {
  const { session } = setup();

  const result = await session.join({ code: "ZZZZZZ" });

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("expected the join to fail");
  }
  assert.equal(result.code, "GAME_NOT_FOUND");
});

test("join marks only the matching host token as host", async () => {
  const { gameService, session } = setup();
  const game = await gameService.createGame();

  const host = await session.join({
    code: game.code,
    hostToken: game.hostToken,
  });
  const guest = await session.join({
    code: game.code,
    hostToken: "not-the-token",
  });
  const anonymous = await session.join({ code: game.code });

  if (!host.ok || !guest.ok || !anonymous.ok) {
    assert.fail("expected all joins to succeed");
  }
  assert.equal(host.player.isHost, true);
  assert.equal(host.player.name, "Host");
  assert.equal(guest.player.isHost, false);
  assert.equal(guest.player.name, "Player");
  assert.equal(anonymous.player.isHost, false);
});

test("join normalizes the player name", async () => {
  const { gameService, session } = setup();
  const game = await gameService.createGame();

  const result = await session.join({
    code: game.code,
    name: "  Ada   Lovelace  ",
  });

  if (!result.ok) {
    assert.fail("expected the join to succeed");
  }
  assert.equal(result.player.name, "Ada Lovelace");
});

test("join caps the player name length", async () => {
  const { gameService, session } = setup();
  const game = await gameService.createGame();

  const result = await session.join({ code: game.code, name: "x".repeat(50) });

  if (!result.ok) {
    assert.fail("expected the join to succeed");
  }
  assert.equal(result.player.name.length, 20);
});

test("join normalizes the code and assigns a unique player id", async () => {
  const { gameService, session } = setup();
  const game = await gameService.createGame();

  const first = await session.join({ code: `  ${game.code.toLowerCase()}  ` });
  const second = await session.join({ code: game.code });

  if (!first.ok || !second.ok) {
    assert.fail("expected all joins to succeed");
  }
  assert.equal(first.gameCode, game.code);
  assert.notEqual(first.player.id, second.player.id);
});

test("join rejects a game that has already started", async () => {
  const { gameService, session } = setup();
  const game = await gameService.createGame();
  await gameService.startGame(game.code);

  const result = await session.join({ code: game.code });

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("expected the join to fail");
  }
  assert.equal(result.code, "GAME_STARTED");
});

test("start rejects a non-host player", async () => {
  const { gameService, session } = setup();
  const game = await gameService.createGame();

  const result = await session.start({ code: game.code, isHost: false });

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("expected start to fail");
  }
  assert.equal(result.code, "NOT_HOST");
  assert.equal((await gameService.getGame(game.code))?.status, "lobby");
});

test("start activates the game for the host", async () => {
  const { gameService, session } = setup();
  const game = await gameService.createGame();

  const result = await session.start({ code: game.code, isHost: true });

  assert.equal(result.ok, true);
  if (!result.ok) {
    assert.fail("expected start to succeed");
  }
  assert.equal(result.gameCode, game.code);
  assert.equal(result.state.recipeOrder.length, 3);
  assert.equal(typeof result.state.roundEndsAt, "number");
  assert.equal((await gameService.getGame(game.code))?.status, "active");
});

test("start returns ALREADY_STARTED when the game is active", async () => {
  const { gameService, session } = setup();
  const game = await gameService.createGame();
  await gameService.startGame(game.code);

  const result = await session.start({ code: game.code, isHost: true });

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("expected start to fail");
  }
  assert.equal(result.code, "ALREADY_STARTED");
});

test("start returns GAME_NOT_FOUND for an unknown code", async () => {
  const { session } = setup();

  const result = await session.start({ code: "ZZZZZZ", isHost: true });

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("expected start to fail");
  }
  assert.equal(result.code, "GAME_NOT_FOUND");
});

test("join returns a reconnect token and the full roster", async () => {
  const { gameService, session } = setup();
  const game = await gameService.createGame();

  const result = await session.join({ code: game.code, name: "Ada" });

  if (!result.ok) {
    assert.fail("expected the join to succeed");
  }
  assert.ok(result.reconnectToken.length > 0);
  assert.equal(result.players.length, 1);
  assert.equal(result.players[0]?.id, result.player.id);
});

test("join resumes the same player with the reconnect token, even after start", async () => {
  const { gameService, session } = setup();
  const game = await gameService.createGame();
  const first = await session.join({ code: game.code, name: "Ada" });
  if (!first.ok) {
    assert.fail("expected the join to succeed");
  }

  await gameService.startGame(game.code);

  const resumed = await session.join({
    code: game.code,
    reconnectToken: first.reconnectToken,
  });

  if (!resumed.ok) {
    assert.fail("expected the resume to succeed");
  }
  assert.equal(resumed.player.id, first.player.id);
});

test("leave marks the player disconnected without removing them", async () => {
  const { gameService, session } = setup();
  const game = await gameService.createGame();
  const joined = await session.join({ code: game.code });
  if (!joined.ok) {
    assert.fail("expected the join to succeed");
  }

  await session.leave({ code: game.code, playerId: joined.player.id });

  const stored = await gameService.getGame(game.code);
  assert.equal(stored?.state.players.length, 1);
  assert.equal(stored?.state.players[0]?.connected, false);
});

test("purchase adds items and returns the updated client state", async () => {
  const { gameService, session } = setup();
  const game = await gameService.createGame();
  const joined = await session.join({ code: game.code, name: "Ada" });
  if (!joined.ok) {
    assert.fail("expected the join to succeed");
  }
  await gameService.startGame(game.code);

  const result = await session.purchase({
    code: game.code,
    playerId: joined.player.id,
    items: [{ id: ITEM_ID, count: 2 }],
  });

  if (!result.ok) {
    assert.fail("expected the purchase to succeed");
  }
  assert.equal(result.gameCode, game.code);
  assert.equal(result.state.players[0]?.inventory[ITEM_ID], 2);
});

test("purchase rejects when the game is not active", async () => {
  const { gameService, session } = setup();
  const game = await gameService.createGame();
  const joined = await session.join({ code: game.code });
  if (!joined.ok) {
    assert.fail("expected the join to succeed");
  }

  const result = await session.purchase({
    code: game.code,
    playerId: joined.player.id,
    items: [{ id: ITEM_ID, count: 1 }],
  });

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("expected the purchase to fail");
  }
  assert.equal(result.code, "GAME_NOT_ACTIVE");
});

test("endRound returns the final rankings", async () => {
  const { gameService, session } = setup();
  const game = await gameService.createGame();
  const joined = await session.join({ code: game.code, name: "Ada" });
  if (!joined.ok) {
    assert.fail("expected the join to succeed");
  }
  await gameService.startGame(game.code);

  const result = await session.endRound({ code: game.code });

  if (!result.ok) {
    assert.fail("expected end to succeed");
  }
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0]?.name, "Ada");
  assert.equal(result.state.roundEndsAt !== null, true);
});
