import React from "react";

interface PillProps {
  children: React.ReactNode;
  color?: "default" | "royal" | "sky" | "sun" | "leaf" | "tomato" | "pink";
  textColor?: string;
  className?: string;
  dot?: boolean;
  dotColor?: string;
}

const colorMap: Record<string, string> = {
  default: "bg-[var(--surface)]",
  royal: "bg-[var(--royal)]",
  sky: "bg-[var(--sky)]",
  sun: "bg-[var(--sun)]",
  leaf: "bg-[var(--leaf)]",
  tomato: "bg-[var(--tomato)]",
  pink: "bg-[var(--pink)]",
};

const textColorMap: Record<string, string> = {
  default: "text-[var(--ink)]",
  royal: "text-white",
  sky: "text-white",
  sun: "text-[var(--ink)]",
  leaf: "text-white",
  tomato: "text-white",
  pink: "text-white",
};

export function Pill({
  children,
  color = "default",
  textColor,
  className = "",
  dot,
  dotColor,
}: PillProps) {
  const bgClass = colorMap[color];
  const txtClass = textColor || textColorMap[color];

  return (
    <div
      className={`
        inline-flex items-center gap-2
        px-4 py-2 rounded-full
        border-[var(--border-width)] border-[var(--ink)]
        font-bold text-sm
        ${bgClass}
        ${txtClass}
        ${className}
      `}
    >
      {dot && (
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0`}
          style={{ backgroundColor: dotColor || "currentColor" }}
        />
      )}
      {children}
    </div>
  );
}
