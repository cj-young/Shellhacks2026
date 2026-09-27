import React from "react";

/** Construction-paper palette, pulled from the veggie background art. */
export const P = {
  bg: "#FCEBC7",
  card: "#FFF6E3",
  // Text and marks: warm espresso brown (no navy in the paper look).
  ink: "#3D2817",
  tomato: "#EF4128",
  carrot: "#F07F22",
  sun: "#FFC20E",
  leaf: "#2FA84F",
  deepGreen: "#0F7F3F",
  teal: "#127C78",
  wood: "#B27440",
} as const;

export type PaperColor = Exclude<keyof typeof P, "bg">;

/** Dark fills take cream text; everything else takes ink. */
const DARK: PaperColor[] = ["tomato", "deepGreen", "teal", "wood", "ink"];
export const textOn = (color: PaperColor) =>
  DARK.includes(color) ? P.card : P.ink;

// Sniglet ships in 400 and 800 only: 800 is too heavy to read and 400 too thin, so
// 400 is thickened with a same-colour stroke painted behind the fill. Spread it
// into a style object: `...sniglet(40)`.
export const sniglet = (
  size: number,
  lineHeight?: number,
): React.CSSProperties => ({
  font: `400 ${size}px${lineHeight ? `/${lineHeight}` : ""} Sniglet`,
  WebkitTextStroke: "0.07em currentColor",
  paintOrder: "stroke fill",
});
export const nunito = (weight: number, size: number) =>
  `${weight} ${size}px Nunito`;

/** Hand-cut corner shapes; components pick different ones so nothing matches exactly. */
const CUTS = [
  "22px 30px 18px 28px / 26px 20px 30px 22px",
  "28px 20px 26px 16px / 20px 28px 18px 26px",
  "18px 26px 30px 22px / 24px 18px 26px 30px",
  "30px 18px 22px 26px / 18px 26px 22px 28px",
  "24px 28px 16px 30px / 28px 22px 30px 18px",
  "20px 24px 28px 18px / 30px 24px 20px 26px",
];
export const cut = (i: number) => CUTS[i % CUTS.length];

/** Same shapes, stretched for pill-length elements. */
const PILL_CUTS = [
  "40px 46px 38px 48px / 34px 40px 36px 42px",
  "46px 38px 44px 40px / 40px 34px 42px 36px",
  "38px 48px 40px 44px / 36px 42px 34px 40px",
];
export const pillCut = (i: number) => PILL_CUTS[i % PILL_CUTS.length];

/**
 * Turns a radius into an uneven hand-cut one. `seed` picks the variation so
 * neighbouring shapes don't match.
 */
export function handCut(radius: number | string, seed = 0): string {
  if (typeof radius === "string") {
    if (radius.trim() === "50%") {
      return [
        "52% 48% 50% 46% / 48% 52% 46% 50%",
        "47% 53% 49% 51% / 53% 47% 51% 49%",
        "50% 46% 53% 48% / 46% 51% 48% 54%",
      ][seed % 3];
    }
    return radius;
  }
  if (radius <= 0) return "0";
  const f = [
    [0.8, 1.15, 0.9, 1.2, 1.1, 0.85, 1.2, 0.9],
    [1.15, 0.85, 1.1, 0.8, 0.9, 1.2, 0.85, 1.1],
    [0.9, 1.1, 1.2, 0.85, 1.15, 0.9, 1.05, 1.2],
    [1.2, 0.85, 0.9, 1.1, 0.85, 1.1, 0.9, 1.15],
  ][seed % 4];
  const r = f.map((k) => `${Math.round(radius * k)}px`);
  return `${r.slice(0, 4).join(" ")} / ${r.slice(4).join(" ")}`;
}

/**
 * Paper-cutout look for an inline-styled shape: no outline, hand-cut corners,
 * grain (via the `--paper` marker in paper.css) and, unless `shadow` is false,
 * the lifted paper shadow. Spread it last in a style object.
 */
export function paper(
  radius: number | string = 0,
  seed = 0,
  shadow = true,
): React.CSSProperties {
  return {
    ["--paper" as string]: 1,
    border: "none",
    borderRadius: handCut(radius, seed),
    ...(shadow && { boxShadow: "var(--paper-shadow)" }),
  };
}

type ForcedState = "hover" | "pressed";

