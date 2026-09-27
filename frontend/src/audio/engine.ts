import type { Gesture } from "../data/menu";
import type { Station } from "../data/recipe-steps";
import { SOUNDS } from "../data/sounds";
import type { SoundChannel, SoundDef, SoundKey } from "../data/sounds";
import {
  ALL_CHANNELS,
  DEFAULT_VOLUMES,
  clampVolume,
  channelVolume,
  resolveAmbient,
  resolveGesture,
  resolveKey,
} from "./resolve";
import type { ChannelVolumes, StageRef } from "./resolve";

/** Per-play overrides; falls back to the cue's own settings. */
export type PlayOptions = {
  volume?: number;
  rate?: number;
  pitchJitter?: number;
};

export type SoundHandle = { stop: () => void };

export const SILENT_HANDLE: SoundHandle = { stop() {} };

type AudioState = { muted: boolean; volumes: ChannelVolumes };

const STORAGE_KEY = "shellhacks.audio";

function loadState(): AudioState {
  const fallback: AudioState = {
    muted: false,
    volumes: { ...DEFAULT_VOLUMES },
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "{}",
    ) as Partial<AudioState>;
    return {
      muted: raw.muted === true,
      volumes: {
        music: clampVolume(raw.volumes?.music ?? DEFAULT_VOLUMES.music),
        ambient: clampVolume(raw.volumes?.ambient ?? DEFAULT_VOLUMES.ambient),
        sfx: clampVolume(raw.volumes?.sfx ?? DEFAULT_VOLUMES.sfx),
      },
    };
  } catch {
    return fallback;
  }
}

/** Playback-rate multiplier from a 0–1 pitch wobble; 1 when there is none. */
export function pitchFactor(jitter: number): number {
  if (!jitter) return 1;
  return 1 + (Math.random() * 2 - 1) * clampVolume(jitter);
}

/** Keeps playback rate in a sane, non-inverted range. */
export function clampRate(rate: number): number {
  return Number.isFinite(rate) ? Math.max(0.25, Math.min(4, rate)) : 1;
}

/**
 * A looping voice streamed through an `HTMLAudioElement`. Streaming means a
 * large track starts playing as soon as a little audio has buffered, instead of
 * waiting for the entire file to download and decode.
 */
class StreamVoice {
  readonly key: string;
  readonly cueVolume: number;
  private readonly src: string;
  private readonly el: HTMLAudioElement;
  private readonly fade: number;
  private readonly onStop: () => void;
  private timer: number | null = null;
  private blocked = false;
  private stopped = false;

  constructor(
    src: string,
    key: string,
    cueVolume: number,
    fadeMs: number,
    onStop: () => void,
  ) {
    this.src = src;
    this.key = key;
    this.cueVolume = clampVolume(cueVolume);
    this.fade = Math.max(0.02, fadeMs / 1000);
    this.onStop = onStop;
    this.el = new Audio(src);
    this.el.loop = true;
    this.el.preload = "auto";
    this.el.volume = 0;
  }

  /** Begins playback and fades up to `level`. */
  start(level: number): void {
    this.el.volume = 0;
    this.play();
    this.ramp(level, this.fade);
  }

  /** Re-attempts play() after a user gesture if autoplay was blocked. */
  retry(): void {
    if (this.stopped || !this.blocked) return;
    this.play();
  }

  /** Instant level change (volume/mute updates). */
  setLevel(level: number): void {
    if (this.stopped) return;
    this.clearTimer();
    this.el.volume = clampVolume(level);
  }

  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    this.onStop();
    this.ramp(0, this.fade);
    window.setTimeout(
      () => {
        this.el.pause();
        this.el.removeAttribute("src");
        this.el.load();
      },
      this.fade * 1000 + 60,
    );
  }

  private play(): void {
    this.el.play().then(
      () => {
        this.blocked = false;
      },
      () => {
        this.blocked = true;
        console.warn(
          `[audio] playback blocked until a user gesture: ${this.src}`,
        );
      },
    );
  }

  private ramp(target: number, seconds: number): void {
    this.clearTimer();
    const from = this.el.volume;
    const to = clampVolume(target);
    if (seconds <= 0 || from === to) {
      this.el.volume = to;
      return;
    }
    const steps = Math.max(1, Math.round(seconds * 60));
    let step = 0;
    this.timer = window.setInterval(() => {
      step += 1;
      this.el.volume = clampVolume(from + (to - from) * (step / steps));
      if (step >= steps) this.clearTimer();
    }, 1000 / 60);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }
}

