import type { GameState } from '../../game/domain/game.ts';
import type { PlayerSummary } from './player.ts';

export interface JoinedPayload {
  playerId: string;
  gameCode: string;
  isHost: boolean;
  players: PlayerSummary[];
}

export interface GameStartedPayload {
  gameCode: string;
}

export interface ServerToClientEvents {
  joined: (payload: JoinedPayload) => void;
  player_joined: (player: PlayerSummary) => void;
  player_left: (payload: { playerId: string }) => void;
  game_started: (payload: GameStartedPayload) => void;
  game_error: (payload: { code: string; message: string }) => void;
  update_state: (state: GameState) => void;
}

export interface ClientToServerEvents {
  start_game: () => void;
  send_recipe_order: (order: number[]) => void; //order of recipe IDs
}

export interface InterServerEvents {}

export interface SocketData {
  player?: PlayerSummary;
}
