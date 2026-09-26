import type { Server as HttpServer } from 'node:http';

import type { GameService } from '../game/index.ts';
import { JoinSession } from './application/join-session.ts';
import { createSocketIoGateway } from './infrastructure/socketio/socketio-gateway.ts';

export interface RealtimeModuleOptions {
  server: HttpServer;
  gameService: GameService;
  allowedOrigins?: readonly string[];
}

export interface RealtimeModule {
  close(): Promise<void>;
}

export function createRealtimeModule(options: RealtimeModuleOptions): RealtimeModule {
  const joinSession = new JoinSession(options.gameService);

  return createSocketIoGateway({
    server: options.server,
    joinSession,
    allowedOrigins: options.allowedOrigins,
  });
}

export type {
  ClientToServerEvents,
  InterServerEvents,
  JoinedPayload,
  ServerToClientEvents,
  SocketData,
} from './domain/protocol.ts';
export type { PlayerSummary } from './domain/player.ts';
