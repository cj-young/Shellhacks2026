import type { Gesture } from "./menu";
import type { Station } from "./recipe-steps";

/**
 * The sound registry.
 *
 * This is the one file to edit to plug audio into the game: drop a file under
 * `public/assets/audio/` and add a line here. Every entry is optional, so
 * anything you leave out is simply silent — you only register the sounds you
 * actually have.
 *
 * Keys are resolved most-specific first (see `src/audio/resolve.ts`):
 *   - gestures:  `gesture.success.<chop|stir|flip|pour|scoop|plate>` → `gesture.success`
 *   - stages:    `stage:<recipe name>:<stage index>` → the gesture key above
 *   - ambience:  `ambient.<board|bowl|pan|pot|plate>` → `ambient.default`
 *   - everything else is an exact key (see `SoundEvent`).
 */

export type SoundChannel = "music" | "ambient" | "sfx";

export type SoundDef = {
  /** Path to the audio file, e.g. `/assets/audio/chop.mp3`. Missing files are a silent no-op. */
  src: string;
  /** Per-cue trim, 0–1. Channel volume and mute are applied on top. */
  volume?: number;
  /** Playback speed; 1 is normal. */
  rate?: number;
  /** Random ± pitch wobble for one-shots (0–1) so repeats don't sound stale. */
  pitchJitter?: number;
  /** Minimum ms between plays of this cue; extra plays inside the window are dropped. */
  minGapMs?: number;
  /** Fade in/out time for ambient loops, in ms. */
  fadeMs?: number;
};

/** Known event keys (autocomplete). Free-form `stage:` overrides are also allowed. */
export type SoundEvent =
  | "music.game"
  | "round.countdown"
  | "round.go"
  | "round.timesup"
  | "round.leaderboard"
  | "gesture.success"
  | `gesture.success.${Gesture}`
  | "gesture.fail"
  | "knife"
  | "knife.chop"
  | "knife.slice"
  | "ambient.default"
  | `ambient.${Station}`
  | "ui.take"
  | "ui.remove"
  | "ui.aisle"
  | "ui.checkout"
  | "ui.trash"
  | "recipe.complete"
  | "recipe.new"
  | "sabotage.steal"
  | "sabotage.freeze"
  | "sabotage.blackout"
  | "sabotage.applied"
  | "sabotage.notice";

/** Any registry key: the known events plus arbitrary overrides. */
export type SoundKey = SoundEvent | (string & {});

export type SoundTable = Partial<Record<SoundEvent, SoundDef>> & {
  [key: string]: SoundDef | undefined;
};

/**
 * Register sounds here. Examples (all commented out — nothing plays until you
 * add a line and the matching file):
 *
 *   "music.game":          { src: "/assets/audio/main-theme.mp3", volume: 0.5 },
 *   "gesture.success.chop":{ src: "/assets/audio/chop.mp3", volume: 0.9, pitchJitter: 0.06 },
 *   "gesture.fail":        { src: "/assets/audio/aw.mp3", volume: 0.7, minGapMs: 300 },
 *   "knife.chop":          { src: "/assets/audio/knife.mp3", volume: 0.8, minGapMs: 60 },
 *   "knife.slice":         { src: "/assets/audio/slice.mp3", volume: 0.8, minGapMs: 60 },
 *   // `"knife"` is the fallback played when a chop/slice-specific cue is absent.
 *   "ambient.pan":         { src: "/assets/audio/sizzle.mp3", volume: 0.35, fadeMs: 500 },
 *   "ui.aisle":            { src: "/assets/audio/swipe.mp3", volume: 0.6 },
 *   "ui.take":             { src: "/assets/audio/pick.mp3", volume: 0.6, minGapMs: 40 },
 *   "recipe.complete":     { src: "/assets/audio/ding.mp3", volume: 0.8 },
 *   "round.timesup":       { src: "/assets/audio/times-up.mp3", volume: 0.9 },
 *   "sabotage.steal":      { src: "/assets/audio/whoosh.mp3", volume: 0.8 },
 *
 * Stage-specific override (wins over the gesture default):
 *   "stage:Spaghetti & Meatballs:2": { src: "/assets/audio/roll.mp3" },
 */
export const SOUNDS: SoundTable = {
  "music.game": { src: "/assets/audio/main-music.mp3", volume: 1 },
};
