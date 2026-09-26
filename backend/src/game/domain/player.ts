export const MAX_PLAYER_NAME_LENGTH = 20;

export interface Player {
  readonly id: string;
  readonly name: string;
  readonly isHost: boolean;
  readonly reconnectToken: string;
  readonly joinedAt: number;
  readonly connected: boolean;
}

export function normalizePlayerName(raw: string | undefined): string {
  if (!raw) {
    return "";
  }

  return raw.trim().replace(/\s+/g, " ").slice(0, MAX_PLAYER_NAME_LENGTH);
}
