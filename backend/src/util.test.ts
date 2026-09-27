import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  generateRecipeOrder,
  getSabotageDefinition,
  listSabotageDefinitions,
} from "./util.ts";

test("generateRecipeOrder returns the requested number of recipes", () => {
  assert.equal(generateRecipeOrder(3).length, 3);
});

test("recipe stage ingredientsConsumed is a plain object that survives JSON encoding", () => {
  const consumed = generateRecipeOrder(100)
    .flatMap((recipe) => recipe.stages)
    .map((stage) => stage.ingredientsConsumed)
    .find((value) => Object.keys(value).length > 0);

  assert.ok(consumed, "expected at least one stage with consumed ingredients");
  assert.deepEqual(JSON.parse(JSON.stringify(consumed)), consumed);
});

test("getSabotageDefinition finds known ids and misses unknown ones", () => {
  const steal = getSabotageDefinition("steal");

  assert.ok(steal, "expected the steal definition");
  assert.equal(steal.id, "steal");
  assert.equal(steal.targetScope, "single");
  assert.equal(getSabotageDefinition("does-not-exist"), undefined);
});

test("sabotage definitions carry generic metadata", () => {
  const definitions = listSabotageDefinitions();

  assert.ok(definitions.length > 0, "expected some definitions");

  for (const definition of definitions) {
    assert.ok(definition.id.length > 0, "id should be set");
    assert.ok(definition.name.length > 0, "name should be set");
    assert.ok(["self", "single", "all"].includes(definition.targetScope));

    if (definition.durationMs !== null) {
      assert.ok(definition.durationMs > 0, "duration should be positive");
    }
  }
});
