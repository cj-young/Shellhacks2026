import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'

export type CursorPoint = {
  x: number
  y: number
}

type CursorPathTrackerProps = {
  /** Called whenever the in-progress path changes, and with [] when it clears. */
  onPointsChange?: (points: CursorPoint[]) => void
}

/**
 * Draws a temporary trail while a mouse, pen, or touch pointer is held down.
 */
export function CursorPathTracker({ onPointsChange }: CursorPathTrackerProps) {
  const [points, setPoints] = useState<CursorPoint[]>([])
  const activePointerId = useRef<number | null>(null)

  useEffect(() => {
    onPointsChange?.(points)
  }, [onPointsChange, points])

  const addPoint = (event: PointerEvent<HTMLDivElement>) => {
    setPoints((currentPoints) => [
      ...currentPoints,
      { x: event.clientX, y: event.clientY },
    ])
  }

  const clearPath = () => {
    activePointerId.current = null
    setPoints([])
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== null) return

    activePointerId.current = event.pointerId
    event.currentTarget.setPointerCapture(event.pointerId)
    setPoints([{ x: event.clientX, y: event.clientY }])
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerId !== activePointerId.current) return
    addPoint(event)
  }

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerId === activePointerId.current) clearPath()
  }

  return (
    <div
      aria-label="Drag anywhere to draw a temporary path"
      className="absolute w-screen min-h-screen touch-none overflow-hidden bg-slate-950"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onLostPointerCapture={handlePointerEnd}
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 h-full w-full"
      >
        {points.length > 1 && (
          <polyline
            fill="none"
            points={points.map(({ x, y }) => `${x},${y}`).join(' ')}
            stroke="rgb(34 211 238)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="5"
          />
        )}
      </svg>

      {/* <div className="pointer-events-none relative mx-auto flex min-h-screen max-w-3xl items-center justify-center p-8 text-center">
        <div className="flex flex-row gap-1 text-sm flex-wrap max-w-[90vw]">
          {points.map(({ x, y }, index) => (
            <div key={index} className="text-white">
              {x},{y}
            </div>
          ))}
        </div>
      </div> */}
    </div>
  )
}
