import React from 'react'

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function TextInput({ label, error, className = '', ...props }: TextInputProps) {
  return (
    <div className="w-full">
      {label && <label className="text-label block mb-2 text-[var(--ink)]">{label}</label>}
      <input
        className={`
          w-full px-4 py-3 rounded-[var(--radius-md)]
          bg-[var(--surface)] border-[var(--border-width)] border-[var(--ink)]
          font-body font-bold text-[var(--ink)]
          placeholder:text-[var(--ink-soft)]
          focus:outline-none focus:ring-2 focus:ring-[var(--royal)] focus:border-[var(--ink)]
          transition-all duration-150
          ${error ? 'border-[var(--tomato)] focus:ring-[var(--tomato)]' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm font-bold text-[var(--tomato)]">{error}</p>}
    </div>
  )
}
