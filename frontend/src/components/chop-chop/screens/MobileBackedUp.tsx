import React, { useEffect, useState } from 'react'
import { Pill } from '../Pill'
import { PLAYER_COLORS } from '#/data/chop-chop-mock'

export function MobileBackedUp() {
  const [isShaking, setIsShaking] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsShaking((s) => !s)
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className={`
        w-full h-screen max-w-sm mx-auto overflow-hidden flex flex-col
        bg-[var(--tomato)] items-center justify-center gap-6 p-6
        transition-transform duration-100
        ${isShaking ? 'scale-100' : 'scale-95'}
      `}
    >
      {/* Animated warning */}
      <div className="text-6xl animate-pulse">🚨</div>

      {/* Message */}
      <div className="text-center">
        <h1 className="display-lg text-white mb-4">YOU'RE BACKED UP!</h1>
        <p className="text-lg text-white font-bold mb-2">Keep it moving, chef!</p>
        <p className="text-sm text-white opacity-80">
          Finish your current items to get back on track
        </p>
      </div>

      {/* Queue count */}
      <Pill color="sun" textColor="text-[var(--ink)]" className="text-lg">
        <span className="font-bold">4 items</span>
        <span>waiting</span>
      </Pill>

      {/* Back to work button */}
      <button
        className={`
          px-8 py-4 rounded-full font-display font-bold text-xl
          bg-white text-[var(--tomato)] border-4 border-white
          shadow-[0_5px_0_var(--tomato)]
          hover:shadow-[0_8px_0_var(--tomato)]
          active-press transition-all
          cursor-pointer
        `}
      >
        Get Back to Work!
      </button>
    </div>
  )
}
