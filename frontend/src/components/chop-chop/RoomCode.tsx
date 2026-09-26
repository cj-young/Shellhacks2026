import React from 'react'
import { Card } from './Card'

interface RoomCodeProps {
  code: string
  variant?: 'mobile' | 'host'
}

export function RoomCode({ code, variant = 'mobile' }: RoomCodeProps) {
  if (variant === 'mobile') {
    return (
      <div className="flex gap-2 justify-center">
        {code.split('').map((letter, i) => (
          <div
            key={i}
            className={`
              w-12 h-12 flex items-center justify-center
              bg-[var(--surface-white)] rounded-[var(--radius-sm)]
              border-[var(--border-width)] border-[var(--ink)]
              shadow-[0_2px_0_var(--ink)]
              font-display text-xl font-bold text-[var(--ink)]
            `}
          >
            {letter}
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className="bg-[var(--sun)]">
      <div className="text-center">
        <div className="text-label text-[var(--ink)] mb-2">ROOM CODE</div>
        <div className="display-lg text-[var(--ink)]" style={{ letterSpacing: '0.1em' }}>
          {code}
        </div>
      </div>
    </Card>
  )
}
