import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { MakeEmptyState, type GameState } from './types'

export type Player = { id: string; isHost: boolean }
export type GameAuth = { code: string; token?: string }

type JoinedPayload = { playerId: string; players: Player[] }

export type GameConnection = {
  socketRef: RefObject<Socket | null>
  players: Player[]
  playerId: string | null
  status: string
  message: string
  started: boolean
  state: GameState
}

export function useGameConnection(auth: GameAuth | null): GameConnection {
  const socketRef = useRef<Socket | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [status, setStatus] = useState('Not connected')
  const [message, setMessage] = useState('')
  const [started, setStarted] = useState(false)
  const [state, setState] = useState<GameState>(MakeEmptyState())

  const code = auth?.code
  const token = auth?.token

  useEffect(() => {
    if (!code) {
      setPlayers([])
      setPlayerId(null)
      setStatus('Not connected')
      setMessage('')
      setStarted(false)
      return
    }

    setStatus('Connecting...')
    setMessage('')
    setStarted(false)

    const socket = io({ path: '/api/socket.io/', auth: { code, token } })
    socketRef.current = socket

    socket.on('connect', () => setStatus('Connected'))
    socket.on('connect_error', () => setStatus('Connection failed'))
    socket.on('disconnect', () => setStatus('Disconnected'))
    socket.on('joined', (payload: JoinedPayload) => {
      setPlayers(payload.players)
      setPlayerId(payload.playerId)
      setStatus('Waiting for host')
    })
    socket.on('player_joined', (player: Player) => {
      setPlayers((current) => [
        ...current.filter((entry) => entry.id !== player.id),
        player,
      ])
    })
    socket.on('player_left', ({ playerId: leftId }: { playerId: string }) => {
      setPlayers((current) => current.filter((entry) => entry.id !== leftId))
    })
    socket.on('game_started', () => {
      setStarted(true)
      setStatus('Game started')
    })
    socket.on(
      'game_error',
      ({ message: errorMessage }: { message: string }) => {
        setMessage(errorMessage)
        setStatus('Error')
      },
    )
    socket.on(
      'update_state',
      (gameState:GameState) => {
        setState(gameState)
        console.log(gameState)
      }
    )

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [code, token])

  return { socketRef, players, playerId, status, message, started, state }
}
