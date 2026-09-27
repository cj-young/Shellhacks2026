import assert from "node:assert/strict";
import { test } from "node:test";
import { GameService } from "./game-service.ts";
import { InMemoryGameStore } from "../infrastructure/in-memory-game-store.ts";
import type { Game } from "../domain/game.ts";

async function fixture() {
  const store = new InMemoryGameStore();
  const service = new GameService(store);
  const created = await service.createGame();
  const host = await service.joinPlayer(created.code, {
    name: "Host",
    hostToken: created.hostToken,
  });
  const source = await service.joinPlayer(created.code, { name: "Ada" });
  const target = await service.joinPlayer(created.code, { name: "Jun" });
  assert.ok(host.ok && source.ok && target.ok);
  const started = await service.startGame(created.code);
  assert.ok(started.ok);
  const game: Game = {
    ...started.game,
    state: {
      ...started.game.state,
      recipeOrder: Array.from({ length: 4 }, () => ({
        name: "Test",
        ingredients: [],
        stages: [
          { type: "lines" as const, lines: [], ingredientsConsumed: {} },
          { type: "lines" as const, lines: [], ingredientsConsumed: {} },
        ],
      })),
    },
  };
  await store.save(game);
  return {
    store,
    service,
    code: game.code,
    source: source.player.id,
    target: target.player.id,
    host: host.player.id,
    targetToken: target.player.reconnectToken,
  };
}
async function earn(f: Awaited<ReturnType<typeof fixture>>, id = f.source) {
  assert.ok((await f.service.finishStage(f.code, id)).ok);
  assert.ok((await f.service.finishStage(f.code, id)).ok);
}

test("only completing a recipe grants a choice credit; any definition can spend it once", async () => {
  const f = await fixture();
  await f.service.finishStage(f.code, f.source);
  let game = await f.service.getGame(f.code);
  assert.equal(
    game?.state.players.find((p) => p.id === f.source)?.sabotages.length,
    0,
  );
  await f.service.finishStage(f.code, f.source);
  game = await f.service.getGame(f.code);
  const credit = game?.state.players.find((p) => p.id === f.source)
    ?.sabotages[0];
  assert.ok(credit);
  assert.equal(credit.definitionId, null);
  assert.equal(credit.usedAt, null);
  const used = await f.service.useSabotage(f.code, f.source, {
    definitionId: "blackout",
  });
  assert.ok(used.ok);
  assert.equal(used.application.id, credit.id);
  assert.equal(used.application.targetPlayerId, null);
  assert.equal(used.application.ingredientId, null);
  assert.equal(used.application.expiresAt! - used.application.appliedAt, 15000);
  assert.deepEqual(
    await f.service.useSabotage(f.code, f.source, {
      definitionId: "freeze",
      targetPlayerId: f.target,
    }),
    { ok: false, code: "SABOTAGE_ALREADY_USED" },
  );
  await earn(f);
  assert.ok(
    (
      await f.service.useSabotage(f.code, f.source, {
        definitionId: "freeze",
        targetPlayerId: f.target,
      })
    ).ok,
  );
});

for (const definitionId of ["steal", "trash"]) {
  test(`${definitionId} removes exactly one unused inventory item, not cart or consumed items`, async () => {
    const f = await fixture();
    await earn(f);
    await f.service.addItemsToInventory(f.code, f.target, [
      { id: 0, count: 2 },
    ]);
    await f.service.consumeItemsFromInventory(f.code, f.target, [
      { id: 0, count: 1 },
    ]);
    await f.service.updateCart(f.code, f.target, [{ id: 1, count: 2 }]);
    const result = await f.service.useSabotage(f.code, f.source, {
      definitionId,
      targetPlayerId: f.target,
    });
    assert.ok(result.ok);
    assert.equal(result.application.ingredientId, 0);
    assert.equal(result.application.expiresAt, null);
    assert.deepEqual(
      result.game.state.players.find((p) => p.id === f.target)?.inventory,
      {},
    );
    assert.deepEqual(
      result.game.state.players.find((p) => p.id === f.target)?.cart,
      { 1: 2 },
    );
    assert.deepEqual(
      result.game.state.players.find((p) => p.id === f.source)?.inventory,
      definitionId === "steal" ? { 0: 1 } : {},
    );
    assert.equal(result.game.state.activeSabotages.length, 0);
  });
}

test("malformed payloads and invalid targets preserve the credit and inventories", async () => {
  const f = await fixture();
  await earn(f);
  for (const payload of [
    null,
    undefined,
    [],
    {},
    "freeze",
    { definitionId: 12 },
    { definitionId: "missing" },
  ]) {
    assert.deepEqual(await f.service.useSabotage(f.code, f.source, payload), {
      ok: false,
      code: "SABOTAGE_NOT_FOUND",
    });
  }
  for (const targetPlayerId of [
    undefined,
    null,
    3,
    f.source,
    f.host,
    "another-room-player",
  ]) {
    assert.deepEqual(
      await f.service.useSabotage(f.code, f.source, {
        definitionId: "freeze",
        targetPlayerId,
      }),
      { ok: false, code: "INVALID_TARGET" },
    );
  }
  assert.deepEqual(
    await f.service.useSabotage(f.code, f.source, {
      definitionId: "steal",
      targetPlayerId: f.target,
    }),
    { ok: false, code: "INVALID_TARGET" },
  );
  await f.service.markDisconnected(f.code, f.target);
  assert.deepEqual(
    await f.service.useSabotage(f.code, f.source, {
      definitionId: "freeze",
      targetPlayerId: f.target,
    }),
    { ok: false, code: "INVALID_TARGET" },
  );
  const game = await f.service.getGame(f.code);
  assert.equal(
    game?.state.players
      .find((p) => p.id === f.source)
      ?.sabotages.filter((s) => s.usedAt === null).length,
    1,
  );
  assert.deepEqual(
    game?.state.players.find((p) => p.id === f.target)?.inventory,
    {},
  );
});

