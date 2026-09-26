import type { PlayerSummary } from './player.ts';

export interface JoinedPayload {
  playerId: string;
  gameCode: string;
  isHost: boolean;
  players: PlayerSummary[];
}

export interface ServerToClientEvents {
  joined: (payload: JoinedPayload) => void;
  player_joined: (player: PlayerSummary) => void;
  player_left: (payload: { playerId: string }) => void;
  game_error: (payload: { code: string; message: string }) => void;
}

export interface ClientToServerEvents {
  start_game: () => void;
}

export interface InterServerEvents {}

export interface SocketData {
  player?: PlayerSummary;
}
