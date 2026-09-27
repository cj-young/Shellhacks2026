import type {
  ClientGameState,
  SabotageAppliedPayload,
} from "./realtime/domain/protocol.ts";
import { strict as assert } from "node:assert";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";

import { io, type Socket } from "socket.io-client";

import ingredients from "./data/ingredients.json" with { type: "json" };
import { createApp } from "./app.ts";
import {
  createGameModule,
  POINTS_PER_RECIPE,
  WASTE_PENALTY_PER_ITEM,
  type GameModule,
} from "./game/index.ts";
import { createRealtimeModule, type RealtimeModule } from "./realtime/index.ts";

const ITEM_ID = ingredients[0].id;

interface JoinedPayload {
  playerId: string;
  gameCode: string;
  isHost: boolean;
  reconnectToken: string;
  players: Array<{ id: string; name: string; connected: boolean }>;
}

interface PlayerJoinedPayload {
  id: string;
  name: string;
  connected: boolean;
}

interface PlayerDisconnectedPayload {
  playerId: string;
}

interface GameErrorPayload {
  code: string;
  message: string;
}

interface GameStartedPayload {
  gameCode: string;
}

interface GameStatePayload {
  recipeOrder: unknown[];
  players: Array<{
    id: string;
    name: string;
    cart: Record<string, number>;
    inventory: Record<string, number>;
    interfaceState: "store" | "recipe";
    recipeIndex: number;
    recipeStageIndex: number;
    score: number;
    stageDeadlineAt: number | null;
  }>;
}

interface TimerSyncPayload {
  roundEndsAt: number;
  serverNow: number;
}

interface GameEndedPayload {
  results: Array<{ playerId: string; name: string; score: number }>;
}

function connectClient(
  base: string,
  auth: Record<string, string>,
  origin?: string,
): Socket {
  return io(base, {
    path: "/socket.io/",
    transports: ["websocket"],
    autoConnect: false,
    reconnection: false,
    forceNew: true,
    auth,
    ...(origin ? { extraHeaders: { Origin: origin } } : {}),
  });
}

function waitFor<T>(
  socket: Socket,
  event: string,
  timeoutMs = 3000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, onEvent);
      reject(new Error(`timeout waiting for "${event}"`));
    }, timeoutMs);

    function onEvent(payload: T): void {
      clearTimeout(timer);
      resolve(payload);
    }

    socket.once(event, onEvent);
  });
}

let realtime: RealtimeModule;
let gameModule: GameModule;
let base: string;

interface ServerInstance {
  realtime: RealtimeModule;
  gameModule: GameModule;
  base: string;
}

async function startServer(
  options: { roundDurationMs?: number } = {},
): Promise<ServerInstance> {
  const instanceGameModule = createGameModule();
  const app = createApp({ gameRouter: instanceGameModule.router });
  const instanceServer = createServer(app);
  const instanceRealtime = createRealtimeModule({
    server: instanceServer,
    gameService: instanceGameModule.service,
    ...options,
  });

  await new Promise<void>((resolve) => {
    instanceServer.listen(0, "127.0.0.1", resolve);
  });

  const { port } = instanceServer.address() as AddressInfo;
  return {
    realtime: instanceRealtime,
    gameModule: instanceGameModule,
    base: `http://127.0.0.1:${port}`,
  };
}

before(async () => {
  const instance = await startServer();
  realtime = instance.realtime;
  gameModule = instance.gameModule;
  base = instance.base;
});

after(async () => {
  await realtime.close();
});

test("POST /games returns a code and a host token", async () => {
  const response = await fetch(`${base}/games`, { method: "POST" });

  assert.equal(response.status, 201);

  const body = (await response.json()) as Record<string, unknown>;
  assert.equal(typeof body.code, "string");
  assert.equal(typeof body.hostToken, "string");
});

test("rejects a cross-origin handshake", async () => {
  const game = await gameModule.service.createGame();
  const client = connectClient(
    base,
    { code: game.code },
    "http://evil.example",
  );

  const failure = waitFor<Error>(client, "connect_error");
  client.connect();

  const error = await failure;
  assert.ok(error instanceof Error);

  client.close();
});

