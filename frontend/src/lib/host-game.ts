export type HostGame = { code: string; hostToken: string; name: string }

const STORAGE_KEY = 'shellhacks.hostGame'
const HOST_NAME = 'Host'

export function loadStoredHostGame(): HostGame | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<HostGame>
    if (typeof parsed.code !== 'string' || typeof parsed.hostToken !== 'string') {
      return null
    }

    const name = typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name : HOST_NAME
    return { code: parsed.code, hostToken: parsed.hostToken, name }
  } catch {
    return null
  }
}

export async function createHostGame(): Promise<HostGame> {
  const response = await fetch('/api/games', { method: 'POST' })
  if (!response.ok) throw new Error(`Request failed (${response.status})`)

  const created = (await response.json()) as { code: string; hostToken: string }
  const game: HostGame = { ...created, name: HOST_NAME }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(game))
  } catch {
    // Private mode can block storage; the game still works, it just won't survive a reload.
  }
  return game
}
