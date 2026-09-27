import assert from "node:assert/strict";
import test from "node:test";
import {
  affectsPlayer,
  canTarget,
  effectRemaining,
  localizeSabotage,
  sabotageCredits,
} from "./sabotages.ts";
import type { SabotageAppliedPayload } from "./sabotages.ts";

const freeze: SabotageAppliedPayload = {
  id: "freeze-1",
  definition: {
    id: "freeze",
    name: "Freeze",
    description: "",
    targetScope: "single",
    durationMs: 10000,
  },
  sourcePlayerId: "ada",
  targetPlayerId: "jun",
  appliedAt: 900000,
  expiresAt: 910000,
  serverNow: 902000,
  ingredientId: null,
};

test("completed recipes grant saved choice credits, never stages or repeated state updates", () => {
  assert.equal(sabotageCredits(0, []), 0);
  assert.equal(sabotageCredits(1, []), 1);
  assert.equal(sabotageCredits(1, []), 1);
  assert.equal(sabotageCredits(4, ["a", "a", "b"]), 2);
  assert.equal(sabotageCredits(1, ["a", "b"]), 0);
});

test("server clock skew and elapsed duration are accounted for; expiry clears locally", () => {
  const effect = localizeSabotage(freeze, 1000);
  assert.equal(effect.localExpiresAt, 9000);
  assert.equal(effectRemaining([effect], "freeze", "jun", 1000), 8000);
  assert.equal(effectRemaining([effect], "freeze", "jun", 9000), 0);
  assert.equal(effectRemaining([effect], "freeze", "jun", 10000), 0);
  assert.equal(effectRemaining([effect], "freeze", "ada", 1000), 0);
});

test("overlapping freezes last until the latest expiry even with out-of-order broadcasts", () => {
  const long = localizeSabotage(freeze, 1000);
  const short = localizeSabotage(
    { ...freeze, id: "freeze-2", expiresAt: 904000 },
    1000,
  );
  assert.equal(effectRemaining([long, short], "freeze", "jun", 4000), 5000);
  assert.equal(effectRemaining([short, long], "freeze", "jun", 4000), 5000);
});

test("blackout affects everyone, including its sender; single and self scopes are isolated", () => {
  assert.equal(affectsPlayer(freeze, "ada"), false);
  assert.equal(affectsPlayer(freeze, "jun"), true);
  const blackout = {
    ...freeze,
    targetPlayerId: null,
    definition: {
      ...freeze.definition,
      id: "blackout",
      targetScope: "all" as const,
    },
  };
  assert.equal(affectsPlayer(blackout, "ada"), true);
  assert.equal(affectsPlayer(blackout, "jun"), true);
  assert.equal(affectsPlayer(blackout, null), false);
  const self = {
    ...freeze,
    definition: { ...freeze.definition, targetScope: "self" as const },
  };
  assert.equal(affectsPlayer(self, "ada"), true);
  assert.equal(affectsPlayer(self, "jun"), false);
});

test("instant inventory events have a temporary notice but never a blocking timer", () => {
  const instant = localizeSabotage(
    {
      ...freeze,
      expiresAt: null,
      ingredientId: 5,
      definition: { ...freeze.definition, id: "steal", durationMs: null },
    },
    1000,
  );
  assert.equal(instant.localExpiresAt, null);
  assert.equal(instant.noticeUntil, 5500);
  assert.equal(effectRemaining([instant], "steal", "jun", 1000), 0);
});

test("steal and trash need an unused ingredient, while freeze can target an empty inventory", () => {
  for (const id of ["steal", "trash"]) {
    assert.equal(canTarget(id, {}), false);
    assert.equal(canTarget(id, { 5: 0 }), false);
    assert.equal(canTarget(id, { 5: 1 }), true);
  }
  assert.equal(canTarget("freeze", {}), true);
});