test("emits game_error and disconnects for an unknown code", async () => {
  const client = connectClient(base, { code: "NOPE12" });

  const failure = waitFor<GameErrorPayload>(client, "game_error");
  const closed = waitFor<string>(client, "disconnect");
  client.connect();

  const error = await failure;
  assert.equal(error.code, "GAME_NOT_FOUND");
  await closed;

  client.close();
});

test("relays presence, keeps disconnected players, and resumes with a token", async () => {
  const game = await gameModule.service.createGame();

  const host = connectClient(base, {
    code: game.code,
    token: game.hostToken,
    name: "Hosty",
  });
  const hostJoined = waitFor<JoinedPayload>(host, "joined");
  host.connect();

  const hostPayload = await hostJoined;
  assert.equal(hostPayload.isHost, true);
  assert.equal(hostPayload.players.length, 1);
  assert.equal(hostPayload.players[0]?.name, "Hosty");
  assert.ok(hostPayload.reconnectToken.length > 0);

  const guest = connectClient(base, { code: game.code, name: "Guesty" });
  const guestJoined = waitFor<JoinedPayload>(guest, "joined");
  const hostSawGuest = waitFor<PlayerJoinedPayload>(host, "player_joined");
  guest.connect();

  const [guestPayload, presence] = await Promise.all([
    guestJoined,
    hostSawGuest,
  ]);
  assert.equal(presence.name, "Guesty");
  assert.equal(guestPayload.players.length, 2);

  const disconnected = waitFor<PlayerDisconnectedPayload>(
    host,
    "player_disconnected",
  );
  guest.disconnect();

  const gone = await disconnected;
  assert.equal(gone.playerId, guestPayload.playerId);

  const reconnected = connectClient(base, {
    code: game.code,
    name: "Guesty",
    reconnectToken: guestPayload.reconnectToken,
  });
  const reconnectedJoined = waitFor<JoinedPayload>(reconnected, "joined");
  const hostSawReconnect = waitFor<PlayerJoinedPayload>(host, "player_joined");
  reconnected.connect();

  const [resumedPayload, resumedPresence] = await Promise.all([
    reconnectedJoined,
    hostSawReconnect,
  ]);
  assert.equal(resumedPayload.playerId, guestPayload.playerId);
  assert.equal(resumedPayload.players.length, 2);
  assert.equal(resumedPresence.id, guestPayload.playerId);
  assert.equal(resumedPresence.connected, true);

  host.close();
  reconnected.close();
});

test("host starts the game, notifies everyone, and never leaks tokens", async () => {
  const game = await gameModule.service.createGame();

  const host = connectClient(base, {
    code: game.code,
    token: game.hostToken,
    name: "Hosty",
  });
  const hostJoined = waitFor<JoinedPayload>(host, "joined");
  host.connect();
  await hostJoined;

  const guest = connectClient(base, { code: game.code, name: "Guesty" });
  const guestJoined = waitFor<JoinedPayload>(guest, "joined");
  const hostSawGuest = waitFor<PlayerJoinedPayload>(host, "player_joined");
  guest.connect();
  await Promise.all([guestJoined, hostSawGuest]);

  const hostStarted = waitFor<GameStartedPayload>(host, "game_started");
  const guestStarted = waitFor<GameStartedPayload>(guest, "game_started");
  const hostState = waitFor<GameStatePayload>(host, "update_state");
  const guestState = waitFor<GameStatePayload>(guest, "update_state");
  host.emit("start_game");

  const [hostEvent, guestEvent, hostGameState, guestGameState] =
    await Promise.all([hostStarted, guestStarted, hostState, guestState]);
  assert.equal(hostEvent.gameCode, game.code);
  assert.equal(guestEvent.gameCode, game.code);
  assert.equal(hostGameState.recipeOrder.length, 3);
  assert.deepEqual(guestGameState, hostGameState);

  for (const player of hostGameState.players) {
    assert.equal("reconnectToken" in player, false);
  }

  host.close();
  guest.close();
});

