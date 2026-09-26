import { strict as assert } from "node:assert";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";

import { io, type Socket } from "socket.io-client";

import { createApp } from "./app.ts";
import { createGameModule, type GameModule } from "./game/index.ts";
import { createRealtimeModule, type RealtimeModule } from "./realtime/index.ts";

interface JoinedPayload {
  playerId: string;
  gameCode: string;
  isHost: boolean;
  players: Array<{ id: string; name: string }>;
}

interface PlayerJoinedPayload {
  id: string;
  name: string;
}

interface PlayerLeftPayload {
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

let server: Server;
let realtime: RealtimeModule;
let gameModule: GameModule;
let base: string;

before(async () => {
  gameModule = createGameModule();
  const app = createApp({ gameRouter: gameModule.router });
  server = createServer(app);
  realtime = createRealtimeModule({ server, gameService: gameModule.service });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const { port } = server.address() as AddressInfo;
  base = `http://127.0.0.1:${port}`;
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

test("relays presence between clients and honours the host token", async () => {
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
  assert.equal(hostPayload.players[0].name, "Hosty");

  const guest = connectClient(base, { code: game.code, name: "Guesty" });
  const guestJoined = waitFor<JoinedPayload>(guest, "joined");
  const hostSawGuest = waitFor<PlayerJoinedPayload>(host, "player_joined");
  guest.connect();

  const [guestPayload, presence] = await Promise.all([
    guestJoined,
    hostSawGuest,
  ]);
  assert.equal(guestPayload.isHost, false);
  assert.equal(guestPayload.players.length, 2);
  assert.equal(presence.id, guestPayload.playerId);
  assert.equal(presence.name, "Guesty");

  const guestLeft = waitFor<PlayerLeftPayload>(host, "player_left");
  guest.disconnect();

  const left = await guestLeft;
  assert.equal(left.playerId, guestPayload.playerId);

  host.close();
  guest.close();
});

test("host starts the game and notifies every player", async () => {
  const game = await gameModule.service.createGame();

  const host = connectClient(base, { code: game.code, token: game.hostToken });
  const hostJoined = waitFor<JoinedPayload>(host, "joined");
  host.connect();
  await hostJoined;

  const guest = connectClient(base, { code: game.code });
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

  host.close();
  guest.close();
});

test("rejects a join once the game has started", async () => {
  const game = await gameModule.service.createGame();

  const host = connectClient(base, { code: game.code, token: game.hostToken });
  const hostJoined = waitFor<JoinedPayload>(host, "joined");
  host.connect();
  await hostJoined;

  const started = waitFor<GameStartedPayload>(host, "game_started");
  host.emit("start_game");
  await started;

  const late = connectClient(base, { code: game.code });
  const failure = waitFor<GameErrorPayload>(late, "game_error");
  late.connect();

  const error = await failure;
  assert.equal(error.code, "GAME_STARTED");

  host.close();
  late.close();
});

test("rejects a start from a non-host player", async () => {
  const game = await gameModule.service.createGame();

  const guest = connectClient(base, { code: game.code });
  const guestJoined = waitFor<JoinedPayload>(guest, "joined");
  guest.connect();
  await guestJoined;

  const failure = waitFor<GameErrorPayload>(guest, "game_error");
  guest.emit("start_game");

  const error = await failure;
  assert.equal(error.code, "NOT_HOST");

  guest.close();
});
