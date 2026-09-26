import type { Player } from "../../game/domain/player.ts";

export interface PlayerSummary {
  readonly id: string;
  readonly name: string;
  readonly isHost: boolean;
  readonly joinedAt: number;
  readonly connected: boolean;
}

export function toPlayerSummary(player: Player): PlayerSummary {
  return {
    id: player.id,
    name: player.name,
    isHost: player.isHost,
    joinedAt: player.joinedAt,
    connected: player.connected,
  };
}