/**
 * A tiny audio engine. One-shots go through Web Audio (low latency, pitch
 * jitter); music and ambience stream through `HTMLAudioElement`, so long tracks
 * start quickly. Nothing touches the browser until `unlock()` runs from a user
 * gesture, so it is safe to import during SSR.
 *
 * Buses carry persisted mute + per-channel volume; missing files are a silent
 * no-op so a partial registry works.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buses: Record<SoundChannel, GainNode> | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private missing = new Set<string>();
  private pending = new Map<string, Promise<AudioBuffer | null>>();
  private lastPlayed = new Map<string, number>();
  private ambient: StreamVoice | null = null;
  private music: StreamVoice | null = null;
  private state: AudioState = loadState();

  get muted(): boolean {
    return this.state.muted;
  }

  get volumes(): ChannelVolumes {
    return { ...this.state.volumes };
  }

  setMuted(muted: boolean): void {
    this.state = { ...this.state, muted };
    this.applyVolumes();
    this.persist();
  }

  setVolume(channel: SoundChannel, value: number): void {
    this.state = {
      ...this.state,
      volumes: { ...this.state.volumes, [channel]: clampVolume(value) },
    };
    this.applyVolumes();
    this.persist();
  }

  /** Creates/resumes the audio context and retries any blocked streams. */
  unlock(): void {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      this.ctx = new window.AudioContext();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.buses = {
        music: this.ctx.createGain(),
        ambient: this.ctx.createGain(),
        sfx: this.ctx.createGain(),
      };
      for (const channel of ALL_CHANNELS) {
        this.buses[channel].connect(this.master);
      }
      this.applyVolumes();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    this.music?.retry();
    this.ambient?.retry();
  }

  /** One-shot sound effect (always on the sfx bus). */
  play(key: SoundKey, opts: PlayOptions = {}): void {
    void this.playDef(resolveKey(key, SOUNDS), opts);
  }

  /** Gesture success with stage-specific overrides: stage → gesture → default. */
  playGesture(
    gesture: Gesture,
    stage?: StageRef,
    opts: PlayOptions = {},
  ): void {
    void this.playDef(resolveGesture(gesture, SOUNDS, stage), opts);
  }

  /** Looping ambience for a station. Replaces any current ambience. */
  playAmbient(station: Station, stage?: StageRef): SoundHandle {
    const def = resolveAmbient(station, SOUNDS, stage);
    if (!def) return SILENT_HANDLE;
    const key = `ambient:${station}`;
    if (this.ambient?.key === key) return this.handleFor(this.ambient);

    this.stopAmbient();
    const voice = this.beginLoop(def, "ambient", key);
    return voice ? this.handleFor(voice) : SILENT_HANDLE;
  }

  stopAmbient(): void {
    this.ambient?.stop();
    this.ambient = null;
  }

  /** Looping background music (host only). */
  setMusic(key: SoundKey): void {
    const def = resolveKey(key, SOUNDS);
    if (!def) return;
    const loopKey = `music:${String(key)}`;
    if (this.music?.key === loopKey) return;
    this.stopMusic();
    this.beginLoop(def, "music", loopKey);
  }

  stopMusic(): void {
    this.music?.stop();
    this.music = null;
  }

  private handleFor(voice: StreamVoice): SoundHandle {
    return { stop: () => voice.stop() };
  }

  private loopLevel(channel: SoundChannel, cueVolume: number): number {
    return (
      channelVolume(channel, this.state.volumes, this.state.muted) *
      clampVolume(cueVolume)
    );
  }

  private beginLoop(
    def: SoundDef,
    channel: SoundChannel,
    key: string,
  ): StreamVoice | null {
    if (typeof window === "undefined") return null;
    this.unlock();

    const voice = new StreamVoice(
      def.src,
      key,
      def.volume ?? 1,
      def.fadeMs ?? 300,
      () => {
        if (this.ambient === voice) this.ambient = null;
        if (this.music === voice) this.music = null;
      },
    );
    if (channel === "ambient") this.ambient = voice;
    else this.music = voice;

    voice.start(this.loopLevel(channel, voice.cueVolume));
    return voice;
  }

  private async playDef(
    def: SoundDef | null,
    opts: PlayOptions,
  ): Promise<void> {
    if (!def) return;
    this.unlock();
    const ctx = this.ctx;
    const bus = this.buses?.sfx;
    if (!ctx || !bus || this.state.muted) return;

    const now = performance.now();
    if (def.minGapMs) {
      const last = this.lastPlayed.get(def.src) ?? -Infinity;
      if (now - last < def.minGapMs) return;
    }
    this.lastPlayed.set(def.src, now);

    const buffer = await this.buffer(def.src);
    if (!buffer) return;

    const gain = ctx.createGain();
    gain.gain.value = clampVolume(opts.volume ?? def.volume ?? 1);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = clampRate(
      (opts.rate ?? def.rate ?? 1) *
        pitchFactor(opts.pitchJitter ?? def.pitchJitter ?? 0),
    );
    source.connect(gain).connect(bus);
    source.start();
  }

  private applyVolumes(): void {
    if (this.buses) {
      for (const channel of ALL_CHANNELS) {
        this.buses[channel].gain.value = channelVolume(
          channel,
          this.state.volumes,
          this.state.muted,
        );
      }
    }
    if (this.music) {
      this.music.setLevel(this.loopLevel("music", this.music.cueVolume));
    }
    if (this.ambient) {
      this.ambient.setLevel(this.loopLevel("ambient", this.ambient.cueVolume));
    }
  }

  private persist(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      /* Storage is optional (private mode, quota). */
    }
  }

  private buffer(src: string): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(src);
    if (cached) return Promise.resolve(cached);
    if (this.missing.has(src)) return Promise.resolve(null);
    const existing = this.pending.get(src);
    if (existing) return existing;
    const ctx = this.ctx;
    if (!ctx) return Promise.resolve(null);

    const promise = (async () => {
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(String(response.status));
        const decoded = await ctx.decodeAudioData(await response.arrayBuffer());
        this.buffers.set(src, decoded);
        return decoded;
      } catch {
        if (!this.missing.has(src)) {
          this.missing.add(src);
          console.warn(`[audio] could not load ${src}`);
        }
        return null;
      } finally {
        this.pending.delete(src);
      }
    })();
    this.pending.set(src, promise);
    return promise;
  }
}

export const audio = new AudioEngine();
