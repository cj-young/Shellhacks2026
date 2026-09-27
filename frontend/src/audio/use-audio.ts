import { useEffect, useMemo } from "react";
import type { Gesture } from "../data/menu";
import type { Station } from "../data/recipe-steps";
import type { SoundKey } from "../data/sounds";
import { audio } from "./engine";
import type { PlayOptions } from "./engine";
import type { StageRef } from "./resolve";

/** Unlocks audio on the first pointer/key press. Mount once per route. */
export function useAudioUnlock(): void {
  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);
}

/** Fire-and-forget one-shot sound effects. */
export function useSfx() {
  return useMemo(
    () => ({
      play: (key: SoundKey, opts?: PlayOptions) => audio.play(key, opts),
      playGesture: (gesture: Gesture, stage?: StageRef, opts?: PlayOptions) =>
        audio.playGesture(gesture, stage, opts),
    }),
    [],
  );
}

/** Plays a looping station ambience while `active`; swaps as `station` changes. */
export function useAmbient(
  station: Station | undefined,
  active: boolean,
  stage?: StageRef,
): void {
  const recipeName = stage?.recipeName;
  const stageIndex = stage?.stageIndex;
  useEffect(() => {
    if (!station || !active) return;
    const ref =
      recipeName === undefined || stageIndex === undefined
        ? undefined
        : { recipeName, stageIndex };
    const handle = audio.playAmbient(station, ref);
    return () => handle.stop();
  }, [station, active, recipeName, stageIndex]);
}

/** Host background music. */
export function useMusic(key: SoundKey, playing: boolean): void {
  useEffect(() => {
    if (!playing) return;
    audio.setMusic(key);
    return () => audio.stopMusic();
  }, [key, playing]);
}
