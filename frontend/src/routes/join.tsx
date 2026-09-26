import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { useGameConnection } from '#/lib/use-game-connection'

export const Route = createFileRoute('/join')({ component: JoinScreen })

function JoinScreen() {
  const [codeInput, setCodeInput] = useState('')
  const [joinedCode, setJoinedCode] = useState<string | null>(null)
  const connection = useGameConnection(joinedCode ? { code: joinedCode } : null)

  const join = useCallback(() => {
    const code = codeInput.trim().toUpperCase()
    if (!code) return
    setJoinedCode(code)
  }, [codeInput])

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-100">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <h1 className="text-2xl font-bold">Join a game</h1>

        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            join()
          }}
        >
          <input
            autoCapitalize="characters"
            autoComplete="off"
            className="w-full rounded border border-slate-700 bg-slate-900 px-4 py-2 font-mono text-lg tracking-widest uppercase"
            maxLength={6}
            onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
            placeholder="ABC123"
            value={codeInput}
          />
          <button
            className="rounded border border-cyan-400 px-4 py-2 font-medium hover:bg-cyan-400/10"
            type="submit"
          >
            Join
          </button>
        </form>

        {joinedCode && (
          <div className="rounded border border-slate-700 p-4">
            <p className="text-sm text-slate-400">
              Players ({connection.players.length})
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {connection.players.map((player, index) => (
                <li key={player.id}>
                  Player {index + 1}
                  {player.id === connection.playerId ? ' (you)' : ''}
                  {player.isHost ? ' (host)' : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-sm text-slate-400">{connection.status}</p>
        {connection.message && (
          <p className="text-sm text-amber-400">{connection.message}</p>
        )}

        <a className="text-sm text-cyan-400 underline" href="/host">
          Host a game instead
        </a>
      </div>
    </div>
  )
}
