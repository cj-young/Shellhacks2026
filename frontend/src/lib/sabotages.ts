/** Frontend mirror of the sabotage messages in backend/asyncapi.yaml. */
export type SabotageDefinition = {
  id: string;
  name: string;
  description: string;
  targetScope: "self" | "single" | "all";
  durationMs: number | null;
};

export type UseSabotagePayload = {
  definitionId: string;
  targetPlayerId?: string;
};

export type SabotageAppliedPayload = {
  id: string;
  definition: SabotageDefinition;
  sourcePlayerId: string;
  targetPlayerId: string | null;
  appliedAt: number;
  expiresAt: number | null;
  serverNow: number;
  ingredientId: number | null;
};

export type SabotageEffect = SabotageAppliedPayload & {
  localExpiresAt: number | null;
  noticeUntil: number;
};

/** How long a sabotage announcement stays on screen after it arrives. */
export const NOTICE_MS = 4500;

export function localizeSabotage(
  payload: SabotageAppliedPayload,
  now: number,
): SabotageEffect {
  return {
    ...payload,
    localExpiresAt:
      payload.expiresAt === null
        ? null
        : now + payload.expiresAt - payload.serverNow,
    noticeUntil: now + NOTICE_MS,
  };
}

export function affectsPlayer(
  effect: SabotageAppliedPayload,
  playerId: string | null,
) {
  if (!playerId) return false;
  if (effect.definition.targetScope === "all") return true;
  return (
    (effect.definition.targetScope === "self"
      ? effect.sourcePlayerId
      : effect.targetPlayerId) === playerId
  );
}

export function effectRemaining(
  effects: SabotageEffect[],
  definitionId: string,
  playerId: string | null,
  now: number,
) {
  return Math.max(
    0,
    ...effects
      .filter(
        (effect) =>
          effect.definition.id === definitionId &&
          affectsPlayer(effect, playerId),
      )
      .map((effect) => (effect.localExpiresAt ?? now) - now),
  );
}

/** Server-confirmed recipe progress grants credits; duplicate updates cannot grant twice. */
export function sabotageCredits(recipeIndex: number, spentIds: string[]) {
  return Math.max(0, recipeIndex - new Set(spentIds).size);
}

export function canTarget(
  definitionId: string,
  inventory: Record<number, number>,
) {
  return (
    !["steal", "trash"].includes(definitionId) ||
    Object.values(inventory).some((count) => count > 0)
  );
}
