import assert from "node:assert/strict";
import { test } from "node:test";

import type { LineType, Point, SpinType } from "../lib/types.ts";
import {
  RECOGNIZER_TUNING,
  angleDelta,
  classifyStroke,
  distanceToSegment,
  expectedGesture,
  isDeliberateStroke,
  matchStage,
  pathLength,
} from "./gesture-recognizer.ts";
import type { GestureStage } from "./gesture-recognizer.ts";

/* ------------------------------- helpers -------------------------------- */

function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** `segments + 1` points along a straight line. */
function linePoints(a: Point, b: Point, segments = 60): Point[] {
  return Array.from({ length: segments + 1 }, (_, i) =>
    lerp(a, b, i / segments),
  );
}

/** Densely sampled points along a polyline through `corners`. */
function polylinePoints(corners: Point[], perSegment = 24): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < corners.length - 1; i++) {
    const segments = perSegment;
    for (let j = 0; j <= segments; j++) {
      if (i > 0 && j === 0) continue;
      points.push(lerp(corners[i], corners[i + 1], j / segments));
    }
  }
  return points;
}

/** Points around a circle. `sign` +1 is clockwise on screen (y down). */
function circlePoints(
  center: Point,
  radius: number,
  turns: number,
  sign = 1,
  start = -Math.PI / 2,
  stepsPerTurn = 120,
): Point[] {
  const total = turns * Math.PI * 2 * sign;
  const steps = Math.max(2, Math.round(turns * stepsPerTurn));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const angle = start + (total * i) / steps;
    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    };
  });
}

/** Deterministic low-frequency wobble, like an unsteady finger. */
function jitter(points: Point[], amplitude: number): Point[] {
  return points.map((point, i) => ({
    x: point.x + Math.sin(i * 0.4) * amplitude,
    y: point.y + Math.cos(i * 0.27) * amplitude,
  }));
}

const horizontal: LineType = {
  start: { x: 30, y: 100 },
  end: { x: 170, y: 100 },
  radius: 20,
};
const diagonal: LineType = {
  start: { x: 30, y: 30 },
  end: { x: 170, y: 170 },
  radius: 20,
};
// The exact four-segment zig-zag used by the real recipes.
const zigzag: LineType[] = [
  { start: { x: 30, y: 30 }, end: { x: 70, y: 170 }, radius: 20 },
  { start: { x: 70, y: 170 }, end: { x: 110, y: 30 }, radius: 20 },
  { start: { x: 110, y: 30 }, end: { x: 140, y: 170 }, radius: 20 },
  { start: { x: 140, y: 170 }, end: { x: 170, y: 30 }, radius: 20 },
];
const stir: SpinType = {
  center: { x: 100, y: 100 },
  radius: 70,
  tolerance: 30,
  direction: "clockwise",
  rotations: 1,
};

const lineStage = (line: LineType): GestureStage => ({
  type: "lines",
  lines: [line],
});
const zigzagStage = (): GestureStage => ({ type: "lines", lines: zigzag });
const stirStage = (spin: SpinType = stir): GestureStage => ({
  type: "spin",
  spins: [spin],
});

/* --------------------------- geometry helpers --------------------------- */

test("distanceToSegment handles midpoints, endpoints and zero-length segments", () => {
  const a = { x: 0, y: 0 };
  const b = { x: 100, y: 0 };
  assert.equal(distanceToSegment({ x: 50, y: 0 }, a, b), 0);
  assert.equal(distanceToSegment({ x: 50, y: 10 }, a, b), 10);
  assert.equal(distanceToSegment({ x: -10, y: 0 }, a, b), 10);
  assert.equal(distanceToSegment({ x: 110, y: 0 }, a, b), 10);
  assert.equal(distanceToSegment({ x: 3, y: 4 }, a, a), 5);
});

test("angleDelta compares undirected axes", () => {
  assert.ok(angleDelta(0, Math.PI - 0.01) < 0.02);
  assert.ok(Math.abs(angleDelta(0, Math.PI / 2) - Math.PI / 2) < 1e-9);
  assert.ok(angleDelta(0.1, 0.2) < 0.11);
});

/* ------------------------------- classify -------------------------------- */

