import React from 'react'
import { Logo } from '../Logo'
import { Pill } from '../Pill'
import { PlayerPill } from '../PlayerPill'
import { RoomCode } from '../RoomCode'
import { Button } from '../Button'
import { MOCK_PLAYERS, ROOM_CODE } from '#/data/chop-chop-mock'

export function HostLobby() {
  const newestPlayer = MOCK_PLAYERS.find((p) => p.isNewest)

  return (
    <div className="w-screen h-screen bg-[var(--bg)] dot-grid overflow-hidden flex flex-col">
      {/* Top section */}
      <div className="flex-1 flex items-start justify-between p-8">
        {/* Left: Logo + tag */}
        <div className="flex flex-col gap-4 items-start">
          <div className="relative">
            <Logo size="lg" rotation={-4} />
            <Pill
              color="royal"
              textColor="text-white"
              className="absolute -top-4 -right-2 rotate-12 text-sm"
            >
              KITCHEN RELAY
            </Pill>
          </div>
          <div className="text-2xl font-display font-bold text-[var(--ink)]">
            Cook together.<br />Pass it on.
          </div>

          {/* Players pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {MOCK_PLAYERS.map((player) => (
              <PlayerPill
                key={player.id}
                name={player.name}
                color={player.color}
              />
            ))}
          </div>
        </div>

        {/* Right: QR badge + Room code */}
        <div className="flex flex-col gap-4 items-end">
          {/* Circular QR badge */}
          <div className="w-32 h-32 rounded-full bg-[var(--sky)] border-4 border-[var(--ink)] shadow-[0_5px_0_var(--ink)] flex items-center justify-center relative">
            <div className="text-white text-xs font-bold text-center absolute inset-0 flex items-center justify-center">
              SCAN TO<br />JOIN
            </div>
            {/* QR placeholder */}
            <div className="w-16 h-16 bg-white rounded-lg border-2 border-[var(--ink)] flex items-center justify-center text-lg">
              📱
            </div>
          </div>

          {/* Room code */}
          <RoomCode code={ROOM_CODE} variant="host" />
        </div>
      </div>

      {/* Bottom section */}
      <div className="flex items-end justify-between p-8 pb-8">
        {/* Bottom left: Newest player pop-in */}
        {newestPlayer && (
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div
                className="w-20 h-20 rounded-full border-4 border-[var(--ink)] shadow-[0_5px_0_var(--ink)] flex items-center justify-center font-display font-bold text-2xl text-white"
                style={{ backgroundColor: newestPlayer.color }}
              >
                {newestPlayer.avatar}
              </div>
              {/* Hi speech bubble */}
              <div className="absolute -top-8 -right-4 bg-[var(--surface-white)] border-4 border-[var(--ink)] rounded-full w-12 h-12 flex items-center justify-center text-xl shadow-[0_3px_0_var(--ink)] transform rotate-6">
                👋
              </div>
            </div>
            <div className="text-sm font-bold text-[var(--ink)]">{newestPlayer.name} joined!</div>
          </div>
        )}

        {/* Bottom right: Chef count + Start button */}
        <div className="flex flex-col items-end gap-3">
          <div className="text-xl font-display font-bold text-[var(--ink)]">
            {MOCK_PLAYERS.length} chefs in the kitchen
          </div>
          <Button size="lg" variant="success">
            Start Game
          </Button>
        </div>
      </div>
    </div>
  )
}
