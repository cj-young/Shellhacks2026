import React from "react";

type ButtonVariant = "primary" | "secondary" | "success" | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-[var(--sun)] text-[var(--ink)] border-[var(--border-width)] border-[var(--ink)]
    shadow-[0_5px_0_var(--ink)]
    relative
  `,
  secondary: `
    bg-[var(--surface)] text-[var(--ink)] border-[var(--border-width)] border-[var(--ink)]
    shadow-[0_5px_0_var(--ink)]
  `,
  success: `
    bg-[var(--leaf)] text-white border-[var(--border-width)] border-[var(--ink)]
    shadow-[0_5px_0_var(--ink)]
  `,
  danger: `
    bg-[var(--tomato)] text-white border-[var(--border-width)] border-[var(--ink)]
    shadow-[0_5px_0_var(--ink)]
  `,
};

const sizeStyles: Record<string, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  icon,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        font-display font-bold rounded-[var(--radius-lg)]
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
        active-press no-tap-highlight
        inline-flex items-center justify-center gap-2
        cursor-pointer
        transition-all duration-100
      `}
      {...props}
    >
      {/* Highlight streak for primary button */}
      {variant === "primary" && (
        <div className="absolute top-1 left-2 w-3 h-1 bg-white rounded-full opacity-70" />
      )}
      {icon}
      {children}
    </button>
  );
}