test("classifyStroke recognizes a straight line", () => {
  const features = classifyStroke(linePoints(horizontal.start, horizontal.end));
  assert.equal(features.shape, "line");
  assert.equal(features.turns, 0);
  assert.ok(features.straightness > 0.98);
  assert.ok(features.pathLength > 0);
  assert.ok(Math.abs(angleDelta(features.angleRad, 0)) < 0.01);
});

test("classifyStroke tolerates a wobbly line", () => {
  const features = classifyStroke(
    jitter(linePoints(horizontal.start, horizontal.end), 6),
  );
  assert.equal(features.shape, "line");
});

test("classifyStroke counts zig-zag corners", () => {
  const features = classifyStroke(
    polylinePoints(zigzag.map((line) => line.start).concat(zigzag[3].end)),
  );
  assert.equal(features.shape, "zigzag");
  assert.equal(features.turns, 3);
});

test("classifyStroke detects loop direction and rotations", () => {
  const cw = classifyStroke(circlePoints(stir.center, stir.radius, 1.1, 1));
  assert.equal(cw.shape, "loop");
  assert.equal(cw.direction, "clockwise");
  assert.ok(cw.rotations > 1 && cw.rotations < 1.2);

  const ccw = classifyStroke(circlePoints(stir.center, stir.radius, 1.1, -1));
  assert.equal(ccw.shape, "loop");
  assert.equal(ccw.direction, "counterclockwise");
});

