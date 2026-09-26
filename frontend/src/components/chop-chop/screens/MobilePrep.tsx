import React, { useState } from 'react'
import { Pill } from '../Pill'
import { Avatar } from '../Avatar'
import { Button } from '../Button'
import { PLAYER_COLORS } from '#/data/chop-chop-mock'

// Demo: show first player's prep screen
const demoPlayer = { name: 'Alex', color: PLAYER_COLORS[0], avatar: 'A' }
const currentItem = { name: 'Tomato', emoji: '🍅', progress: 35 }

export function MobilePrep() {
  const [swiped, setSwiped] = useState(false)

  return (
    <div className="w-full h-screen max-w-sm mx-auto overflow-hidden flex flex-col bg-[var(--bg)] dot-grid">
      {/* Station header */}
      <div className="p-4 border-b-4 border-[var(--ink)]">
        <Pill color="royal" textColor="text-white" className="w-full justify-center">
          Prep Station
        </Pill>
      </div>

      {/* Current item */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
        <div className="text-5xl">{currentItem.emoji}</div>
        <h1 className="display-md text-[var(--ink)]">{currentItem.name}</h1>

        {/* Progress bar */}
        <div className="w-full h-4 bg-[var(--bg-dots)] rounded-full border-2 border-[var(--ink)] overflow-hidden">
          <div
            className="h-full bg-[var(--royal)] transition-all duration-200"
            style={{ width: `${currentItem.progress}%` }}
          />
        </div>
        <div className="text-label text-[var(--ink-soft)]">
          {currentItem.progress}% Prepped
        </div>
      </div>

      {/* Swipe instruction */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <div className="text-label mb-2 text-[var(--ink-soft)]">SWIPE TO CHOP</div>
          <div className="text-sm text-[var(--ink)]">
            Swipe left and right to chop up the {currentItem.name}
          </div>
        </div>

        {/* Swipe target area */}
        <div
          className={`
            w-full aspect-square max-w-48 rounded-2xl border-4 border-dashed
            flex items-center justify-center transition-all
            ${
              swiped
                ? 'bg-[var(--leaf)] border-[var(--leaf)]'
                : 'bg-[var(--surface)] border-[var(--ink)]'
            }
          `}
          onTouchStart={() => setSwiped(false)}
          onTouchEnd={() => setSwiped(true)}
        >
          <div className="text-center">
            <div className="text-2xl mb-2">👆</div>
            <div className="text-xs font-bold text-[var(--ink)]">
              {swiped ? '✓ Nice chop!' : 'Swipe here'}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Queue info */}
      <div className="p-4 border-t-4 border-[var(--ink)]">
        <div className="text-xs text-[var(--ink-soft)] mb-2 text-center">
          1 item waiting at the stove
        </div>
      </div>
    </div>
  )
}