test("purchases items and broadcasts the inventory to everyone", async () => {
  const game = await gameModule.service.createGame();

  const host = connectClient(base, {
    code: game.code,
    token: game.hostToken,
    name: "Hosty",
  });
  const hostJoined = waitFor<JoinedPayload>(host, "joined");
  host.connect();
  await hostJoined;

  const guest = connectClient(base, { code: game.code, name: "Guesty" });
  const guestJoined = waitFor<JoinedPayload>(guest, "joined");
  guest.connect();
  await guestJoined;

  const hostStarted = waitFor<GameStartedPayload>(host, "game_started");
  const guestStarted = waitFor<GameStartedPayload>(guest, "game_started");
  const hostStartState = waitFor<GameStatePayload>(host, "update_state");
  const guestStartState = waitFor<GameStatePayload>(guest, "update_state");
  host.emit("start_game");
  await Promise.all([
    hostStarted,
    guestStarted,
    hostStartState,
    guestStartState,
  ]);

  const hostPurchase = waitFor<GameStatePayload>(host, "update_state");
  const guestPurchase = waitFor<GameStatePayload>(guest, "update_state");
  host.emit("purchase_items", [{ id: ITEM_ID, count: 2 }]);

  const [hostView, guestView] = await Promise.all([
    hostPurchase,
    guestPurchase,
  ]);
  const hostPlayer = hostView.players.find((player) => player.name === "Hosty");
  assert.deepEqual(hostPlayer?.inventory, { [ITEM_ID]: 2 });
  assert.deepEqual(hostPlayer?.cart, {});
  assert.deepEqual(guestView, hostView);

  host.close();
  guest.close();
});

test("syncs a player's cart to the shared game state", async () => {
  const game = await gameModule.service.createGame();
  const host = connectClient(base, {
    code: game.code,
    token: game.hostToken,
    name: "Hosty",
  });
  const joined = waitFor<JoinedPayload>(host, "joined");
  host.connect();
  await joined;

  const started = waitFor<GameStartedPayload>(host, "game_started");
  const startState = waitFor<GameStatePayload>(host, "update_state");
  host.emit("start_game");
  await Promise.all([started, startState]);

  const cartUpdated = waitFor<GameStatePayload>(host, "update_state");
  host.emit("update_cart", [{ id: ITEM_ID, count: 2 }]);
  const state = await cartUpdated;
  const player = state.players.find((entry) => entry.name === "Hosty");
  assert.deepEqual(player?.cart, { [ITEM_ID]: 2 });
  assert.deepEqual(player?.inventory, {});

  host.close();
});

test("consumes ingredients and broadcasts the updated inventory", async () => {
  const game = await gameModule.service.createGame();
  const host = connectClient(base, {
    code: game.code,
    token: game.hostToken,
    name: "Hosty",
  });
  const joined = waitFor<JoinedPayload>(host, "joined");
  host.connect();
  await joined;

  const started = waitFor<GameStartedPayload>(host, "game_started");
  const startState = waitFor<GameStatePayload>(host, "update_state");
  host.emit("start_game");
  await Promise.all([started, startState]);

  const purchase = waitFor<GameStatePayload>(host, "update_state");
  host.emit("purchase_items", [{ id: 0, count: 2 }]);
  await purchase;

  const consumed = waitFor<GameStatePayload>(host, "update_state");
  host.emit("consume_ingredients", [{ id: 0, count: 2 }]);
  const state = await consumed;
  const player = state.players.find((entry) => entry.name === "Hosty");
  assert.deepEqual(player?.inventory, {});

  host.close();
});

test("rejects an invalid purchase", async () => {
  const game = await gameModule.service.createGame();

  const host = connectClient(base, {
    code: game.code,
    token: game.hostToken,
    name: "Hosty",
  });
  const hostJoined = waitFor<JoinedPayload>(host, "joined");
  host.connect();
  await hostJoined;

  const started = waitFor<GameStartedPayload>(host, "game_started");
  const startState = waitFor<GameStatePayload>(host, "update_state");
  host.emit("start_game");
  await Promise.all([started, startState]);

  const failure = waitFor<GameErrorPayload>(host, "game_error");
  host.emit("purchase_items", [{ id: 999, count: 1 }]);

  const error = await failure;
  assert.equal(error.code, "INVALID_ITEM");

  host.close();
});

