import React from 'react'
import { MOCK_PLAYERS, MOCK_ORDERS } from '#/data/chop-chop-mock'
import { Card } from '../Card'
import { Button } from '../Button'
import { Pill } from '../Pill'

export function HostResults() {
  const totalScore = 12500
  const completed = 3
  const total = 4

  return (
    <div className="w-screen h-screen bg-[var(--bg)] dot-grid overflow-hidden flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <div className="display-lg text-[var(--leaf)] mb-4">🎉</div>
        <h1 className="display-lg text-[var(--ink)] mb-6">Round Complete!</h1>

        {/* Score summary */}
        <Card className="max-w-2xl mx-auto bg-[var(--sun)] mb-8">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-label mb-2">ORDERS DELIVERED</div>
              <div className="display-md text-[var(--ink)]">
                {completed}/{total}
              </div>
            </div>
            <div>
              <div className="text-label mb-2">TEAM SCORE</div>
              <div className="display-md text-[var(--ink)]">
                {totalScore.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-label mb-2">COMBO</div>
              <div className="display-md text-[var(--ink)]">3x</div>
            </div>
          </div>
        </Card>

        {/* Completed orders */}
        <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
          {MOCK_ORDERS.slice(0, 3).map((order) => (
            <Card key={order.id} className="text-center">
              <div className="text-2xl mb-2">✓</div>
              <div className="font-bold text-sm mb-2">{order.dishName}</div>
              <div className="text-xs text-[var(--ink-soft)]">
                {order.customerName}
              </div>
              <Pill color="leaf" textColor="text-white" className="mt-3 justify-center">
                +1250
              </Pill>
            </Card>
          ))}
        </div>

        {/* Player stats */}
        <div className="flex gap-3 justify-center mb-8">
          {MOCK_PLAYERS.map((player) => (
            <Pill key={player.id} dot dotColor={player.color}>
              <span className="font-bold">{player.name}</span>
              <span className="text-xs opacity-80">• 5 items</span>
            </Pill>
          ))}
        </div>

        {/* Next button */}
        <Button size="lg" variant="success">
          Next Round
        </Button>
      </div>
    </div>
  )
}
