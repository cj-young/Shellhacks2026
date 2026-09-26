import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'

type Game = { code: string; hostToken: string }
type Player = { id: string; isHost: boolean }
type JoinedPayload = { playerId: string; players: Player[] }

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
  const [players, setPlayers] = useState<Player[]>([])
  const [status, setStatus] = useState('No game yet')
  const [message, setMessage] = useState('')
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    setGame(loadStoredGame())
  }, [])

  useEffect(() => {
    if (!game) return

    const socket = io({
      path: '/api/socket.io/',
      auth: { code: game.code, token: game.hostToken },
    })
    socketRef.current = socket

    socket.on('connect', () => setStatus('Connected'))
    socket.on('connect_error', () => setStatus('Connection failed'))
    socket.on('disconnect', () => setStatus('Disconnected'))
    socket.on('joined', (payload: JoinedPayload) => {
      setPlayers(payload.players)
      setStatus('Waiting for players')
    })
    socket.on('player_joined', (player: Player) => {
      setPlayers((current) => [
        ...current.filter((entry) => entry.id !== player.id),
        player,
      ])
    })
    socket.on('player_left', ({ playerId }: { playerId: string }) => {
      setPlayers((current) => current.filter((entry) => entry.id !== playerId))
    })
    socket.on(
      'game_error',
      ({ message: errorMessage }: { message: string }) => {
        setMessage(errorMessage)
      },
    )

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [game])

  const createGame = useCallback(async () => {
    setMessage('')
    setStatus('Creating game...')

    try {
      const response = await fetch('/api/games', { method: 'POST' })
      if (!response.ok) throw new Error(`Request failed (${response.status})`)

      const created = (await response.json()) as Game
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(created))
      setPlayers([])
      setGame(created)
    } catch (error) {
      setStatus('Error')
      setMessage(
        error instanceof Error ? error.message : 'Unable to create a game',
      )
    }
  }, [])

  const startGame = useCallback(() => {
    setMessage('')
    socketRef.current?.emit('start_game')
  }, [])

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

            <button
              className="rounded border border-slate-600 px-4 py-2 hover:bg-slate-800"
              onClick={startGame}
              type="button"
            >
              Start game
            </button>

            <div className="rounded border border-slate-700 p-4">
              <p className="text-sm text-slate-400">
                Players ({players.length})
              </p>
              <ul className="mt-2 flex flex-col gap-1">
                {players.length === 0 && (
                  <li className="text-slate-500">Waiting...</li>
                )}
                {players.map((player, index) => (
                  <li key={player.id}>
                    Player {index + 1}
                    {player.isHost ? ' (host)' : ''}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <p className="text-sm text-slate-400">{status}</p>
        {message && <p className="text-sm text-amber-400">{message}</p>}

        <a className="text-sm text-cyan-400 underline" href="/">
          Back to the game
        </a>
      </div>
    </div>
  )
}
