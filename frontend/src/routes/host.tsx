import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { useGameConnection } from '#/lib/use-game-connection'

type Game = { code: string; hostToken: string }

const STORAGE_KEY = 'shellhacks.hostGame'

export const Route = createFileRoute('/host')({ component: HostScreen })

function loadStoredGame(): Game | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<Game>
    if (
      typeof parsed.code !== 'string' ||
      typeof parsed.hostToken !== 'string'
    ) {
      return null
    }

    return { code: parsed.code, hostToken: parsed.hostToken }
  } catch {
    return null
  }
}

function HostScreen() {
  const [game, setGame] = useState<Game | null>(null)
  const [createError, setCreateError] = useState('')
  const connection = useGameConnection(
    game ? { code: game.code, token: game.hostToken } : null,
  )

  useEffect(() => {
    setGame(loadStoredGame())
  }, [])

  const createGame = useCallback(async () => {
    setCreateError('')

    try {
      const response = await fetch('/api/games', { method: 'POST' })
      if (!response.ok) throw new Error(`Request failed (${response.status})`)

      const created = (await response.json()) as Game
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(created))
      setGame(created)
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : 'Unable to create a game',
      )
    }
  }, [])

  const startGame = useCallback(() => {
    setCreateError('')
    connection.socketRef.current?.emit('start_game')
  }, [connection.socketRef])

  const errorMessage = createError || connection.message

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-100">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <h1 className="text-2xl font-bold">Host a game</h1>

        <button
          className="rounded border border-cyan-400 px-4 py-2 font-medium hover:bg-cyan-400/10"
          onClick={() => {
            void createGame()
          }}
          type="button"
        >
          {game ? 'Create a new game' : 'Create game'}
        </button>

        {game && (
          <>
            <div className="rounded border border-slate-700 p-4">
              <p className="text-sm text-slate-400">Game code</p>
              <p className="font-mono text-4xl tracking-widest">{game.code}</p>
              <button
                className="mt-2 text-sm text-cyan-400 underline"
                onClick={() => {
                  void navigator.clipboard.writeText(game.code)
                }}
                type="button"
              >
                Copy code
              </button>
            </div>

            {!connection.started && (
              <button
                className="rounded border border-slate-600 px-4 py-2 hover:bg-slate-800"
                onClick={startGame}
                type="button"
              >
                Start game
              </button>
            )}

            <div className="rounded border border-slate-700 p-4">
              <p className="text-sm text-slate-400">
                Players ({connection.players.length})
              </p>
              <ul className="mt-2 flex flex-col gap-1">
                {connection.players.length === 0 && (
                  <li className="text-slate-500">Waiting...</li>
                )}
                {connection.players.map((player, index) => (
                  <li key={player.id}>
                    Player {index + 1}
                    {player.isHost ? ' (host)' : ''}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <p className="text-sm text-slate-400">{connection.status}</p>
        {errorMessage && (
          <p className="text-sm text-amber-400">{errorMessage}</p>
        )}

        <a className="text-sm text-cyan-400 underline" href="/">
          Back to the game
        </a>
      </div>
    </div>
  )
}
