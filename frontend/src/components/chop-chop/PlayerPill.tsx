import React from "react";

interface PlayerPillProps {
  name: string;
  color: string;
  onRemove?: () => void;
}

export function PlayerPill({ name, color, onRemove }: PlayerPillProps) {
  return (
    <div
      className={`
        inline-flex items-center gap-2
        px-4 py-2 rounded-full
        bg-[var(--surface-white)] border-[var(--border-width)]
        font-bold text-sm text-[var(--ink)]
        relative
      `}
      style={{ borderColor: color }}
    >
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      {name}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 text-xs opacity-60 hover:opacity-100 font-bold"
        >
          ×
        </button>
      )}
    </div>
  );
}
