import React from "react";

interface AvatarProps {
  color: string;
  size?: "sm" | "md" | "lg" | "xl";
  initials?: string;
  isSelected?: boolean;
  isTaken?: boolean;
  takenBy?: string;
}

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-16 h-16 text-lg",
  xl: "w-24 h-24 text-2xl",
};

export function Avatar({
  color,
  size = "md",
  initials,
  isSelected,
  isTaken,
  takenBy,
}: AvatarProps) {
  return (
    <div className="relative inline-flex flex-col items-center">
      <div
        className={`
          rounded-full flex items-center justify-center
          ${sizeMap[size]}
          border-[var(--border-width)] border-[var(--ink)]
          font-bold text-white
          ${isTaken ? "opacity-40" : ""}
          transition-all duration-150
        `}
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>

      {/* Selection ring */}
      {isSelected && (
        <div className="absolute inset-0 rounded-full border-2 border-[var(--royal)] pointer-events-none" />
      )}

      {/* Selected check badge */}
      {isSelected && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[var(--leaf)] rounded-full flex items-center justify-center text-white text-xs font-bold border border-white">
          ✓
        </div>
      )}

      {/* Taken label */}
      {isTaken && takenBy && (
        <div className="mt-1 text-xs font-bold text-center text-[var(--ink-soft)]">
          Taken by {takenBy}
        </div>
      )}
    </div>
  );
}
