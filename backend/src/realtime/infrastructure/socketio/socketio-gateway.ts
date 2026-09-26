import type { Server as HttpServer } from 'node:http';

import { Server, type Socket } from 'socket.io';

import type { GameService } from '../../../game/application/game-service.ts';
import { JoinSession } from '../../application/join-session.ts';
import type { PlayerSummary } from '../../domain/player.ts';
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '../../domain/protocol.ts';

const SOCKET_PATH = '/socket.io/';
const MAX_BUFFER_BYTES = 16 * 1024;

export type GameServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
export type GameSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export interface RealtimeModuleOptions {
  server: HttpServer;
  gameService: GameService;
  allowedOrigins?: readonly string[];
}

export interface RealtimeModule {
  io: GameServer;
  close(): Promise<void>;
}

export function createRealtimeModule(options: RealtimeModuleOptions): RealtimeModule {
  const joinSession = new JoinSession(options.gameService);
  const io: GameServer = new Server(options.server, {
    path: SOCKET_PATH,
    serveClient: false,
    maxHttpBufferSize: MAX_BUFFER_BYTES,
    allowRequest: (request, callback) => {
      callback(
        null,
        isOriginAllowed(request.headers.origin, request.headers.host, options.allowedOrigins),
      );
    },
  });

  io.on('connection', (socket) => {
    void handleConnection(socket);
  });

  async function handleConnection(socket: GameSocket): Promise<void> {
    const auth = socket.handshake.auth as Record<string, unknown>;
    const code = typeof auth.code === 'string' ? auth.code : '';
    const hostToken = typeof auth.token === 'string' ? auth.token : undefined;

    let result;
    try {
      result = await joinSession.join({ code, hostToken });
    } catch {
      socket.emit('game_error', { code: 'INTERNAL_ERROR', message: 'Unable to join the game' });
      socket.disconnect(true);
      return;
    }

    if (!result.ok) {
      socket.emit('game_error', { code: result.code, message: result.message });
      socket.disconnect(true);
      return;
    }

    const { gameCode, player } = result;
    const room = roomFor(gameCode);

    socket.data.player = player;
    await socket.join(room);

    const players = (await io.in(room).fetchSockets())
      .map((remote) => remote.data.player)
      .filter(isPlayer);

    socket.emit('joined', {
      playerId: player.id,
      gameCode,
      isHost: player.isHost,
      players,
    });
    socket.to(room).emit('player_joined', player);

    socket.on('start_game', () => {
      socket.emit('game_error', {
        code: 'NOT_IMPLEMENTED',
        message: 'start_game is not implemented yet',
      });
    });

    socket.on('disconnect', () => {
      io.to(room).emit('player_left', { playerId: player.id });
    });
  }

  function close(): Promise<void> {
    return new Promise((resolve) => {
      io.close(() => resolve());
    });
  }

  return { io, close };
}

function roomFor(gameCode: string): string {
  return `game:${gameCode}`;
}

function isPlayer(value: PlayerSummary | undefined): value is PlayerSummary {
  return value !== undefined;
}

function isOriginAllowed(
  origin: string | undefined,
  host: string | undefined,
  allowedOrigins: readonly string[] | undefined,
): boolean {
  if (!origin) {
    return true;
  }

  const allowed = allowedOrigins ?? (host ? [`http://${host}`, `https://${host}`] : []);
  return allowed.length === 0 || allowed.includes(origin);
}
