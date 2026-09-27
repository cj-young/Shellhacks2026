import type { LineType, Point, SpinDirection, SpinType } from "../lib/types.ts";

/**
 * Magic-Cat-Academy-style gesture classification.
 *
 * The doodle recognizer is a small hand-tuned geometric feature tree over a
 * single stroke (path length vs. bounding box, aspect ratio, direction
 * reversals, and angles), not exact tracing. This module follows the same idea
 * and adds the two things our game needs on top of it:
 *
 *  - a rough proximity check, so the stroke has to be near the stage target
 *    (unlike the doodle, which accepts a symbol anywhere), and
 *  - an explicit loop direction / capped rotation requirement for stirs.
 *
 * Coordinates are in the recipe's gesture space (roughly 0–200px), the same
 * space `CursorPathTracker` reports its points in.
 */

export type GestureShape = "line" | "zigzag" | "loop" | "unknown";

/** A stage as far as recognition is concerned (no ingredients/images needed). */
export type GestureStage =
  { type: "lines"; lines: LineType[] } | { type: "spin"; spins: SpinType[] };

export type StrokeFeatures = {
  shape: GestureShape;
  pointCount: number;
  /** Total distance travelled by the stroke. */
  pathLength: number;
  /** Straight-line distance from the first to the last point. */
  chord: number;
  /** Length of the stroke's bounding-box diagonal. */
  diagonal: number;
  /** chord / pathLength; 1 is perfectly straight. */
  straightness: number;
  /** Dominant axis of the stroke in `[0, π)`. */
  angleRad: number;
  /** Number of corners found by polyline simplification. */
  turns: number;
  /** Net signed turning in radians (clockwise positive on screen). */
  signedTurnRad: number;
  /** Loop direction from the sign of the net turning, or null when flat. */
  direction: SpinDirection | null;
  /** Completed turns: `|signedTurnRad| / 2π`. */
  rotations: number;
};

export type ExpectedGesture =
  | { kind: "line"; angleRad: number; lines: LineType[] }
  | {
      kind: "zigzag";
      angleRad: number;
      turns: number;
      lines: LineType[];
    }
  | {
      kind: "loop";
      direction: SpinDirection;
      rotations: number;
      spins: SpinType[];
    };

export type GestureMatch = {
  matched: boolean;
  confidence: number;
  /** Features of the trimmed stroke, or null when nothing could be scored. */
  features: StrokeFeatures | null;
};

/** Line/zig-zag expectations (the ones with a target path to cover). */
type PathGesture = Extract<ExpectedGesture, { kind: "line" | "zigzag" }>;

const TAU = Math.PI * 2;
const deg = (value: number) => (value * Math.PI) / 180;

/**
 * Tuning for the classifier. Values are deliberately generous: the goal is to
 * accept wobbly, imprecise finger strokes while still rejecting the wrong
 * shape or a stroke drawn somewhere else on the card.
 */
export const RECOGNIZER_TUNING = {
  /** Strokes shorter than this (in points) are ignored. */
  minPoints: 4,
  /** Points used for the smoothed feature pass. */
  samplePoints: 32,
  /** Reject tiny scribbles. */
  minPathLength: 26,
  minDiagonal: 16,
  /** A stroke at least this straight and with few corners is a "line". */
  straightnessForLine: 0.62,
  /** A stroke with corners at least this straight is still treated as a line. */
  zigzagStraightnessMax: 0.82,
  /** Line/zigzag axis must be within this of the target, either direction. */
  lineAngleTolerance: deg(38),
  zigzagAngleTolerance: deg(42),
  /** Accepted corner-count difference for a zigzag. */
  turnTolerance: 1,
  /** Ramer–Douglas–Peucker tolerance = max(min, scale × diagonal). */
  rdpToleranceScale: 0.13,
  rdpMinTolerance: 4,
  /** Net turning needed before a stroke counts as a loop. */
  loopMinRotations: 0.9,
  /**
   * A loop's net turning must dominate its absolute turning (a straight wobbly
   * line has lots of turning but little *net* turning).
   */
  loopNetRatio: 0.6,
  /** Points used for the moving-average smoothing pass. */
  smoothingWindow: 5,
  /**
   * Turns required to satisfy a stir, as a fraction of the stage's configured
   * rotations, never below `minRequiredRotations`. So 1→1, 3→2.4, 5→4.
   */
  rotationFraction: 0.8,
  minRequiredRotations: 1,
  /** Loop proximity band, as a fraction of the target radius. */
  loopBandInnerScale: 0.3,
  loopBandOuterScale: 2,
  /** Target proximity band = max(radius × scale, padding), in px. */
  proximityRadiusScale: 1.6,
  proximityPadding: 30,
  /** Fraction of the trimmed stroke that must stay inside the band. */
  proximityRequiredFraction: 0.8,
  /** Fraction of the target line/zig-zag the stroke must span. */
  coverageRequiredFraction: 0.8,
} as const;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export function pathLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += distance(points[i - 1], points[i]);
  }
  return total;
}

