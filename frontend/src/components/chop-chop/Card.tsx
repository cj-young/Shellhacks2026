import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  highlight?: boolean
}

export function Card({ children, className = '', highlight }: CardProps) {
  return (
    <div
      className={`
        bg-[var(--surface)] rounded-[var(--radius-lg)]
        border-[var(--border-width)] border-[var(--ink)]
        p-6 shadow-[0_5px_0_var(--ink)]
        ${highlight ? 'ring-2 ring-[var(--royal)]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
