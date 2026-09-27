export type SabotageId = string;

/** How a sabotage selects its target(s). */
export type SabotageTargetScope = "self" | "single" | "all";

/** Static metadata/blueprint shared by all instances of a sabotage. */
export interface SabotageDefinition {
  readonly id: SabotageId;
  readonly name: string;
  readonly description: string;
  readonly targetScope: SabotageTargetScope;
  /** Default duration in ms for time-based effects; null = instantaneous. */
  readonly durationMs: number | null;
}

/** One choice credit earned by completing a recipe; its definition is chosen on use. */
export interface Sabotage {
  readonly id: string;
  readonly definitionId: SabotageId | null;
  readonly acquiredAt: number;
  readonly usedAt: number | null;
}

/** Persisted application; serverNow is added when delivering it to clients. */
export interface SabotageApplication {
  id: string;
  definition: SabotageDefinition;
  sourcePlayerId: string;
  targetPlayerId: string | null;
  appliedAt: number;
  expiresAt: number | null;
  ingredientId: number | null;
}

export interface UseSabotagePayload {
  definitionId: string;
  targetPlayerId?: string;
}
