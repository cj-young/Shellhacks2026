import assert from "node:assert/strict";
import test from "node:test";

import { CutDetector } from "./knife-cuts.ts";
import type { CursorPoint } from "./CursorPathTracker";

function lerp(a: CursorPoint, b: CursorPoint, t: number): CursorPoint {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** `segments + 1` points along a straight line. */
function linePoints(
  a: CursorPoint,
  b: CursorPoint,
  segments = 60,
): CursorPoint[] {
  return Array.from({ length: segments + 1 }, (_, i) =>
    lerp(a, b, i / segments),
  );
}

/** Densely sampled points along a polyline through `corners`. */
function polylinePoints(
  corners: CursorPoint[],
  perSegment = 48,
): CursorPoint[] {
  const points: CursorPoint[] = [];
  for (let i = 0; i < corners.length - 1; i++) {
    for (let j = 0; j <= perSegment; j++) {
      if (i > 0 && j === 0) continue;
      points.push(lerp(corners[i], corners[i + 1], j / perSegment));
    }
  }
  return points;
}

/** Points around a circle. */
function circlePoints(
  center: CursorPoint,
  radius: number,
  turns: number,
  stepsPerTurn = 240,
): CursorPoint[] {
  const steps = Math.max(2, Math.round(turns * stepsPerTurn));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * turns * i) / steps;
    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    };
  });
}

/** Deterministic low-frequency wobble, like an unsteady finger. */
function jitter(points: CursorPoint[], amplitude: number): CursorPoint[] {
  return points.map((point, i) => ({
    x: point.x + Math.sin(i * 0.4) * amplitude,
    y: point.y + Math.cos(i * 0.27) * amplitude,
  }));
}

/** A straight run, a rounded 90° corner, then another straight run. */
function roundedCorner(): CursorPoint[] {
  const points: CursorPoint[] = [];
  for (let x = 0; x <= 100; x += 4) points.push({ x, y: 50 });
  const cx = 100;
  const cy = 60;
  const r = 10;
  for (let a = -90; a <= 0; a += 4) {
    const rad = (a * Math.PI) / 180;
    points.push({ x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) });
  }
  for (let y = 60; y <= 160; y += 4) points.push({ x: 110, y });
  return points;
}

test("a straight swipe cuts once, at first movement", () => {
  const detector = new CutDetector();
  assert.equal(
    detector.update(linePoints({ x: 0, y: 0 }, { x: 140, y: 0 })),
    1,
  );
});

test("feeding the same points again does not re-fire", () => {
  const detector = new CutDetector();
  const points = linePoints({ x: 0, y: 0 }, { x: 140, y: 0 });
  assert.equal(detector.update(points), 1);
  assert.equal(detector.update(points), 0);
});

test("a four-segment zig-zag cuts once per segment", () => {
  const detector = new CutDetector();
  const zigzag = polylinePoints([
    { x: 20, y: 20 },
    { x: 165, y: 20 },
    { x: 165, y: 165 },
    { x: 20, y: 165 },
    { x: 20, y: 310 },
  ]);
  assert.equal(detector.update(zigzag), 4);
});

test("a rounded 90-degree corner adds exactly one cut", () => {
  const detector = new CutDetector();
  // First straight (1 cut) + corner (1 cut) = 2, never more through the arc.
  assert.equal(detector.update(roundedCorner()), 2);
});

test("a jittery straight line still cuts once", () => {
  const detector = new CutDetector();
  const line = jitter(linePoints({ x: 0, y: 0 }, { x: 140, y: 0 }), 1.5);
  assert.equal(detector.update(line), 1);
});

test("rounding never cuts, even all the way around", () => {
  for (const [radius, turns] of [
    [20, 1],
    [20, 5],
    [70, 1],
    [70, 5],
  ] as const) {
    const detector = new CutDetector();
    assert.equal(
      detector.update(circlePoints({ x: 100, y: 100 }, radius, turns)),
      0,
      `radius ${radius}, ${turns} turn(s)`,
    );
  }
});

test("resetting starts a fresh stroke", () => {
  const detector = new CutDetector();
  const points = linePoints({ x: 0, y: 0 }, { x: 140, y: 0 });
  assert.equal(detector.update(points), 1);
  detector.reset();
  assert.equal(detector.update(points), 1);
});

test("a cleared stroke resets the detector", () => {
  const detector = new CutDetector();
  assert.equal(
    detector.update(linePoints({ x: 0, y: 0 }, { x: 140, y: 0 })),
    1,
  );
  assert.equal(detector.update([]), 0);
  assert.equal(
    detector.update(linePoints({ x: 0, y: 0 }, { x: 140, y: 0 })),
    1,
  );
});
