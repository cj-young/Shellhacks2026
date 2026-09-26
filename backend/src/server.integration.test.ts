import { strict as assert } from "node:assert";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";

import { io, type Socket } from "socket.io-client";

import ingredients from "./data/ingredients.json" with { type: "json" };
import { createApp } from "./app.ts";
import { createGameModule, type GameModule } from "./game/index.ts";
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
