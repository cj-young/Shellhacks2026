import type { Server as HttpServer } from "node:http";

import { Server, type Socket } from "socket.io";

import type { PurchaseItem } from "../../../game/domain/inventory.ts";
import type { GameSession } from "../../application/game-session.ts";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../../domain/protocol.ts";

const SOCKET_PATH = "/socket.io/";
const MAX_BUFFER_BYTES = 16 * 1024;

type GameServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
type GameSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export interface SocketIoGatewayOptions {
  server: HttpServer;
  session: GameSession;
  allowedOrigins?: readonly string[];
  roundDurationMs: number;
  stageSweepIntervalMs: number;
}

export interface SocketIoGateway {
  close(): Promise<void>;
}

export function createSocketIoGateway(
  options: SocketIoGatewayOptions,
): SocketIoGateway {
  const { session } = options;
  // Socket.IO can deliver multiple events before an async state write finishes.
  // Serialize room mutations so checkout and screen changes cannot overwrite each other.
  const pendingActions = new Map<string, Promise<void>>();
  function enqueue(
    gameCode: string,
    action: () => Promise<void>,
  ): Promise<void> {
    const pending = pendingActions.get(gameCode) ?? Promise.resolve();
    const next = pending.then(action);
    const settled = next.catch(() => {});
    pendingActions.set(gameCode, settled);
    void settled.then(() => {
      if (pendingActions.get(gameCode) === settled)
        pendingActions.delete(gameCode);
    });
    return next;
  }

  const timers = new Map<string, NodeJS.Timeout>();
  const stageSweeps = new Map<string, NodeJS.Timeout>();
  const io: GameServer = new Server(options.server, {
    path: SOCKET_PATH,
    serveClient: false,
    maxHttpBufferSize: MAX_BUFFER_BYTES,
    allowRequest: (request, callback) => {
      callback(
        null,
        isOriginAllowed(
          request.headers.origin,
          request.headers.host,
          options.allowedOrigins,
        ),
      );
    },
  });

  io.on("connection", (socket) => {
    void handleConnection(socket);
  });

  async function handleConnection(socket: GameSocket): Promise<void> {
    const auth = socket.handshake.auth as Record<string, unknown>;
    const code = typeof auth.code === "string" ? auth.code : "";
    const name = typeof auth.name === "string" ? auth.name : undefined;
    const hostToken = typeof auth.token === "string" ? auth.token : undefined;
    const reconnectToken =
      typeof auth.reconnectToken === "string" ? auth.reconnectToken : undefined;

    let result;
    try {
      result = await session.join({ code, name, hostToken, reconnectToken });
    } catch {
      socket.emit("game_error", {
        code: "INTERNAL_ERROR",
        message: "Unable to join the game",
      });
      socket.disconnect(true);
      return;
    }

    if (!result.ok) {
      socket.emit("game_error", { code: result.code, message: result.message });
      socket.disconnect(true);
      return;
    }

    const { gameCode, player, players, reconnectToken: playerToken } = result;
    const room = roomFor(gameCode);

    socket.data.player = player;
    await socket.join(room);

    socket.emit("joined", {
      playerId: player.id,
      gameCode,
      isHost: player.isHost,
      reconnectToken: playerToken,
      players,
    });
    socket.to(room).emit("player_joined", player);

    if (result.status === "active") {
      socket.emit("update_state", result.state);

      if (result.state.roundEndsAt !== null) {
        socket.emit("timer_sync", {
          roundEndsAt: result.state.roundEndsAt,
          serverNow: Date.now(),
        });
      }
    }

    function runAction(action: () => Promise<void>): void {
      void enqueue(gameCode, action).catch(() => {
        socket.emit("game_error", {
          code: "INTERNAL_ERROR",
          message: "Unable to update the game",
        });
      });
    }

    socket.on("start_game", () => {
      runAction(handleStartGame);
    });

    async function handleStartGame(): Promise<void> {
      const startResult = await session.start(
        { code: gameCode, isHost: player.isHost },
        options.roundDurationMs,
      );

      if (!startResult.ok) {
        socket.emit("game_error", {
          code: startResult.code,
          message: startResult.message,
        });
        return;
      }

      io.to(room).emit("game_started", { gameCode: startResult.gameCode });
      io.to(room).emit("update_state", startResult.state);

      if (startResult.state.roundEndsAt !== null) {
        armRoundTimers(gameCode, startResult.state.roundEndsAt);
      }

      startStageSweep(gameCode);
    }

    socket.on("purchase_items", (items) => {
      runAction(() => handlePurchase(items));
    });

    socket.on("update_interface_state", (interfaceState) => {
      runAction(() => handleUpdateInterfaceState(interfaceState));
    });

    async function handleUpdateInterfaceState(
      interfaceState: unknown,
    ): Promise<void> {
      const update = await session.updateInterfaceState({
        code: gameCode,
        playerId: player.id,
        interfaceState,
      });
      if (!update.ok) {
        socket.emit("game_error", {
          code: update.code,
          message: update.message,
        });
        return;
      }
      io.to(room).emit("update_state", update.state);
    }

    socket.on("update_cart", (items) => {
      runAction(() => handleUpdateCart(items));
    });

    socket.on("consume_ingredients", (items) => {
      runAction(() => handleConsumeIngredients(items));
    });

    socket.on("finish_stage", () => {
      runAction(handleFinishStage);
    });

    socket.on("select_character", (character) => {
      runAction(() => handleSelectCharacter(character));
    });

    async function handleSelectCharacter(character: unknown): Promise<void> {
      const selection = await session.selectCharacter({
        code: gameCode,
        playerId: player.id,
        character,
      });

      if (!selection.ok) {
        socket.emit("game_error", {
          code: selection.code,
          message: selection.message,
        });
        return;
      }

      io.to(room).emit("player_updated", selection.player);
    }

    async function handlePurchase(items: PurchaseItem[]): Promise<void> {
      if (!isPurchaseItems(items)) {
        socket.emit("game_error", {
          code: "INVALID_ITEM",
          message: "Invalid purchase",
        });
        return;
      }

      console.log("reached session purchase");
      const purchase = await session.purchase({
        code: gameCode,
        playerId: player.id,
        items,
      });

      if (!purchase.ok) {
        socket.emit("game_error", {
          code: purchase.code,
          message: purchase.message,
        });
        return;
      }

      console.log("successfully checked out");

      io.to(room).emit("update_state", purchase.state);
    }

    async function handleUpdateCart(items: PurchaseItem[]): Promise<void> {
      if (!isPurchaseItems(items)) {
        socket.emit("game_error", {
          code: "INVALID_ITEM",
          message: "Invalid cart",
        });
        return;
      }

      const update = await session.updateCart({
        code: gameCode,
        playerId: player.id,
        items,
      });
      if (!update.ok) {
        socket.emit("game_error", {
          code: update.code,
          message: update.message,
        });
        return;
      }

      io.to(room).emit("update_state", update.state);
    }

    async function handleConsumeIngredients(
      items: PurchaseItem[],
    ): Promise<void> {
      if (!isPurchaseItems(items)) {
        socket.emit("game_error", {
          code: "INVALID_ITEM",
          message: "Invalid ingredient consumption",
        });
        return;
      }

      const consumption = await session.consumeIngredients({
        code: gameCode,
        playerId: player.id,
        items,
      });
      if (!consumption.ok) {
        socket.emit("game_error", {
          code: consumption.code,
          message: consumption.message,
        });
        return;
      }

      io.to(room).emit("update_state", consumption.state);
    }

    async function handleFinishStage(): Promise<void> {
      const result = await session.finishStage({
        code: gameCode,
        playerId: player.id,
      });

      if (!result.ok) {
        socket.emit("game_error", {
          code: result.code,
          message: result.message,
        });
        return;
      }

      io.to(room).emit("update_state", result.state);
    }

    socket.on("disconnect", () => {
      runAction(handleDisconnect);
    });

    async function handleDisconnect(): Promise<void> {
      await session.leave({ code: gameCode, playerId: player.id });
      io.to(room).emit("player_disconnected", { playerId: player.id });
    }
  }

  function armRoundTimers(gameCode: string, roundEndsAt: number): void {
    clearRoundTimers(gameCode);

    io.to(roomFor(gameCode)).emit("timer_sync", {
      roundEndsAt,
      serverNow: Date.now(),
    });

    const expiry = setTimeout(
      () => {
        void enqueue(gameCode, () => finishRound(gameCode));
      },
      Math.max(0, roundEndsAt - Date.now()),
    );
    expiry.unref();

    timers.set(gameCode, expiry);
  }

  function clearRoundTimers(gameCode: string): void {
    const expiry = timers.get(gameCode);

    if (!expiry) {
      return;
    }

    clearTimeout(expiry);
    timers.delete(gameCode);
  }

  async function finishRound(gameCode: string): Promise<void> {
    clearRoundTimers(gameCode);
    stopStageSweep(gameCode);
    const room = roomFor(gameCode);
    const result = await session.endRound({ code: gameCode });

    if (!result.ok) {
      return;
    }

    io.to(room).emit("game_ended", { results: result.results });
    io.to(room).emit("update_state", result.state);
  }

  function startStageSweep(gameCode: string): void {
    stopStageSweep(gameCode);
    const sweep = setInterval(() => {
      void enqueue(gameCode, () => checkStages(gameCode));
    }, options.stageSweepIntervalMs);
    sweep.unref();
    stageSweeps.set(gameCode, sweep);
  }

  function stopStageSweep(gameCode: string): void {
    const sweep = stageSweeps.get(gameCode);
    if (!sweep) return;
    clearInterval(sweep);
    stageSweeps.delete(gameCode);
  }

  async function checkStages(gameCode: string): Promise<void> {
    const result = await session.expireStages({ code: gameCode });
    if (!result.ok || !result.changed) return;
    io.to(roomFor(gameCode)).emit("update_state", result.state);
  }

  function close(): Promise<void> {
    for (const gameCode of [...timers.keys()]) {
      clearRoundTimers(gameCode);
    }

    for (const gameCode of [...stageSweeps.keys()]) {
      stopStageSweep(gameCode);
    }

    return new Promise((resolve) => {
      io.close(() => resolve());
    });
  }

  return { close };
}

function roomFor(gameCode: string): string {
  return `game:${gameCode}`;
}

function isPurchaseItems(value: unknown): value is PurchaseItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as { id?: unknown }).id === "number" &&
        typeof (item as { count?: unknown }).count === "number",
    )
  );
}

function isOriginAllowed(
  origin: string | undefined,
  host: string | undefined,
  allowedOrigins: readonly string[] | undefined,
): boolean {
  if (!origin) {
    return true;
  }

  const allowed =
    allowedOrigins ?? (host ? [`http://${host}`, `https://${host}`] : []);
  return allowed.length === 0 || allowed.includes(origin);
}
