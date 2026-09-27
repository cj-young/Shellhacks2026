import type { CursorPoint } from "./CursorPathTracker";

export type CutDetectorOptions = {
  /** Distance between direction samples, in px. */
  dirStepPx?: number;
  /** Turn from the last cut that counts as a new direction, in degrees. */
  turnDeg?: number;
  /** Settled direction within this of the last cut re-arms the detector. */
  rearmDeg?: number;
  /** Per-sample direction change still treated as "straight", in degrees. */
  stableDeg?: number;
  /** Straight run required before a cut (or re-arm), in px. */
  stablePx?: number;
  /** Minimum travel between cuts, in px. */
  minGapPx?: number;
  /** Travel before the first cut, in px. */
  minInitialPx?: number;
};

const DEFAULTS: Required<CutDetectorOptions> = {
  dirStepPx: 8,
  turnDeg: 60,
  rearmDeg: 30,
  stableDeg: 5,
  stablePx: 16,
  minGapPx: 12,
  minInitialPx: 16,
};

const SMOOTH_ALPHA = 0.4;
const TAU = Math.PI * 2;
const toRad = (deg: number) => (deg * Math.PI) / 180;

function wrapPi(angle: number): number {
  let a = angle % TAU;
  if (a > Math.PI) a -= TAU;
  if (a < -Math.PI) a += TAU;
  return a;
}

function angleDiff(a: number, b: number): number {
  return Math.abs(wrapPi(a - b));
}

function distance(a: CursorPoint, b: CursorPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Fires a "cut" each time a drawn stroke turns into a significantly different
 * direction — at the first movement and at every sharp turn — but never while
 * rounding. A curve keeps changing direction, so it never settles into the
 * "straight run" a cut (or a re-arm) requires; a corner settles right after.
 *
 * Feed it the live points each frame; it tracks how many it has already seen and
 * resets itself when the stroke clears.
 */
export class CutDetector {
  private readonly options: Required<CutDetectorOptions>;
  private seen = 0;
  private anchor: CursorPoint | null = null;
  private smoothed: number | null = null;
  private prevRaw: number | null = null;
  private reference: number | null = null;
  private stableRun = 0;
  private distSinceRef = 0;
  private distTotal = 0;
  private armed = false;

  constructor(options: CutDetectorOptions = {}) {
    this.options = { ...DEFAULTS, ...options };
  }

  reset(): void {
    this.seen = 0;
    this.anchor = null;
    this.smoothed = null;
    this.prevRaw = null;
    this.reference = null;
    this.stableRun = 0;
    this.distSinceRef = 0;
    this.distTotal = 0;
    this.armed = false;
  }

  /** Feeds new points from the live stroke; returns how many cuts just fired. */
  update(points: CursorPoint[]): number {
    if (points.length < this.seen) this.reset();
    if (points.length === 0 || points.length === this.seen) return 0;

    const {
      dirStepPx,
      turnDeg,
      rearmDeg,
      stableDeg,
      stablePx,
      minGapPx,
      minInitialPx,
    } = this.options;
    const turn = toRad(turnDeg);
    const rearm = toRad(rearmDeg);
    const stable = toRad(stableDeg);
    let cuts = 0;

    for (let i = this.seen; i < points.length; i++) {
      const point = points[i];
      if (!this.anchor) {
        this.anchor = point;
        continue;
      }

      const step = distance(this.anchor, point);
      if (step < dirStepPx) continue;

      const segment = Math.atan2(
        point.y - this.anchor.y,
        point.x - this.anchor.x,
      );
      this.anchor = point;
      this.smoothed =
        this.smoothed === null
          ? segment
          : this.smoothed + SMOOTH_ALPHA * wrapPi(segment - this.smoothed);

      // Stability is measured on the raw segments so smoothing cannot hide a
      // slow, steady curve (which must never count as straight).
      const settle =
        this.prevRaw === null ? 0 : angleDiff(segment, this.prevRaw);
      this.prevRaw = segment;
      if (settle <= stable) this.stableRun += step;
      else this.stableRun = 0;

      this.distSinceRef += step;
      this.distTotal += step;
      const isStable = this.stableRun >= stablePx;

      // First cut: once the stroke has moved and settled into a direction.
      if (this.reference === null) {
        if (isStable && this.distTotal >= minInitialPx) {
          cuts += 1;
          this.reference = this.smoothed;
          this.distSinceRef = 0;
          this.stableRun = 0;
          this.armed = false;
        }
        continue;
      }

      if (this.armed) {
        if (
          isStable &&
          this.distSinceRef >= minGapPx &&
          angleDiff(this.smoothed, this.reference) > turn
        ) {
          cuts += 1;
          this.reference = this.smoothed;
          this.distSinceRef = 0;
          this.stableRun = 0;
          this.armed = false;
        }
      } else if (isStable && angleDiff(this.smoothed, this.reference) < rearm) {
        // Direction settled close to the last cut: ready for the next turn.
        this.armed = true;
        this.reference = this.smoothed;
        this.distSinceRef = 0;
      }
    }

    this.seen = points.length;
    return cuts;
  }
}
