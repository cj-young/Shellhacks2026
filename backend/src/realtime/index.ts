import type { Server as HttpServer } from "node:http";

import type { GameService } from "../game/index.ts";
import { GameSession } from "./application/game-session.ts";
import { createSocketIoGateway } from "./infrastructure/socketio/socketio-gateway.ts";

export interface RealtimeModuleOptions {
  server: HttpServer;
  gameService: GameService;
  allowedOrigins?: readonly string[];
  roundDurationMs?: number;
  stageSweepIntervalMs?: number;
}

export interface RealtimeModule {
  close(): Promise<void>;
}

const ROUND_DURATION_MS_DEFAULT = 180_000;
const STAGE_SWEEP_INTERVAL_MS_DEFAULT = 1000;

export function createRealtimeModule(
  options: RealtimeModuleOptions,
): RealtimeModule {
  const session = new GameSession(options.gameService);

  return createSocketIoGateway({
    server: options.server,
    session,
    allowedOrigins: options.allowedOrigins,
    roundDurationMs: options.roundDurationMs ?? ROUND_DURATION_MS_DEFAULT,
    stageSweepIntervalMs:
      options.stageSweepIntervalMs ?? STAGE_SWEEP_INTERVAL_MS_DEFAULT,
  });
}

export type {
  ClientGameState,
  ClientToServerEvents,
  GameEndedPayload,
  GameStartedPayload,
  InterServerEvents,
  JoinedPayload,
  PlayerResult,
  ServerToClientEvents,
  SocketData,
  TimerSyncPayload,
} from "./domain/protocol.ts";
export type { PlayerSummary } from "./domain/player.ts";
