export { createRealtimeModule } from './infrastructure/socketio/socketio-gateway.ts';
export type {
  GameServer,
  GameSocket,
  RealtimeModule,
  RealtimeModuleOptions,
} from './infrastructure/socketio/socketio-gateway.ts';
export type {
  ClientToServerEvents,
  InterServerEvents,
  JoinedPayload,
  ServerToClientEvents,
  SocketData,
} from './domain/protocol.ts';
export type { PlayerSummary } from './domain/player.ts';
