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
  player_scored: (payload: PlayerScoredPayload) => void;
}

export interface PlayerScoredPayload {
  playerId: string;
  /** Points awarded for this completion. */
  points: number;
  /** The player's running total for this game. */
  total: number;
}

export interface ClientToServerEvents {
  start_game: () => void;
  send_recipe_order: (order: number[]) => void; //order of recipe IDs
  recipe_completed: () => void;
  purchase_items: (items: PurchaseItem[]) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  player?: PlayerSummary;
}