/** Shortest distance from `point` to the finite segment `a`–`b`. */
export function distanceToSegment(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return distance(point, a);

  const t = clamp01(
    ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared,
  );
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

function distanceToPolyline(point: Point, lines: LineType[]): number {
  let best = Infinity;
  for (const line of lines) {
    best = Math.min(best, distanceToSegment(point, line.start, line.end));
  }
  return best;
}

/** Normalizes an angle to `[0, π)`. */
function normalizeHalfTurn(angle: number): number {
  const wrapped = angle % Math.PI;
  return wrapped < 0 ? wrapped + Math.PI : wrapped;
}

/** Smallest difference between two axes, in `[0, π/2]`. */
export function angleDelta(a: number, b: number): number {
  let d = Math.abs(normalizeHalfTurn(a) - normalizeHalfTurn(b)) % Math.PI;
  if (d > Math.PI / 2) d = Math.PI - d;
  return d;
}

function isFinitePoint(point: Point): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

/** Drops non-finite and (nearly) duplicate consecutive points. */
function cleanPoints(points: Point[]): Point[] {
  const out: Point[] = [];
  for (const point of points) {
    if (!isFinitePoint(point)) continue;
    if (out.length > 0 && distance(out[out.length - 1], point) < 0.5) continue;
    out.push({ x: point.x, y: point.y });
  }
  return out;
}

/** Uniform arc-length resampling (the $1 recognizer's first step). */
function resample(points: Point[], count: number): Point[] {
  if (points.length <= 1) return points.slice();

  const interval = pathLength(points) / (count - 1);
  if (!(interval > 0)) return [{ ...points[0] }];

  const work = points.map((point) => ({ x: point.x, y: point.y }));
  const out: Point[] = [{ ...work[0] }];
  let accumulated = 0;

  for (let i = 1; i < work.length; i++) {
    const segment = distance(work[i - 1], work[i]);
    if (segment <= 0) continue;

    if (accumulated + segment >= interval) {
      const t = (interval - accumulated) / segment;
      const inserted = {
        x: work[i - 1].x + t * (work[i].x - work[i - 1].x),
        y: work[i - 1].y + t * (work[i].y - work[i - 1].y),
      };
      out.push(inserted);
      work.splice(i, 0, inserted);
      accumulated = 0;
      // The count-th sample lands exactly on the stroke's end.
      if (out.length >= count) break;
    } else {
      accumulated += segment;
    }
  }

  if (out.length === count - 1) {
    const last = points[points.length - 1];
    out.push({ x: last.x, y: last.y });
  }
  while (out.length < count) {
    const last = out[out.length - 1];
    out.push({ x: last.x, y: last.y });
  }
  return out.slice(0, count);
}

/** Ramer–Douglas–Peucker polyline simplification. */
function simplify(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) return points.slice();

  const first = points[0];
  const last = points[points.length - 1];
  let maxDistance = 0;
  let index = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const d = distanceToSegment(points[i], first, last);
    if (d > maxDistance) {
      maxDistance = d;
      index = i;
    }
  }

  if (maxDistance > epsilon) {
    const left = simplify(points.slice(0, index + 1), epsilon);
    const right = simplify(points.slice(index), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
}

/** Moving-average smoothing; endpoints are kept. */
function smooth(points: Point[], window: number): Point[] {
  if (points.length < 3 || window < 3) return points.slice();
  const half = Math.floor(window / 2);
  return points.map((_, i) => {
    let sumX = 0;
    let sumY = 0;
    let count = 0;
    for (
      let j = Math.max(0, i - half);
      j <= Math.min(points.length - 1, i + half);
      j++
    ) {
      sumX += points[j].x;
      sumY += points[j].y;
      count += 1;
    }
    return { x: sumX / count, y: sumY / count };
  });
}

/** Net and absolute turning through the stroke, in radians. */
function turning(points: Point[]): { signed: number; absolute: number } {
  let signed = 0;
  let absolute = 0;
  for (let i = 2; i < points.length; i++) {
    const ax = points[i - 1].x - points[i - 2].x;
    const ay = points[i - 1].y - points[i - 2].y;
    const bx = points[i].x - points[i - 1].x;
    const by = points[i].y - points[i - 1].y;
    const cross = ax * by - ay * bx;
    const dot = ax * bx + ay * by;
    const delta = Math.atan2(cross, dot);
    signed += delta;
    absolute += Math.abs(delta);
  }
  return { signed, absolute };
}

/**
 * Dominant axis of the stroke, normalized to `[0, π)`. Uses the open
 * first→last chord (matching how a target's axis is derived) and only falls
 * back to the longest point-to-point span for closed shapes.
 */
function dominantAngle(
  points: Point[],
  chord: number,
  diagonal: number,
): number {
  const first = points[0];
  const last = points[points.length - 1];
  if (diagonal > 0 && chord >= 0.25 * diagonal) {
    return normalizeHalfTurn(Math.atan2(last.y - first.y, last.x - first.x));
  }

  let best = 0;
  let bestSquared = -1;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[j].x - points[i].x;
      const dy = points[j].y - points[i].y;
      const squared = dx * dx + dy * dy;
      if (squared > bestSquared) {
        bestSquared = squared;
        best = Math.atan2(dy, dx);
      }
    }
  }
  return normalizeHalfTurn(best);
}