test("finishes a recipe and broadcasts progress to everyone", async () => {
  const game = await gameModule.service.createGame();

  const host = connectClient(base, {
    code: game.code,
    token: game.hostToken,
    name: "Hosty",
  });
  const joined = waitFor<JoinedPayload>(host, "joined");
  host.connect();
  await joined;

  const started = waitFor<GameStartedPayload>(host, "game_started");
  const startState = waitFor<GameStatePayload>(host, "update_state");
  host.emit("start_game");
  await Promise.all([started, startState]);

  const stored = await gameModule.service.getGame(game.code);
  const totalStages = stored?.state.recipeOrder[0]?.stages.length ?? 0;

  let last: GameStatePayload | undefined;
  for (let index = 0; index < totalStages; index += 1) {
    const next = waitFor<GameStatePayload>(host, "update_state");
    host.emit("finish_stage");
    last = await next;
  }

  const player = last?.players.find((entry) => entry.name === "Hosty");
  assert.equal(player?.score, POINTS_PER_RECIPE);
  assert.equal(player?.recipeIndex, 1);
  assert.equal(player?.recipeStageIndex, 0);
  assert.deepEqual(player?.inventory, {});

  host.close();
});

test("deducts food waste when a recipe is finished with leftovers", async () => {
  const game = await gameModule.service.createGame();

  const host = connectClient(base, {
    code: game.code,
    token: game.hostToken,
    name: "Hosty",
  });
  const joined = waitFor<JoinedPayload>(host, "joined");
  host.connect();
  await joined;

  const started = waitFor<GameStartedPayload>(host, "game_started");
  const startState = waitFor<GameStatePayload>(host, "update_state");
  host.emit("start_game");
  await Promise.all([started, startState]);

  const purchased = waitFor<GameStatePayload>(host, "update_state");
  host.emit("purchase_items", [{ id: ITEM_ID, count: 3 }]);
  await purchased;

  const stored = await gameModule.service.getGame(game.code);
  const totalStages = stored?.state.recipeOrder[0]?.stages.length ?? 0;

  let last: GameStatePayload | undefined;
  for (let index = 0; index < totalStages; index += 1) {
    const next = waitFor<GameStatePayload>(host, "update_state");
    host.emit("finish_stage");
    last = await next;
  }

  const player = last?.players.find((entry) => entry.name === "Hosty");
  assert.equal(player?.score, POINTS_PER_RECIPE - 3 * WASTE_PENALTY_PER_ITEM);
  assert.deepEqual(player?.inventory, {});

  host.close();
});

test("syncs the round timer and ends the game at expiry", async () => {
  const instance = await startServer({ roundDurationMs: 200 });

  try {
    const game = await instance.gameModule.service.createGame();
    const host = connectClient(instance.base, {
      code: game.code,
      token: game.hostToken,
      name: "Hosty",
    });
    const joined = waitFor<JoinedPayload>(host, "joined");
    host.connect();
    await joined;

    const started = waitFor<GameStartedPayload>(host, "game_started");
    const sync = waitFor<TimerSyncPayload>(host, "timer_sync");
    const ended = waitFor<GameEndedPayload>(host, "game_ended", 2000);
    host.emit("start_game");

    await started;

    const syncPayload = await sync;
    assert.equal(typeof syncPayload.roundEndsAt, "number");
    assert.equal(typeof syncPayload.serverNow, "number");

    const endedPayload = await ended;
    assert.equal(endedPayload.results.length, 1);
    assert.equal(endedPayload.results[0]?.name, "Hosty");

    const failure = waitFor<GameErrorPayload>(host, "game_error");
    host.emit("purchase_items", [{ id: ITEM_ID, count: 1 }]);
    const error = await failure;
    assert.equal(error.code, "GAME_NOT_ACTIVE");

    host.close();
  } finally {
    await instance.realtime.close();
  }
});

test("rejects a join once the game has started", async () => {
  const game = await gameModule.service.createGame();

  const host = connectClient(base, {
    code: game.code,
    token: game.hostToken,
    name: "Hosty",
  });
  const hostJoined = waitFor<JoinedPayload>(host, "joined");
  host.connect();
  await hostJoined;

  const started = waitFor<GameStartedPayload>(host, "game_started");
  host.emit("start_game");
  await started;

  const late = connectClient(base, { code: game.code, name: "Late" });
  const failure = waitFor<GameErrorPayload>(late, "game_error");
  late.connect();

  const error = await failure;
  assert.equal(error.code, "GAME_STARTED");

  host.close();
  late.close();
});