test("classifyStroke rejects tiny and malformed input", () => {
  assert.equal(classifyStroke([]).shape, "unknown");
  assert.equal(classifyStroke([{ x: 0, y: 0 }]).shape, "unknown");
  assert.equal(
    classifyStroke([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ]).shape,
    "unknown",
  );
  assert.equal(
    classifyStroke([
      { x: 0, y: 0 },
      { x: NaN, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ]).shape,
    "unknown",
  );
});

/* ------------------------------ expectedGesture -------------------------- */

test("expectedGesture reads a single line, a zig-zag and a stir", () => {
  assert.deepEqual(expectedGesture(lineStage(horizontal)), {
    kind: "line",
    angleRad: 0,
    lines: [horizontal],
  });

  assert.deepEqual(expectedGesture(zigzagStage()), {
    kind: "zigzag",
    angleRad: 0,
    turns: 3,
    lines: zigzag,
  });

  assert.deepEqual(expectedGesture(stirStage()), {
    kind: "loop",
    direction: "clockwise",
    rotations: 1,
    spins: [stir],
  });

  assert.equal(expectedGesture({ type: "lines", lines: [] }), null);
  assert.equal(expectedGesture({ type: "spin", spins: [] }), null);
});

/* --------------------------------- lines --------------------------------- */

test("matches a straight line in either drawing direction", () => {
  assert.equal(
    matchStage(
      linePoints(horizontal.start, horizontal.end),
      lineStage(horizontal),
    ).matched,
    true,
  );
  assert.equal(
    matchStage(
      linePoints(horizontal.end, horizontal.start),
      lineStage(horizontal),
    ).matched,
    true,
  );
});

test("matches a diagonal line and rejects a perpendicular scribble", () => {
  assert.equal(
    matchStage(linePoints(diagonal.start, diagonal.end), lineStage(diagonal))
      .matched,
    true,
  );
  assert.equal(
    matchStage(
      linePoints({ x: 30, y: 170 }, { x: 170, y: 30 }),
      lineStage(diagonal),
    ).matched,
    false,
  );
});

test("accepts a wobbly, overshooting line but rejects one that drifts away", () => {
  const wobbly = jitter(linePoints({ x: 10, y: 100 }, { x: 190, y: 104 }), 7);
  assert.equal(matchStage(wobbly, lineStage(horizontal)).matched, true);

  const drifted = linePoints({ x: 30, y: 220 }, { x: 170, y: 220 });
  assert.equal(matchStage(drifted, lineStage(horizontal)).matched, false);
});

test("rejects a zig-zag for a straight-line stage and vice versa", () => {
  const zigzagPoints = polylinePoints(
    zigzag.map((line) => line.start).concat(zigzag[3].end),
  );
  assert.equal(matchStage(zigzagPoints, lineStage(horizontal)).matched, false);
  assert.equal(
    matchStage(linePoints(horizontal.start, horizontal.end), zigzagStage())
      .matched,
    false,
  );
});

test("requires a line stroke to span the target and reach both ends", () => {
  // Covers only ~43% of the horizontal target.
  const partial = linePoints({ x: 30, y: 100 }, { x: 90, y: 100 });
  assert.equal(matchStage(partial, lineStage(horizontal)).matched, false);

  // Spans ~71% and misses the near end.
  const tail = linePoints({ x: 70, y: 100 }, { x: 170, y: 100 });
  assert.equal(matchStage(tail, lineStage(horizontal)).matched, false);

  // ~86% covered, far end within the band: just over the threshold.
  const nearlyFull = linePoints({ x: 30, y: 100 }, { x: 150, y: 100 });
  assert.equal(matchStage(nearlyFull, lineStage(horizontal)).matched, true);

  // The full line matches.
  assert.equal(
    matchStage(
      linePoints(horizontal.start, horizontal.end),
      lineStage(horizontal),
    ).matched,
    true,
  );
});

/* -------------------------------- zig-zags ------------------------------- */

test("requires a zig-zag stroke to span the target", () => {
  const corners = zigzag.map((line) => line.start).concat(zigzag[3].end);

  // Only the first three of four segments: too short to count.
  const partial = polylinePoints(corners.slice(0, 4));
  assert.equal(matchStage(partial, zigzagStage()).matched, false);

  // The full zig-zag matches.
  assert.equal(
    matchStage(polylinePoints(corners), zigzagStage()).matched,
    true,
  );
});

test("matches a zig-zag drawn between the target corners", () => {
  const points = polylinePoints(
    zigzag.map((line) => line.start).concat(zigzag[3].end),
  );
  assert.equal(matchStage(points, zigzagStage()).matched, true);
});

test("matches a zig-zag drawn with the corners rounded off", () => {
  const points = polylinePoints(
    zigzag.map((line) => line.start).concat(zigzag[3].end),
  );
  const rounded = points.map((point, i) => {
    const phase = Math.sin((i / points.length) * Math.PI * 4);
    return { x: point.x + phase * 5, y: point.y + Math.cos(i) * 5 };
  });
  const result = matchStage(rounded, zigzagStage());
  assert.equal(result.matched, true, `turns=${result.features?.turns}`);
});

/* --------------------------------- stirs --------------------------------- */

test("matches a clockwise stir and rejects the opposite direction", () => {
  const cw = circlePoints(stir.center, stir.radius, 1.1, 1);
  assert.equal(matchStage(cw, stirStage()).matched, true);

  const ccw = circlePoints(stir.center, stir.radius, 1.1, -1);
  assert.equal(matchStage(ccw, stirStage()).matched, false);

  const ccwStage = stirStage({ ...stir, direction: "counterclockwise" });
  assert.equal(matchStage(ccw, ccwStage).matched, true);
});

test("requires most of a multi-turn stir", () => {
  const multi = { ...stir, rotations: 3 }; // requires 3 × 0.8 = 2.4 turns

  const tooFew = circlePoints(stir.center, stir.radius, 1.05, 1);
  assert.equal(matchStage(tooFew, stirStage(multi)).matched, false);

  const enough = circlePoints(stir.center, stir.radius, 2.5, 1);
  assert.equal(matchStage(enough, stirStage(multi)).matched, true);
});

test("rejects a partial stir and a tiny scribble", () => {
  const partial = circlePoints(stir.center, stir.radius, 0.5, 1);
  assert.equal(matchStage(partial, stirStage()).matched, false);

  const scribble = linePoints({ x: 100, y: 100 }, { x: 110, y: 106 }, 3);
  assert.equal(matchStage(scribble, stirStage()).matched, false);
});

test("keeps rough proximity for stirs", () => {
  const tooFar = circlePoints(stir.center, stir.radius * 2.5, 1.1, 1);
  assert.equal(matchStage(tooFar, stirStage()).matched, false);

  const closer = circlePoints(stir.center, stir.radius * 0.5, 1.1, 1);
  assert.equal(matchStage(closer, stirStage()).matched, true);
});

test("ignores an approach from outside the target", () => {
  const approach = [
    ...linePoints(stir.center, { x: 100, y: 30 }, 10),
    ...circlePoints(stir.center, stir.radius, 1.1, 1),
  ];
  const result = matchStage(approach, stirStage());
  assert.equal(result.matched, true, `shape=${result.features?.shape}`);
});

test("rejects a loop drawn on a line stage", () => {
  const loop = circlePoints(stir.center, stir.radius, 1.1, 1);
  assert.equal(matchStage(loop, lineStage(horizontal)).matched, false);
});

/* ------------------- real recipes' geometry (scale checks) ---------------- */

test("matches a vertical line with a tiny guide radius", () => {
  // Pancakes "Crack the egg": (100,125)→(100,75), radius 5.
  const egg: LineType = {
    start: { x: 100, y: 125 },
    end: { x: 100, y: 75 },
    radius: 5,
  };
  const drawn = jitter(linePoints({ x: 101, y: 130 }, { x: 99, y: 70 }), 3);
  assert.equal(matchStage(drawn, lineStage(egg)).matched, true);
});

test("matches a short diagonal line", () => {
  // Cheeseburger "Slice the lettuce": (100,100)→(150,120), radius 20.
  const slice: LineType = {
    start: { x: 100, y: 100 },
    end: { x: 150, y: 120 },
    radius: 20,
  };
  assert.equal(
    matchStage(linePoints(slice.start, slice.end), lineStage(slice)).matched,
    true,
  );
});

test("matches a small stir with a generous band", () => {
  // Spaghetti "Roll a meatball": center (100,60), radius 30, 1 turn.
  const roll: SpinType = {
    center: { x: 100, y: 60 },
    radius: 30,
    tolerance: 20,
    direction: "clockwise",
    rotations: 1,
  };
  assert.equal(
    matchStage(circlePoints(roll.center, 30, 1.05, 1), stirStage(roll)).matched,
    true,
  );
});

test("matches a counterclockwise stir drawn at the guide size", () => {
  const flip: SpinType = {
    center: { x: 100, y: 100 },
    radius: 70,
    tolerance: 40,
    direction: "counterclockwise",
    rotations: 1,
  };
  assert.equal(
    matchStage(circlePoints(flip.center, 70, 1.05, -1), stirStage(flip))
      .matched,
    true,
  );
});

/* -------------------------------- scoring -------------------------------- */

test("returns a positive confidence for accepted gestures", () => {
  const result = matchStage(
    linePoints(horizontal.start, horizontal.end),
    lineStage(horizontal),
  );
  assert.equal(result.matched, true);
  assert.ok(result.confidence > 0 && result.confidence <= 1);
  assert.ok(result.features);
});

test("pathLength measures the traversed distance", () => {
  assert.equal(
    pathLength([
      { x: 0, y: 0 },
      { x: 3, y: 4 },
    ]),
    5,
  );
  assert.equal(pathLength([{ x: 10, y: 10 }]), 0);
});

/* --------------------------- deliberate strokes --------------------------- */

test("a deliberate stroke needs enough points and length", () => {
  assert.equal(isDeliberateStroke([]), false);
  assert.equal(isDeliberateStroke([{ x: 0, y: 0 }]), false);
  // A tap: plenty of (near-duplicate) points, no travel.
  assert.equal(
    isDeliberateStroke(Array.from({ length: 12 }, () => ({ x: 100, y: 100 }))),
    false,
  );
  // A small nudge below the recognizer's minimum path length.
  assert.equal(
    isDeliberateStroke([
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 16, y: 0 },
      { x: 20, y: 0 },
    ]),
    false,
  );
});

test("a long traced stroke is deliberate even if it does not match", () => {
  assert.equal(
    isDeliberateStroke(linePoints(horizontal.start, horizontal.end)),
    true,
  );
});

/** Widens the `as const` tuning values so the checks are not constant-folded. */
const within = (value: number, min: number, max: number) =>
  value >= min && value <= max;

test("tuning constants stay in a sane range", () => {
  assert.ok(within(RECOGNIZER_TUNING.rotationFraction, 0, 1));
  assert.ok(within(RECOGNIZER_TUNING.minRequiredRotations, 1, 10));
  assert.ok(within(RECOGNIZER_TUNING.proximityRequiredFraction, 0, 1));
  assert.ok(within(RECOGNIZER_TUNING.coverageRequiredFraction, 0, 1));
});
