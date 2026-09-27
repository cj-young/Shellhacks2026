import assert from "node:assert/strict";
import { test } from "node:test";
import type { SpinType } from "../lib/types.ts";
import { doesPathCompleteSpin } from "./spin-path.ts";

const target: SpinType = {
  center: { x: 150, y: 150 },
  radius: 80,
  tolerance: 20,
  direction: "clockwise",
  rotations: 2,
};

function circle(rotations: number, sign = 1, start = 2.9) {
  return Array.from({ length: rotations * 100 + 1 }, (_, i) => {
    const angle = start + (sign * i * 2 * Math.PI) / 100;
    return { x: 150 + 80 * Math.cos(angle), y: 150 + 80 * Math.sin(angle) };
  });
}

test("counts full rotations across angle wraparound in the configured direction", () => {
  assert.equal(doesPathCompleteSpin(circle(2), target), true);
  assert.equal(doesPathCompleteSpin(circle(1), target), false);
  assert.equal(doesPathCompleteSpin(circle(2, -1), target), false);
  assert.equal(
    doesPathCompleteSpin(circle(2, -1), {
      ...target,
      direction: "counterclockwise",
    }),
    true,
  );
});

test("backtracking cannot accumulate rotations", () => {
  const arc = circle(0.25);
  const wiggles = Array.from({ length: 20 }, () => [
    ...arc,
    ...[...arc].reverse(),
  ]).flat();
  assert.equal(doesPathCompleteSpin(wiggles, target), false);
});

test("allows approaching the ring only when requested", () => {
  const path = [target.center, ...circle(2)];
  assert.equal(doesPathCompleteSpin(path, target), false);
  assert.equal(doesPathCompleteSpin(path, target, true), true);
});

test("rejects leaving the ring and shortcuts through the center", () => {
  const path = circle(2);
  path[50] = target.center;
  assert.equal(doesPathCompleteSpin(path, target, true), false);
  const opposite = [
    { x: 230, y: 150 },
    { x: 70, y: 150 },
  ];
  assert.equal(
    doesPathCompleteSpin([...opposite, ...circle(2)], target),
    false,
  );
});

test("completion persists within a drag and resets on an empty path", () => {
  assert.equal(
    doesPathCompleteSpin([...circle(2), target.center], target),
    true,
  );
  assert.equal(doesPathCompleteSpin([], target), false);
});

test("rejects invalid targets and nonfinite points", () => {
  for (const settings of [
    { rotations: 0 },
    { rotations: NaN },
    { radius: 0 },
    { tolerance: 80 },
    { tolerance: -1 },
  ]) {
    assert.equal(
      doesPathCompleteSpin(circle(2), { ...target, ...settings }),
      false,
    );
  }
  assert.equal(
    doesPathCompleteSpin([{ x: NaN, y: 150 }, ...circle(2)], target, true),
    false,
  );
});