test("rejects a start from a non-host player", async () => {
  const game = await gameModule.service.createGame();

  const guest = connectClient(base, { code: game.code, name: "Guesty" });
  const guestJoined = waitFor<JoinedPayload>(guest, "joined");
  guest.connect();
  await guestJoined;

  const failure = waitFor<GameErrorPayload>(guest, "game_error");
  guest.emit("start_game");

  const error = await failure;
  assert.equal(error.code, "NOT_HOST");

  guest.close();
});

test("broadcasts a player's screen mode to the host and rejects invalid modes", async () => {
  const game = await gameModule.service.createGame();
  const host = connectClient(base, { code: game.code, token: game.hostToken });
  const client = connectClient(base, { code: game.code, name: "Chef" });
  try {
    const hostJoined = waitFor<JoinedPayload>(host, "joined");
    host.connect();
    await hostJoined;
    const clientJoined = waitFor<JoinedPayload>(client, "joined");
    client.connect();
    const { playerId } = await clientJoined;
    const initialState = waitFor<GameStatePayload>(host, "update_state");
    host.emit("start_game");
    assert.equal(
      (await initialState).players.find((p) => p.id === playerId)
        ?.interfaceState,
      "store",
    );

    const checkoutState = new Promise<GameStatePayload>((resolve) => {
      const onState = (state: GameStatePayload) => {
        if (
          state.players.find((p) => p.id === playerId)?.interfaceState ===
          "recipe"
        ) {
          host.off("update_state", onState);
          resolve(state);
        }
      };
      host.on("update_state", onState);
    });
    client.emit("purchase_items", [{ id: ITEM_ID, count: 2 }]);
    client.emit("update_interface_state", "recipe");
    assert.deepEqual(
      (await checkoutState).players.find((p) => p.id === playerId)?.inventory,
      { [ITEM_ID]: 2 },
    );

    for (const mode of ["recipe", "store", "recipe"] as const) {
      const updated = waitFor<GameStatePayload>(host, "update_state");
      client.emit("update_interface_state", mode);
      const state = await updated;
      assert.equal(
        state.players.find((p) => p.id === playerId)?.interfaceState,
        mode,
      );
      assert.equal(
        state.players.find((p) => p.id !== playerId)?.interfaceState,
        "store",
      );
    }
    const invalid = waitFor<GameErrorPayload>(client, "game_error");
    client.emit("update_interface_state", "invalid");
    assert.equal((await invalid).code, "INVALID_INTERFACE_STATE");
    const saved = await gameModule.service.getGame(game.code);
    assert.equal(
      saved?.state.players.find((p) => p.id === playerId)?.interfaceState,
      "recipe",
    );
  } finally {
    client.close();
    host.close();
  }
});

test("host receives each player's current stage before the recipe is complete", async () => {
  const game = await gameModule.service.createGame();
  const host = connectClient(base, { code: game.code, token: game.hostToken });
  const client = connectClient(base, { code: game.code, name: "Chef" });
  try {
    const hostJoined = waitFor<JoinedPayload>(host, "joined");
    host.connect();
    await hostJoined;
    const clientJoined = waitFor<JoinedPayload>(client, "joined");
    client.connect();
    const { playerId } = await clientJoined;
    const started = waitFor<GameStatePayload>(host, "update_state");
    const phoneStarted = waitFor<GameStatePayload>(client, "update_state");
    host.emit("start_game");
    await Promise.all([started, phoneStarted]);
    const prep = waitFor<GameStatePayload>(host, "update_state");
    const phonePrep = waitFor<GameStatePayload>(client, "update_state");
    client.emit("update_interface_state", "recipe");
    await Promise.all([prep, phonePrep]);

    const stored = await gameModule.service.getGame(game.code);
    const stages = stored?.state.recipeOrder[0]?.stages.length ?? 0;
    assert.ok(stages > 1);
    for (let completed = 1; completed <= stages; completed += 1) {
      const hostUpdate = waitFor<GameStatePayload>(host, "update_state");
      const phoneUpdate = waitFor<GameStatePayload>(client, "update_state");
      client.emit("finish_stage");
      const [hostState, phoneState] = await Promise.all([
        hostUpdate,
        phoneUpdate,
      ]);
      const player = hostState.players.find((entry) => entry.id === playerId);
      assert.ok(player);
      assert.equal(player.recipeStageIndex, completed < stages ? completed : 0);
      assert.equal(player.recipeIndex, completed < stages ? 0 : 1);
      assert.equal(player.score, completed < stages ? 0 : POINTS_PER_RECIPE);
      assert.equal(player.interfaceState, "recipe");
      assert.deepEqual(
        player,
        phoneState.players.find((entry) => entry.id === playerId),
      );
    }
  } finally {
    client.close();
    host.close();
  }
});

