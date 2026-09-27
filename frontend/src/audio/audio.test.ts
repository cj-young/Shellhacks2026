import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_VOLUMES,
  ambientKeys,
  channelFor,
  channelVolume,
  clampVolume,
  gestureKeys,
  knifeKeys,
  pickCue,
  resolveAmbient,
  resolveGesture,
  resolveKey,
} from "./resolve.ts";
import type { SoundTable } from "../data/sounds.ts";

const table: SoundTable = {
  "gesture.success": { src: "/g.mp3" },
  "gesture.success.chop": { src: "/chop.mp3" },
  "ambient.default": { src: "/room.mp3" },
  "ambient.pan": { src: "/sizzle.mp3" },
  "stage:Guacamole:2": { src: "/mash.mp3" },
  "ui.take": { src: "/pick.mp3" },
};

test("resolveKey returns the exact cue or null", () => {
  assert.equal(resolveKey("ui.take", table)?.src, "/pick.mp3");
  assert.equal(resolveKey("ui.trash", table), null);
});

test("gesture resolution prefers stage, then gesture, then default", () => {
  assert.deepEqual(
    gestureKeys("chop", { recipeName: "Guacamole", stageIndex: 2 }),
    ["stage:Guacamole:2", "gesture.success.chop", "gesture.success"],
  );
  assert.equal(resolveGesture("chop", table)?.src, "/chop.mp3");
  assert.equal(resolveGesture("stir", table)?.src, "/g.mp3");
  assert.equal(
    resolveGesture("chop", table, { recipeName: "Guacamole", stageIndex: 2 })
      ?.src,
    "/mash.mp3",
  );
});

test("gesture resolution is null when nothing is registered", () => {
  assert.equal(resolveGesture("chop", {}), null);
});

test("ambient resolution falls back from station to default", () => {
  assert.deepEqual(ambientKeys("pan"), ["ambient.pan", "ambient.default"]);
  assert.equal(resolveAmbient("pan", table)?.src, "/sizzle.mp3");
  assert.equal(resolveAmbient("pot", table)?.src, "/room.mp3");
  assert.equal(resolveAmbient("pot", {}), null);
});

test("pickCue skips cues with no src", () => {
  assert.equal(pickCue(["ui.take"], { "ui.take": { src: "" } }), null);
  assert.equal(pickCue([], table), null);
});

test("knife cues prefer the gesture, then fall back to the shared clip", () => {
  assert.deepEqual(knifeKeys("slice"), ["knife.slice", "knife"]);
  const knives: SoundTable = {
    knife: { src: "/knife.mp3" },
    "knife.slice": { src: "/slice.mp3" },
  };
  assert.equal(pickCue(knifeKeys("slice"), knives)?.src, "/slice.mp3");
  assert.equal(pickCue(knifeKeys("chop"), knives)?.src, "/knife.mp3");
  assert.equal(pickCue(knifeKeys("chop"), {}), null);
});

test("channelFor maps key prefixes to buses", () => {
  assert.equal(channelFor("music.game"), "music");
  assert.equal(channelFor("ambient.pan"), "ambient");
  assert.equal(channelFor("ui.take"), "sfx");
  assert.equal(channelFor("stage:Guacamole:2"), "sfx");
});

test("volume helpers clamp and honour mute", () => {
  assert.equal(clampVolume(-1), 0);
  assert.equal(clampVolume(2), 1);
  assert.equal(clampVolume(0.5), 0.5);
  assert.equal(clampVolume(Number.NaN), 0);
  assert.equal(
    channelVolume("sfx", DEFAULT_VOLUMES, false),
    DEFAULT_VOLUMES.sfx,
  );
  assert.equal(channelVolume("music", DEFAULT_VOLUMES, true), 0);
});