export function PaperButton({
  color = "sun",
  size = "lg",
  cutIndex = 0,
  selected = false,
  disabled,
  state,
  children,
  onClick,
  style,
}: {
  color?: PaperColor;
  size?: "lg" | "md" | "sm";
  cutIndex?: number;
  selected?: boolean;
  disabled?: boolean;
  /** Shows hover/pressed without interaction (style test). */
  state?: ForcedState;
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const dims = {
    lg: { height: 84, font: 40, pad: 36 },
    md: { height: 62, font: 28, pad: 26 },
    sm: { height: 46, font: 20, pad: 18 },
  }[size];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected || undefined}
      className={`paper paper-btn${state ? ` is-${state}` : ""}`}
      style={{
        height: dims.height,
        padding: `0 ${dims.pad}px`,
        borderRadius: pillCut(cutIndex),
        background: P[color],
        color: textOn(color),
        ...sniglet(dims.font),
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        whiteSpace: "nowrap",
        ...(selected && {
          boxShadow: `0 0 0 6px ${P.card}, 0 0 0 9px ${P[color]}, var(--paper-shadow)`,
        }),
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function PaperPill({
  color = "card",
  cutIndex = 0,
  children,
  style,
}: {
  color?: PaperColor;
  cutIndex?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className="paper"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 20px",
        borderRadius: pillCut(cutIndex),
        background: P[color],
        color: textOn(color),
        font: nunito(900, 20),
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function PaperCard({
  color = "card",
  cutIndex = 0,
  tilt = 0,
  children,
  style,
}: {
  color?: PaperColor;
  cutIndex?: number;
  tilt?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="paper"
      style={{
        background: P[color],
        color: textOn(color),
        borderRadius: cut(cutIndex),
        padding: 24,
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Small round-ish count or status badge. */
export function PaperBadge({
  color = "tomato",
  size = 44,
  cutIndex = 0,
  children,
}: {
  color?: PaperColor;
  size?: number;
  cutIndex?: number;
  children: React.ReactNode;
}) {
  const r = ["52% 48% 50% 46%", "46% 54% 48% 52%", "50% 46% 54% 48%"][
    cutIndex % 3
  ];
  return (
    <span
      className="paper"
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: P[color],
        color: textOn(color),
        ...sniglet(Math.round(size * 0.5), 1),
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </span>
  );
}

/** Big headline strip ("Time's up!", "Round clear"). */
export function PaperBanner({
  color = "tomato",
  tilt = -2,
  size = 56,
  children,
}: {
  color?: PaperColor;
  tilt?: number;
  size?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="paper"
      style={{
        display: "inline-block",
        padding: `${size * 0.22}px ${size * 0.7}px`,
        borderRadius: "14px 22px 12px 26px / 20px 12px 24px 14px",
        background: P[color],
        color: textOn(color),
        ...sniglet(size, 1.1),
        transform: `rotate(${tilt}deg)`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}

/** Small label sticker ("KITCHEN RELAY", "NEW!"). */
export function PaperTag({
  color = "leaf",
  tilt = 3,
  children,
}: {
  color?: PaperColor;
  tilt?: number;
  children: React.ReactNode;
}) {
  return (
    <span
      className="paper"
      style={{
        display: "inline-block",
        padding: "6px 16px",
        borderRadius: "10px 16px 8px 14px / 14px 8px 16px 10px",
        background: P[color],
        color: textOn(color),
        ...sniglet(20),
        letterSpacing: ".04em",
        transform: `rotate(${tilt}deg)`,
      }}
    >
      {children}
    </span>
  );
}

export function PaperInput({
  value,
  placeholder,
  focused = false,
  disabled,
  onChange,
}: {
  value: string;
  placeholder?: string;
  /** Shows the focus look without focusing (style test). */
  focused?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div
      className="paper"
      style={{
        height: 64,
        borderRadius: pillCut(1),
        background: "#fff",
        opacity: disabled ? 0.55 : 1,
        boxShadow: focused
          ? `0 0 0 5px ${P.sun}, var(--paper-shadow)`
          : "inset 1px 3px 0 rgba(122,78,30,.12), var(--paper-shadow-pressed)",
      }}
    >
      <input
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          width: "100%",
          height: "100%",
          background: "transparent",
          border: "none",
          outline: "none",
          padding: "0 22px",
          font: nunito(800, 26),
          color: P.ink,
          caretColor: P.carrot,
        }}
      />
    </div>
  );
}

export function PaperTimer({
  seconds,
  urgent = false,
}: {
  seconds: number;
  urgent?: boolean;
}) {
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, "0");
  const color: PaperColor = urgent ? "tomato" : "card";
  return (
    <div
      className="paper"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 26px 8px 14px",
        borderRadius: pillCut(2),
        background: P[color],
        color: textOn(color),
        ...sniglet(44, 1),
      }}
    >
      <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden>
        <circle
          cx="12"
          cy="13"
          r="9"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
        />
        <path
          d="M12 8 V13 L15 15 M10 2 H14"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {m}:{s}
    </div>
  );
}

export function PaperScore({
  points,
  label = "PTS",
}: {
  points: number;
  label?: string;
}) {
  return (
    <div
      className="paper"
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 8,
        padding: "10px 22px",
        borderRadius: cut(3),
        background: P.sun,
        color: P.ink,
      }}
    >
      <span style={{ ...sniglet(44, 1) }}>{points.toLocaleString()}</span>
      <span style={{ font: nunito(900, 16), letterSpacing: ".12em" }}>
        {label}
      </span>
    </div>
  );
}

export function PaperRoomCode({
  code,
  tilt = -2,
}: {
  code: string;
  tilt?: number;
}) {
  return (
    <div
      className="paper"
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "14px 44px 18px",
        borderRadius: cut(4),
        background: P.sun,
        color: P.ink,
        transform: `rotate(${tilt}deg)`,
      }}
    >
      <span style={{ font: nunito(900, 20), letterSpacing: ".14em" }}>
        ROOM CODE
      </span>
      <span style={{ ...sniglet(96, 1), letterSpacing: ".1em" }}>{code}</span>
    </div>
  );
}
