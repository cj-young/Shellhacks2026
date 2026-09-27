import { apiUrl } from "./api";
import { hostGameKey, playerTokenKey } from "./session-keys";
import type { GameStatus } from "./types";

export type HostGame = { code: string; hostToken: string; name: string };

const HOST_NAME = "Host";

export function loadStoredHostGame(): HostGame | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(hostGameKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<HostGame>;
    if (
      typeof parsed.code !== "string" ||
      typeof parsed.hostToken !== "string"
    ) {
      return null;
    }

    const name =
      typeof parsed.name === "string" && parsed.name.trim()
        ? parsed.name
        : HOST_NAME;
    return { code: parsed.code, hostToken: parsed.hostToken, name };
  } catch {
    return null;
  }
}

/** Forgets the persisted host game and the host's reconnect token for it. */
export function clearHostGame(code?: string): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(hostGameKey);
    if (code) window.sessionStorage.removeItem(playerTokenKey(code));
  } catch {
    // Ignore storage failures (private mode, quota, etc.).
  }
}

/**
 * Looks up whether a persisted game code is still usable.
 *
 * Returns the game's status, `null` when the server has no such game (404), or
 * `undefined` on any other failure (e.g. the server is unreachable) so callers
 * can decide whether to trust the stored game.
 */
export async function fetchGameStatus(
  code: string,
): Promise<GameStatus | null | undefined> {
  try {
    const response = await fetch(apiUrl(`/games/${encodeURIComponent(code)}`));
    if (response.status === 404) return null;
    if (!response.ok) return undefined;

    const body = (await response.json()) as { status?: GameStatus };
    return body.status;
  } catch {
    return undefined;
  }
}

export async function createHostGame(): Promise<HostGame> {
  const response = await fetch(apiUrl("/games"), { method: "POST" });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);

  const created = (await response.json()) as {
    code: string;
    hostToken: string;
  };
  const game: HostGame = { ...created, name: HOST_NAME };
  try {
    window.sessionStorage.setItem(hostGameKey, JSON.stringify(game));
  } catch {
    // Private mode can block storage; the game still works, it just won't survive a reload.
  }
  return game;
}