test("freeze blocks every gameplay mutation and sabotage, survives reconnect, and expires by server time", async (t) => {
  const f = await fixture();
  await earn(f);
  await earn(f, f.target);
  await f.service.addItemsToInventory(f.code, f.target, [{ id: 0, count: 2 }]);
  const result = await f.service.useSabotage(f.code, f.source, {
    definitionId: "freeze",
    targetPlayerId: f.target,
  });
  assert.ok(result.ok);
  const blocked = { ok: false, code: "PLAYER_FROZEN" };
  assert.deepEqual(
    await f.service.addItemsToInventory(f.code, f.target, [
      { id: 0, count: 1 },
    ]),
    blocked,
  );
  assert.deepEqual(await f.service.updateCart(f.code, f.target, []), blocked);
  assert.deepEqual(
    await f.service.updateInterfaceState(f.code, f.target, "recipe"),
    blocked,
  );
  assert.deepEqual(
    await f.service.consumeItemsFromInventory(f.code, f.target, [
      { id: 0, count: 1 },
    ]),
    blocked,
  );
  assert.deepEqual(await f.service.finishStage(f.code, f.target), blocked);
  assert.deepEqual(
    await f.service.useSabotage(f.code, f.target, { definitionId: "blackout" }),
    blocked,
  );
  await f.service.markDisconnected(f.code, f.target);
  await f.service.joinPlayer(f.code, { reconnectToken: f.targetToken });
  assert.deepEqual(await f.service.finishStage(f.code, f.target), blocked);
  t.mock.method(Date, "now", () => result.application.expiresAt!);
  assert.ok((await f.service.finishStage(f.code, f.target)).ok);
  assert.ok(
    (
      await f.service.useSabotage(f.code, f.target, {
        definitionId: "blackout",
      })
    ).ok,
  );
});

test("overlapping freeze applications expire independently", async (t) => {
  const f = await fixture();
  await earn(f);
  await earn(f);
  const first = await f.service.useSabotage(f.code, f.source, {
    definitionId: "freeze",
    targetPlayerId: f.target,
  });
  assert.ok(first.ok);
  let now = first.application.appliedAt + 5000;
  t.mock.method(Date, "now", () => now);
  const second = await f.service.useSabotage(f.code, f.source, {
    definitionId: "freeze",
    targetPlayerId: f.target,
  });
  assert.ok(second.ok);
  now = first.application.expiresAt!;
  assert.deepEqual(await f.service.finishStage(f.code, f.target), {
    ok: false,
    code: "PLAYER_FROZEN",
  });
  now = second.application.expiresAt!;
  assert.ok((await f.service.finishStage(f.code, f.target)).ok);
});

test("blackout does not block shopping; finished rounds clear effects and reject use", async () => {
  const f = await fixture();
  await earn(f);
  assert.ok(
    (
      await f.service.useSabotage(f.code, f.source, {
        definitionId: "blackout",
        targetPlayerId: "ignored",
      })
    ).ok,
  );
  assert.ok(
    (
      await f.service.addItemsToInventory(f.code, f.source, [
        { id: 0, count: 1 },
      ])
    ).ok,
  );
  const ended = await f.service.endRound(f.code);
  assert.ok(ended.ok);
  assert.deepEqual(ended.game.state.activeSabotages, []);
  assert.deepEqual(
    await f.service.useSabotage(f.code, f.source, { definitionId: "blackout" }),
    { ok: false, code: "GAME_NOT_ACTIVE" },
  );
});

test("hosts, absent players, lobbies, and expired rounds cannot use sabotage", async (t) => {
  const f = await fixture();
  for (const playerId of [f.host, "missing"])
    assert.deepEqual(
      await f.service.useSabotage(f.code, playerId, {
        definitionId: "blackout",
      }),
      { ok: false, code: "PLAYER_NOT_FOUND" },
    );
  const lobby = await f.service.createGame();
  assert.deepEqual(
    await f.service.useSabotage(lobby.code, f.source, {
      definitionId: "blackout",
    }),
    { ok: false, code: "GAME_NOT_ACTIVE" },
  );
  assert.deepEqual(await f.service.useSabotage("missing", f.source, {}), {
    ok: false,
    code: "GAME_NOT_FOUND",
  });
  await earn(f);
  const game = await f.service.getGame(f.code);
  t.mock.method(Date, "now", () => game!.state.roundEndsAt!);
  assert.deepEqual(
    await f.service.useSabotage(f.code, f.source, { definitionId: "blackout" }),
    { ok: false, code: "GAME_NOT_ACTIVE" },
  );
});

test("credits accumulate through the final recipe and cannot be earned again after finishing", async () => {
  const f = await fixture();
  for (let i = 0; i < 4; i++) await earn(f);
  assert.deepEqual(await f.service.finishStage(f.code, f.source), {
    ok: false,
    code: "ALREADY_FINISHED",
  });
  for (let i = 0; i < 4; i++)
    assert.ok(
      (
        await f.service.useSabotage(f.code, f.source, {
          definitionId: "blackout",
        })
      ).ok,
    );
  assert.deepEqual(
    await f.service.useSabotage(f.code, f.source, { definitionId: "blackout" }),
    { ok: false, code: "SABOTAGE_ALREADY_USED" },
  );
});