// These tests exercise the public websocket flow rather than granting test credits directly.
async function sabotageRoom() {
  const game = await gameModule.service.createGame();
  const host = connectClient(base, { code: game.code, token: game.hostToken });
  const source = connectClient(base, { code: game.code, name: "Ada" });
  const target = connectClient(base, { code: game.code, name: "Jun" });
  const joined = [];
  for (const socket of [host, source, target]) {
    const response = waitFor<JoinedPayload>(socket, "joined");
    socket.connect();
    joined.push(await response);
  }
  const ready = waitFor<ClientGameState>(source, "update_state");
  host.emit("start_game");
  const state = await ready;
  return {
    game,
    host,
    source,
    target,
    sourceId: joined[1].playerId,
    targetId: joined[2].playerId,
    sourceToken: joined[1].reconnectToken,
    targetToken: joined[2].reconnectToken,
    state,
  };
}
async function earnSocketCredit(
  room: Awaited<ReturnType<typeof sabotageRoom>>,
  definitionId: string,
) {
  // Awards are random; pin this one so the test knows what it holds.
  gameModule.service.pickSabotage = () => definitionId;
  const player = room.state.players.find((p) => p.id === room.sourceId)!;
  const stages = room.state.recipeOrder[player.recipeIndex].stages.length;
  for (let stage = player.recipeStageIndex; stage < stages; stage++) {
    const update = waitFor<ClientGameState>(room.source, "update_state");
    room.source.emit("finish_stage");
    room.state = await update;
  }
  assert.ok(
    room.state.players.find((p) => p.id === room.sourceId)!.sabotageCredits > 0,
  );
}

test("sabotage websocket broadcasts exact inventory changes to host, sender, and victim", async (t) => {
  const room = await sabotageRoom();
  t.after(() => {
    room.host.close();
    room.source.close();
    room.target.close();
  });
  await earnSocketCredit(room, "steal");
  const stock = waitFor<ClientGameState>(room.source, "update_state");
  room.target.emit("purchase_items", [{ id: ITEM_ID, count: 2 }]);
  await stock;
  const applied = [room.host, room.source, room.target].map((socket) =>
    waitFor<SabotageAppliedPayload>(socket, "sabotage_applied"),
  );
  const updates = [room.host, room.source, room.target].map((socket) =>
    waitForState(
      socket,
      (state) =>
        state.players.find((p) => p.id === room.sourceId)?.sabotageCredits ===
          0 &&
        state.players.find((p) => p.id === room.sourceId)?.inventory[
          ITEM_ID
        ] === 1,
    ),
  );
  // A forged source field must not change the authenticated sender.
  room.source.emit("use_sabotage", {
    definitionId: "steal",
    targetPlayerId: room.targetId,
    sourcePlayerId: room.targetId,
  });
  const events = await Promise.all(applied);
  const states = await Promise.all(updates);
  assert.deepEqual(events[0], events[1]);
  assert.deepEqual(events[1], events[2]);
  assert.equal(events[0].sourcePlayerId, room.sourceId);
  assert.equal(events[0].targetPlayerId, room.targetId);
  assert.equal(events[0].ingredientId, ITEM_ID);
  assert.equal(events[0].expiresAt, null);
  assert.equal(typeof events[0].serverNow, "number");
  for (const state of states) {
    assert.equal(
      state.players.find((p) => p.id === room.sourceId)?.sabotageCredits,
      0,
    );
    assert.deepEqual(
      state.players.find((p) => p.id === room.sourceId)?.inventory,
      { [ITEM_ID]: 1 },
    );
    assert.deepEqual(
      state.players.find((p) => p.id === room.targetId)?.inventory,
      { [ITEM_ID]: 1 },
    );
    assert.equal(JSON.stringify(state).includes(room.sourceToken), false);
    assert.equal(JSON.stringify(state).includes(room.game.hostToken), false);
  }
});

