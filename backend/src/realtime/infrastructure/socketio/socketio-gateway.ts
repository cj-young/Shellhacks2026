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
const POINTS_PER_RECIPE = 100;

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
}

export interface SocketIoGateway {
  close(): Promise<void>;
}

export function createSocketIoGateway(
  options: SocketIoGatewayOptions,
): SocketIoGateway {
  const { session } = options;
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

  // In-memory running totals, keyed by game code then player id.
  const scores = new Map<string, Map<string, number>>();

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

    socket.on("start_game", () => {
      void handleStartGame();
    });

    async function handleStartGame(): Promise<void> {
      const startResult = await session.start({
        code: gameCode,
        isHost: player.isHost,
      });

      if (!startResult.ok) {
        socket.emit("game_error", {
          code: startResult.code,
          message: startResult.message,
        });
        return;
      }

      io.to(room).emit("game_started", { gameCode: startResult.gameCode });
      io.to(room).emit("update_state", startResult.state);
    }

    socket.on("recipe_completed", () => {
      if (player.isHost) return;
      const gameScores = scores.get(gameCode) ?? new Map<string, number>();
      const total = (gameScores.get(player.id) ?? 0) + POINTS_PER_RECIPE;
      gameScores.set(player.id, total);
      scores.set(gameCode, gameScores);
      io.to(room).emit("player_scored", {
        playerId: player.id,
        points: POINTS_PER_RECIPE,
        total,
      });
    });

    socket.on("purchase_items", (items) => {
      void handlePurchase(items);
    });

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

    socket.on("disconnect", () => {
      void handleDisconnect();
    });

    async function handleDisconnect(): Promise<void> {
      await session.leave({ code: gameCode, playerId: player.id });
      io.to(room).emit("player_disconnected", { playerId: player.id });
    }
  }

  function close(): Promise<void> {
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
