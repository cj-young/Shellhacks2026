import type { GameState } from "../../game/domain/game.ts";
import type { PurchaseItem } from "../../game/domain/inventory.ts";
import type { PlayerSummary } from "./player.ts";

export interface JoinedPayload {
  playerId: string;
  gameCode: string;
  isHost: boolean;
  reconnectToken: string;
  players: PlayerSummary[];
}

export interface GameStartedPayload {
  gameCode: string;
}

export interface TimerSyncPayload {
  roundEndsAt: number;
  serverNow: number;
}

export interface PlayerResult {
  playerId: string;
  name: string;
  score: number;
}

export interface GameEndedPayload {
  results: PlayerResult[];
}

/**
 * The sanitized view of game state sent to clients: players are stripped of
 * their reconnect tokens.
 */
export type ClientGameState = Omit<GameState, "players"> & {
  players: PlayerSummary[];
};

export interface ServerToClientEvents {
  joined: (payload: JoinedPayload) => void;
  player_joined: (player: PlayerSummary) => void;
  player_disconnected: (payload: { playerId: string }) => void;
  game_started: (payload: GameStartedPayload) => void;
  game_error: (payload: { code: string; message: string }) => void;
  update_state: (state: ClientGameState) => void;
  timer_sync: (payload: TimerSyncPayload) => void;
  game_ended: (payload: GameEndedPayload) => void;
}

export interface ClientToServerEvents {
  start_game: () => void;
  send_recipe_order: (order: number[]) => void; //order of recipe IDs
  purchase_items: (items: PurchaseItem[]) => void;
  consume_ingredients: (items: PurchaseItem[]) => void;
  finish_stage: () => void;
}

export interface InterServerEvents {}

export interface SocketData {
  player?: PlayerSummary;
}
