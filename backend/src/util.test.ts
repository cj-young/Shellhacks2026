import { strict as assert } from "node:assert";
import { test } from "node:test";

import { generateRecipeOrder } from "./util.ts";

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
