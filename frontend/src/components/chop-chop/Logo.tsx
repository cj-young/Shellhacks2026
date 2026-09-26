import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  rotation?: number;
}

const sizeMap = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-6xl",
};

export function Logo({ size = "md", rotation = 0 }: LogoProps) {
  return (
    <div
      className={`
        inline-flex items-center justify-center
        p-4 rounded-[var(--radius-md)]
        bg-[var(--surface-white)] border-4 border-[var(--ink)]
        shadow-[4px_4px_0_var(--ink)]
        ${sizeMap[size]} font-display font-black
      `}
      style={{
        transform: `rotate(${rotation}deg)`,
        color: "var(--sun)",
        textShadow: `3px 3px 0 var(--ink)`,
      }}
    >
      🔪
    </div>
  );
}
