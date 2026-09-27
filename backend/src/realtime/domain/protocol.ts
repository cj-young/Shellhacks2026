import type { PlayerInterfaceState } from "../../game/domain/player.ts";
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
  /** A player's summary changed in the lobby (e.g. they picked a chef). */
  player_updated: (player: PlayerSummary) => void;
  game_started: (payload: GameStartedPayload) => void;
  game_error: (payload: { code: string; message: string }) => void;
  update_state: (state: ClientGameState) => void;
  player_scored: (payload: PlayerScoredPayload) => void;
  timer_sync: (payload: TimerSyncPayload) => void;
  game_ended: (payload: GameEndedPayload) => void;
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
  update_interface_state: (interfaceState: PlayerInterfaceState) => void;
  update_cart: (items: PurchaseItem[]) => void;
  consume_ingredients: (items: PurchaseItem[]) => void;
  finish_stage: () => void;
  /** Pick a chef in the lobby: "bear" | "cat" | "cow" | "panda". */
  select_character: (character: string) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  player?: PlayerSummary;
}
