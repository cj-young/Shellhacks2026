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
 * A tiny Web Audio engine. Nothing touches the browser until `unlock()` runs
 * from a user gesture, so it is safe to import during SSR.
 *
 * Three buses (music / ambient / sfx) sit under a master gain; volume and mute
 * are persisted. Missing files are a silent no-op so a partial registry works.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buses: Record<SoundChannel, GainNode> | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private missing = new Set<string>();
  private pending = new Map<string, Promise<AudioBuffer | null>>();
  private lastPlayed = new Map<string, number>();
  private ambient: Voice | null = null;
  private music: Voice | null = null;
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

  /** Creates/resumes the audio context. Call from a user gesture. */
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

  private handleFor(voice: Voice): SoundHandle {
    return { stop: () => voice.stop() };
  }

  /**
   * Registers a looping voice immediately (so it can be stopped while its buffer
   * is still loading) and starts playback once decoded.
   */
  private beginLoop(
    def: SoundDef,
    channel: SoundChannel,
    key: string,
  ): Voice | null {
    this.unlock();
    if (!this.ctx || !this.buses || this.state.muted) return null;

    const voice = new Voice(key, () => {
      if (this.ambient === voice) this.ambient = null;
      if (this.music === voice) this.music = null;
    });
    if (channel === "ambient") this.ambient = voice;
    else this.music = voice;

    void this.startLoop(voice, def, channel);
    return voice;
  }

  private async startLoop(
    voice: Voice,
    def: SoundDef,
    channel: SoundChannel,
  ): Promise<void> {
    const ctx = this.ctx;
    const bus = this.buses?.[channel];
    if (!ctx || !bus) return;
    const buffer = await this.buffer(def.src);
    if (!buffer || voice.canceled) return;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(bus);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain);

    const fade = Math.max(0.02, (def.fadeMs ?? 300) / 1000);
    const target = clampVolume(def.volume ?? 1);
    voice.attach(source, gain, fade);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(target, ctx.currentTime + fade);
    source.start();
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
    if (!this.buses) return;
    for (const channel of ALL_CHANNELS) {
      this.buses[channel].gain.value = channelVolume(
        channel,
        this.state.volumes,
        this.state.muted,
      );
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

/** A looping or one-shot voice that can be stopped before it has loaded. */
class Voice {
  readonly key: string;
  canceled = false;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private fade = 0.02;
  private readonly onStop: () => void;

  constructor(key: string, onStop: () => void) {
    this.key = key;
    this.onStop = onStop;
  }

  attach(source: AudioBufferSourceNode, gain: GainNode, fade: number): void {
    this.source = source;
    this.gain = gain;
    this.fade = fade;
  }

  stop(): void {
    if (this.canceled) return;
    this.canceled = true;
    this.onStop();
    const ctx = this.gain?.context;
    const gain = this.gain;
    const source = this.source;
    if (ctx && gain) {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + this.fade);
    }
    if (source && ctx) {
      try {
        source.stop(ctx.currentTime + this.fade + 0.02);
      } catch {
        /* Already stopped. */
      }
    }
    if (gain && ctx) {
      const cleanup = gain;
      window.setTimeout(
        () => {
          try {
            cleanup.disconnect();
          } catch {
            /* Already disconnected. */
          }
        },
        (this.fade + 0.1) * 1000,
      );
    }
  }
}

export const audio = new AudioEngine();
