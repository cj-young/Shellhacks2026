export type GameStatus = 'lobby' | 'active';

export interface Game {
  readonly code: string;
  readonly hostToken: string;
  readonly status: GameStatus;
  readonly createdAt: number;
}
