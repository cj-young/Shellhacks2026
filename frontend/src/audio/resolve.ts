import type { Gesture } from "../data/menu";
import type { Station } from "../data/recipe-steps";
import type {
  SoundChannel,
  SoundDef,
  SoundKey,
  SoundTable,
} from "../data/sounds";

/** Per-channel volume, 0–1. */
export type ChannelVolumes = { music: number; ambient: number; sfx: number };

export const DEFAULT_VOLUMES: ChannelVolumes = {
  music: 0.5,
  ambient: 0.4,
  sfx: 0.9,
};

export const ALL_CHANNELS: readonly SoundChannel[] = [
  "music",
  "ambient",
  "sfx",
];

/** Where a sound originates: recipe name + flattened stage index. */
export type StageRef = { recipeName: string; stageIndex: number };

/** The cutting gestures that make knife sounds. */
export type KnifeGesture = "chop" | "slice";

export function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

/** Which bus an event plays on, from its key prefix. */
export function channelFor(key: SoundKey): SoundChannel {
  if (key.startsWith("music.")) return "music";
  if (key.startsWith("ambient.")) return "ambient";
  return "sfx";
}

/** Effective channel gain: 0 when muted, otherwise the clamped channel volume. */
export function channelVolume(
  channel: SoundChannel,
  volumes: ChannelVolumes,
  muted: boolean,
): number {
  return muted ? 0 : clampVolume(volumes[channel]);
}

/**
 * Returns the first defined cue for these keys, most specific first. A cue with
 * no `src` is treated as absent, so partial registrations are safe.
 */
export function pickCue(
  keys: readonly SoundKey[],
  table: SoundTable,
): SoundDef | null {
  for (const key of keys) {
    const def = table[key];
    if (def?.src) return def;
  }
  return null;
}

/** Candidate keys for a gesture success: stage override → gesture type → default. */
export function gestureKeys(gesture: Gesture, stage?: StageRef): SoundKey[] {
  const keys: SoundKey[] = [];
  if (stage) keys.push(`stage:${stage.recipeName}:${stage.stageIndex}`);
  keys.push(`gesture.success.${gesture}`, "gesture.success");
  return keys;
}

/** Candidate keys for ambient: stage override → station → default. */
export function ambientKeys(station: Station, stage?: StageRef): SoundKey[] {
  const keys: SoundKey[] = [];
  if (stage) keys.push(`stage:${stage.recipeName}:${stage.stageIndex}:ambient`);
  keys.push(`ambient.${station}`, "ambient.default");
  return keys;
}

/** Candidate keys for a knife cut: the gesture-specific clip → the shared one. */
export function knifeKeys(gesture: KnifeGesture): SoundKey[] {
  return [`knife.${gesture}`, "knife"];
}

export function resolveKey(key: SoundKey, table: SoundTable): SoundDef | null {
  return pickCue([key], table);
}

export function resolveGesture(
  gesture: Gesture,
  table: SoundTable,
  stage?: StageRef,
): SoundDef | null {
  return pickCue(gestureKeys(gesture, stage), table);
}

export function resolveAmbient(
  station: Station,
  table: SoundTable,
  stage?: StageRef,
): SoundDef | null {
  return pickCue(ambientKeys(station, stage), table);
}