test("rapid sabotage requests spend a single credit once and malformed input preserves it", async (t) => {
  const room = await sabotageRoom();
  t.after(() => {
    room.host.close();
    room.source.close();
    room.target.close();
  });
  await earnSocketCredit(room, "blackout");
  const malformed = waitFor<GameErrorPayload>(room.source, "game_error");
  room.source.emit("use_sabotage", null);
  assert.equal((await malformed).code, "SABOTAGE_NOT_FOUND");
  const applied = waitFor<SabotageAppliedPayload>(
    room.source,
    "sabotage_applied",
  );
  const denied = waitFor<GameErrorPayload>(room.source, "game_error");
  const updated = waitFor<ClientGameState>(room.source, "update_state");
  room.source.emit("use_sabotage", { definitionId: "blackout" });
  room.source.emit("use_sabotage", { definitionId: "blackout" });
  assert.equal((await applied).definition.id, "blackout");
  assert.equal((await denied).code, "SABOTAGE_ALREADY_USED");
  assert.equal(
    (await updated).players.find((p) => p.id === room.sourceId)
      ?.sabotageCredits,
    0,
  );
  const game = await gameModule.service.getGame(room.game.code);
  assert.equal(game?.state.activeSabotages.length, 1);
});

test("freeze enforces server-side blocking and reconnect restores active effects and balance", async (t) => {
  const room = await sabotageRoom();
  t.after(() => {
    room.host.close();
    room.source.close();
    room.target.close();
  });
  await earnSocketCredit(room, "freeze");
  const applied = waitFor<SabotageAppliedPayload>(
    room.target,
    "sabotage_applied",
  );
  const updated = waitFor<ClientGameState>(room.target, "update_state");
  room.source.emit("use_sabotage", {
    definitionId: "freeze",
    targetPlayerId: room.targetId,
  });
  const effect = await applied;
  await updated;
  const error = waitFor<GameErrorPayload>(room.target, "game_error");
  room.target.emit("finish_stage");
  assert.equal((await error).code, "PLAYER_FROZEN");
  const left = waitFor<PlayerDisconnectedPayload>(
    room.host,
    "player_disconnected",
  );
  room.target.close();
  await left;
  const resumed = connectClient(base, {
    code: room.game.code,
    reconnectToken: room.targetToken,
  });
  t.after(() => resumed.close());
  const snapshot = waitFor<ClientGameState>(resumed, "update_state");
  resumed.connect();
  const state = await snapshot;
  assert.equal(state.activeSabotages[0].id, effect.id);
  assert.equal(
    state.players.find((p) => p.id === room.sourceId)?.sabotageCredits,
    0,
  );
  assert.equal(state.activeSabotages[0].expiresAt, effect.expiresAt);
  assert.ok(state.serverNow >= effect.serverNow);
  const rejected = waitFor<GameErrorPayload>(resumed, "game_error");
  resumed.emit("purchase_items", [{ id: ITEM_ID, count: 1 }]);
  assert.equal((await rejected).code, "PLAYER_FROZEN");
});

function waitForState(
  socket: Socket,
  matches: (state: ClientGameState) => boolean,
): Promise<ClientGameState> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off("update_state", onState);
      reject(new Error("timeout waiting for matching state"));
    }, 3000);
    function onState(state: ClientGameState) {
      if (!matches(state)) return;
      clearTimeout(timer);
      socket.off("update_state", onState);
      resolve(state);
    }
    socket.on("update_state", onState);
  });
}

test("a player can only use the sabotage they were awarded", async (t) => {
  const room = await sabotageRoom();
  t.after(() => {
    room.host.close();
    room.source.close();
    room.target.close();
  });
  await earnSocketCredit(room, "freeze");
  assert.deepEqual(
    room.state.players.find((p) => p.id === room.sourceId)?.heldSabotages,
    ["freeze"],
  );
  const denied = waitFor<GameErrorPayload>(room.source, "game_error");
  room.source.emit("use_sabotage", { definitionId: "blackout" });
  assert.equal((await denied).code, "SABOTAGE_NOT_HELD");
  const applied = waitFor<SabotageAppliedPayload>(
    room.source,
    "sabotage_applied",
  );
  room.source.emit("use_sabotage", {
    definitionId: "freeze",
    targetPlayerId: room.targetId,
  });
  assert.equal((await applied).definition.id, "freeze");
});