function unknownFeatures(pointCount: number): StrokeFeatures {
  return {
    shape: "unknown",
    pointCount,
    pathLength: 0,
    chord: 0,
    diagonal: 0,
    straightness: 0,
    angleRad: 0,
    turns: 0,
    signedTurnRad: 0,
    direction: null,
    rotations: 0,
  };
}

/** Extracts the shape features used to classify and score a stroke. */
export function classifyStroke(input: Point[]): StrokeFeatures {
  const points = cleanPoints(input);
  if (points.length < RECOGNIZER_TUNING.minPoints) {
    return unknownFeatures(points.length);
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  const length = pathLength(points);
  const diagonal = Math.hypot(maxX - minX, maxY - minY);
  const chord = distance(points[0], points[points.length - 1]);
  const straightness = length > 0 ? chord / length : 0;

  const sampled = resample(points, RECOGNIZER_TUNING.samplePoints);
  const smoothed = smooth(sampled, RECOGNIZER_TUNING.smoothingWindow);
  // Rotations are measured on the raw resample (smoothing clips corners and
  // under-counts full turns); shape discrimination uses the smoothed pass.
  const rawTurn = turning(sampled);
  const smoothTurn = turning(smoothed);
  const rotations = Math.abs(rawTurn.signed) / TAU;
  const direction =
    rawTurn.signed > 0
      ? "clockwise"
      : rawTurn.signed < 0
        ? "counterclockwise"
        : null;

  const epsilon = Math.max(
    RECOGNIZER_TUNING.rdpMinTolerance,
    diagonal * RECOGNIZER_TUNING.rdpToleranceScale,
  );
  const turns = Math.max(0, simplify(smoothed, epsilon).length - 2);

  const loopLike =
    Math.abs(smoothTurn.signed) / TAU >= RECOGNIZER_TUNING.loopMinRotations &&
    smoothTurn.absolute > 0 &&
    Math.abs(smoothTurn.signed) >=
      RECOGNIZER_TUNING.loopNetRatio * smoothTurn.absolute;

  let shape: GestureShape;
  if (loopLike) {
    shape = "loop";
  } else if (
    turns >= 1 &&
    straightness < RECOGNIZER_TUNING.zigzagStraightnessMax
  ) {
    shape = "zigzag";
  } else if (straightness >= RECOGNIZER_TUNING.straightnessForLine) {
    shape = "line";
  } else {
    shape = "unknown";
  }

  return {
    shape,
    pointCount: points.length,
    pathLength: length,
    chord,
    diagonal,
    straightness,
    angleRad: dominantAngle(smoothed, chord, diagonal),
    turns,
    signedTurnRad: rawTurn.signed,
    direction,
    rotations,
  };
}

/** What shape a stage's geometry expects. */
export function expectedGesture(stage: GestureStage): ExpectedGesture | null {
  if (stage.type === "spin") {
    const spin = stage.spins.at(0);
    if (!spin) return null;
    return {
      kind: "loop",
      direction: spin.direction,
      rotations: spin.rotations,
      spins: stage.spins,
    };
  }

  const lines = stage.lines;
  if (lines.length === 0) return null;
  if (lines.length === 1) {
    return {
      kind: "line",
      angleRad: normalizeHalfTurn(
        Math.atan2(
          lines[0].end.y - lines[0].start.y,
          lines[0].end.x - lines[0].start.x,
        ),
      ),
      lines,
    };
  }

  const first = lines[0].start;
  const last = lines[lines.length - 1].end;
  return {
    kind: "zigzag",
    angleRad: normalizeHalfTurn(Math.atan2(last.y - first.y, last.x - first.x)),
    turns: lines.length - 1,
    lines,
  };
}

type Proximity = { core: Point[]; fraction: number };

/** Trims the leading approach and measures how much of the rest stays near. */
function coreFrom(
  points: Point[],
  isInside: (point: Point) => boolean,
): Proximity | null {
  let start = -1;
  for (let i = 0; i < points.length; i++) {
    if (isInside(points[i])) {
      start = i;
      break;
    }
  }
  if (start === -1) return null;

  const core = points.slice(start);
  let insideCount = 0;
  for (const point of core) {
    if (isInside(point)) insideCount += 1;
  }
  return { core, fraction: insideCount / core.length };
}

/** Proximity band for line/zig-zag targets, in pixels. */
function proximityBand(expected: PathGesture): number {
  const radius = Math.max(...expected.lines.map((line) => line.radius));
  return Math.max(
    radius * RECOGNIZER_TUNING.proximityRadiusScale,
    RECOGNIZER_TUNING.proximityPadding + (expected.kind === "zigzag" ? 6 : 0),
  );
}

/**
 * How much of the target path the stroke spans, as a fraction of its total
 * length. Each in-band stroke point is projected onto the nearest target
 * segment and mapped to an arc-length position; the span between the smallest
 * and largest positions is the coverage. This is direction-agnostic and very
 * hard to satisfy without actually tracing the target.
 */
function pathCoverage(
  points: Point[],
  expected: PathGesture,
  allowed: number,
): number {
  let total = 0;
  for (const segment of expected.lines) {
    total += distance(segment.start, segment.end);
  }
  if (!(total > 0)) return 0;

  let minPosition = Infinity;
  let maxPosition = -Infinity;
  let base = 0;

  for (const segment of expected.lines) {
    const dx = segment.end.x - segment.start.x;
    const dy = segment.end.y - segment.start.y;
    const lengthSquared = dx * dx + dy * dy;
    const length = Math.sqrt(lengthSquared);

    for (const point of points) {
      if (distanceToSegment(point, segment.start, segment.end) > allowed) {
        continue;
      }
      const t =
        lengthSquared === 0
          ? 0
          : clamp01(
              ((point.x - segment.start.x) * dx +
                (point.y - segment.start.y) * dy) /
                lengthSquared,
            );
      const position = base + t * length;
      if (position < minPosition) minPosition = position;
      if (position > maxPosition) maxPosition = position;
    }
    base += length;
  }

  if (!Number.isFinite(minPosition) || !Number.isFinite(maxPosition)) return 0;
  return Math.max(0, (maxPosition - minPosition) / total);
}

/** Whether the stroke comes within the band of both target endpoints. */
function endpointsReached(
  points: Point[],
  expected: PathGesture,
  allowed: number,
): boolean {
  const first = expected.lines[0].start;
  const last = expected.lines[expected.lines.length - 1].end;
  return (
    points.some((point) => distance(point, first) <= allowed) &&
    points.some((point) => distance(point, last) <= allowed)
  );
}

function stageProximity(
  points: Point[],
  expected: ExpectedGesture,
): Proximity | null {
  if (expected.kind === "loop") {
    const spin = expected.spins.at(0);
    if (!spin) return null;
    const inner = spin.radius * RECOGNIZER_TUNING.loopBandInnerScale;
    const outer = spin.radius * RECOGNIZER_TUNING.loopBandOuterScale;
    return coreFrom(points, (point) => {
      const d = distance(point, spin.center);
      return d >= inner && d <= outer;
    });
  }

  const allowed = proximityBand(expected);
  return coreFrom(
    points,
    (point) => distanceToPolyline(point, expected.lines) <= allowed,
  );
}

function noMatch(features: StrokeFeatures | null = null): GestureMatch {
  return { matched: false, confidence: 0, features };
}

function pass(confidence: number, features: StrokeFeatures): GestureMatch {
  return { matched: true, confidence: clamp01(confidence), features };
}

/**
 * Scores the currently drawn stroke against a stage. Continuous and forgiving:
 * it matches as soon as shape, orientation, rough proximity and (for stirs)
 * the capped rotation requirement are satisfied.
 */
export function matchStage(points: Point[], stage: GestureStage): GestureMatch {
  const expected = expectedGesture(stage);
  if (!expected) return noMatch();

  const clean = cleanPoints(points);
  if (clean.length < RECOGNIZER_TUNING.minPoints) return noMatch();

  const proximity = stageProximity(clean, expected);
  if (!proximity) return noMatch();

  const features = classifyStroke(proximity.core);
  if (features.shape === "unknown") return noMatch(features);
  if (
    features.diagonal < RECOGNIZER_TUNING.minDiagonal ||
    features.pathLength < RECOGNIZER_TUNING.minPathLength
  ) {
    return noMatch(features);
  }
  if (proximity.fraction < RECOGNIZER_TUNING.proximityRequiredFraction) {
    return noMatch(features);
  }

  // Line/zig-zag stages must actually trace (most of) the target path.
  let coverage = 1;
  if (expected.kind !== "loop") {
    const allowed = proximityBand(expected);
    coverage = pathCoverage(clean, expected, allowed);
    if (coverage < RECOGNIZER_TUNING.coverageRequiredFraction) {
      return noMatch(features);
    }
    if (!endpointsReached(clean, expected, allowed)) return noMatch(features);
  }

  if (expected.kind === "line") {
    if (features.shape !== "line") return noMatch(features);
    const delta = angleDelta(features.angleRad, expected.angleRad);
    if (delta > RECOGNIZER_TUNING.lineAngleTolerance) return noMatch(features);
    return pass(
      proximity.fraction *
        coverage *
        (1 - delta / RECOGNIZER_TUNING.lineAngleTolerance) *
        clamp01(features.straightness),
      features,
    );
  }

  if (expected.kind === "zigzag") {
    if (features.shape !== "zigzag") return noMatch(features);
    if (
      Math.abs(features.turns - expected.turns) >
      RECOGNIZER_TUNING.turnTolerance
    ) {
      return noMatch(features);
    }
    const delta = angleDelta(features.angleRad, expected.angleRad);
    if (delta > RECOGNIZER_TUNING.zigzagAngleTolerance)
      return noMatch(features);
    return pass(
      proximity.fraction *
        coverage *
        (1 - delta / RECOGNIZER_TUNING.zigzagAngleTolerance) *
        (1 -
          Math.abs(features.turns - expected.turns) /
            (RECOGNIZER_TUNING.turnTolerance + 1)),
      features,
    );
  }

  // Loop / stir: require most of the stage's configured rotations.
  if (features.shape !== "loop") return noMatch(features);
  if (features.direction !== expected.direction) return noMatch(features);
  const required = Math.max(
    RECOGNIZER_TUNING.minRequiredRotations,
    expected.rotations * RECOGNIZER_TUNING.rotationFraction,
  );
  if (features.rotations < required) return noMatch(features);
  return pass(
    proximity.fraction * clamp01(features.rotations / required),
    features,
  );
}
