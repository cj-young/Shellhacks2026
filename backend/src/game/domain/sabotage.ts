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

/** A concrete sabotage instance held by a player. */
export interface Sabotage {
  readonly id: string;
  readonly definitionId: SabotageId;
  readonly acquiredAt: number;
  readonly usedAt: number | null;
}
