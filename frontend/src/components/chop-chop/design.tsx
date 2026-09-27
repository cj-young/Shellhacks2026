import React from "react";

import { paper } from "./paper";
// Construction-paper palette (see paper.tsx). The old names are kept so every
// screen picks up the new colours; ROYAL/SKY/PINK now map to paper colours.
export const INK = "#3D2817";
export const PAGE_BG = "#FCEBC7";
export const CARD_BG = "#FFF6E3";
export const DOT = "#F2D7A0";
export const SUN = "#FFC20E";
export const LEAF = "#2FA84F";
export const ROYAL = "#127C78";
export const SKY = "#F07F22";
export const PINK = "#F7876B";
export const TOMATO = "#EF4128";
export const MINT = "#CDE8B5";
export const DEEP_GREEN = "#0F7F3F";
export const WOOD = "#B27440";

/** Display font (formerly Sniglet); paper.css thickens it with a stroke. */
export const lilita = (size: number, lineHeight?: number) =>
  `400 ${size}px${lineHeight ? `/${lineHeight}` : ""} Sniglet`;
export const nunito = (weight: number, size: number) =>
  `${weight} ${size}px Nunito`;

type Pos = React.CSSProperties;

export function Sparkle({
  kind = "star",
  color = SUN,
  size = 32,
  rotate = 0,
  style,
}: {
  kind?: "star" | "plus" | "dot";
  color?: string;
  size?: number;
  rotate?: number;
  style?: Pos;
}) {
  return (
    <div
      style={{
        display: "inline-block",
        lineHeight: 0,
        width: size,
        height: size,
        transform: `rotate(${rotate}deg)`,
        pointerEvents: "none",
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{ overflow: "visible" }}
      >
        {kind === "star" && (
          <path
            d="M12 1 Q13.4 10.6 23 12 Q13.4 13.4 12 23 Q10.6 13.4 1 12 Q10.6 10.6 12 1Z"
            fill={color}
          />
        )}
        {kind === "plus" && (
          <path
            d="M12 3 V21 M3 12 H21"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
          />
        )}
        {kind === "dot" && <circle cx="12" cy="12" r="6" fill={color} />}
      </svg>
    </div>
  );
}

export type FoodKind =
  | "tomato"
  | "dumpling"
  | "egg"
  | "onigiri"
  | "mushroom"
  | "greens"
  | "carrot"
  | "sauce"
  | "bowl";

const FACE_Y: Partial<Record<FoodKind, number>> = {
  tomato: 60,
  dumpling: 58,
  egg: 52,
  onigiri: 48,
  mushroom: 72,
  greens: 58,
  carrot: 46,
  sauce: 64,
};

export function Food({
  kind,
  size = 80,
  rotate = 0,
  face = true,
  sticker = true,
  style,
}: {
  kind: FoodKind;
  size?: number;
  rotate?: number;
  face?: boolean;
  sticker?: boolean;
  style?: Pos;
}) {
  const fy = FACE_Y[kind];
  const showFace = face && fy !== undefined;
  const f = fy ?? 50;
  const d = Math.max(2, Math.round(size / 26));
  const filter = sticker
    ? `drop-shadow(${d}px 0 0 #fff) drop-shadow(-${d}px 0 0 #fff) drop-shadow(0 ${d}px 0 #fff) drop-shadow(0 -${d}px 0 #fff) drop-shadow(0 ${d + 2}px 0 rgba(122,78,30,.16))`
    : "none";

  return (
    <div
      style={{
        display: "inline-block",
        lineHeight: 0,
        width: size,
        height: size,
        filter,
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        stroke={INK}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ overflow: "visible" }}
      >
        {kind === "tomato" && (
          <g>
            <circle cx="50" cy="57" r="36" fill="#EF4128" />
            <path
              d="M32 26 Q42 31 50 22 Q58 31 68 26 Q63 36 50 36 Q37 36 32 26Z"
              fill="#2FA84F"
            />
            <path d="M50 22 L52 11" />
            <ellipse
              cx="31"
              cy="46"
              rx="7"
              ry="4.5"
              transform="rotate(-35 31 46)"
              fill="#fff"
              stroke="none"
            />
          </g>
        )}
        {kind === "dumpling" && (
          <g>
            <path
              d="M9 68 Q11 29 50 27 Q89 29 91 68 Q50 83 9 68Z"
              fill="#FFF1D2"
            />
            <path
              d="M36 33 Q40 41 36 47 M50 29 Q54 39 50 45 M64 33 Q68 41 64 47"
              strokeWidth="3.5"
            />
            <ellipse
              cx="24"
              cy="54"
              rx="6"
              ry="4"
              transform="rotate(-40 24 54)"
              fill="#fff"
              stroke="none"
            />
          </g>
        )}
        {kind === "egg" && (
          <g>
            <path
              d="M18 50 Q14 20 46 18 Q80 12 86 42 Q94 72 64 84 Q30 92 18 70 Q10 60 18 50Z"
              fill="#fff"
            />
            <circle cx="52" cy="50" r="19" fill="#FFC20E" />
            <ellipse
              cx="45"
              cy="42"
              rx="5"
              ry="3.5"
              transform="rotate(-30 45 42)"
              fill="#fff"
              stroke="none"
            />
          </g>
        )}
        {kind === "onigiri" && (
          <g>
            <path
              d="M50 12 Q60 12 84 60 Q92 82 70 84 L30 84 Q8 82 16 60 Q40 12 50 12Z"
              fill="#fff"
            />
            <rect x="36" y="64" width="28" height="20" rx="3" fill="#1E5A45" />
          </g>
        )}
        {kind === "mushroom" && (
          <g>
            <path d="M36 56 L34 84 Q50 92 66 84 L64 56 Z" fill="#FFF1D2" />
            <path d="M10 58 Q12 16 50 16 Q88 16 90 58 Z" fill="#EF4128" />
            <circle cx="33" cy="36" r="6" fill="#fff" stroke="none" />
            <circle cx="57" cy="28" r="5" fill="#fff" stroke="none" />
            <circle cx="72" cy="45" r="5" fill="#fff" stroke="none" />
          </g>
        )}
        {kind === "greens" && (
          <g>
            <path
              d="M50 92 Q14 72 22 30 Q38 10 50 32 Q62 10 78 30 Q86 72 50 92Z"
              fill="#2FA84F"
            />
            <path d="M50 38 L50 86" />
            <ellipse
              cx="34"
              cy="38"
              rx="5"
              ry="3"
              transform="rotate(-40 34 38)"
              fill="#fff"
              stroke="none"
            />
          </g>
        )}
        {kind === "carrot" && (
          <g>
            <ellipse
              cx="42"
              cy="18"
              rx="6"
              ry="12"
              transform="rotate(-25 42 18)"
              fill="#2FA84F"
            />
            <ellipse
              cx="58"
              cy="18"
              rx="6"
              ry="12"
              transform="rotate(25 58 18)"
              fill="#2FA84F"
            />
            <path
              d="M50 92 Q28 62 28 44 Q28 28 50 28 Q72 28 72 44 Q72 62 50 92Z"
              fill="#FF9A3C"
            />
            <path d="M36 60 L42 60 M56 70 L62 70" strokeWidth="3.5" />
          </g>
        )}
        {kind === "sauce" && (
          <g>
            <path
              d="M50 10 Q78 46 76 64 Q74 88 50 88 Q26 88 24 64 Q22 46 50 10Z"
              fill="#EF4128"
            />
            <ellipse
              cx="36"
              cy="54"
              rx="5"
              ry="8"
              transform="rotate(20 36 54)"
              fill="#fff"
              stroke="none"
            />
          </g>
        )}
        {kind === "bowl" && (
          <g>
            <path d="M16 50 Q20 22 50 22 Q80 22 84 50 Z" fill="#fff" />
            <ellipse
              cx="32"
              cy="40"
              rx="9"
              ry="6"
              fill="#2FA84F"
              strokeWidth="3.5"
            />
            <circle cx="70" cy="40" r="8" fill="#EF4128" strokeWidth="3.5" />
            <circle cx="50" cy="33" r="9" fill="#FFC20E" strokeWidth="3.5" />
            <path d="M8 50 H92 Q90 88 50 90 Q10 88 8 50Z" fill="#127C78" />
            <circle cx="30" cy="66" r="3" fill="#fff" stroke="none" />
            <circle cx="50" cy="72" r="3" fill="#fff" stroke="none" />
            <circle cx="70" cy="66" r="3" fill="#fff" stroke="none" />
            <ellipse
              cx="20"
              cy="60"
              rx="3"
              ry="6"
              fill="#F07F22"
              stroke="none"
            />
          </g>
        )}
        {showFace && (
          <g>
            <circle cx={40} cy={f} r="3.8" fill={INK} stroke="none" />
            <circle cx={60} cy={f} r="3.8" fill={INK} stroke="none" />
            <ellipse
              cx={31}
              cy={f + 7}
              rx="5"
              ry="3"
              fill={PINK}
              stroke="none"
            />
            <ellipse
              cx={69}
              cy={f + 7}
              rx="5"
              ry="3"
              fill={PINK}
              stroke="none"
            />
            <path
              d={`M45 ${f + 5} Q50 ${f + 10} 55 ${f + 5}`}
              strokeWidth="3"
            />
          </g>
        )}
      </svg>
    </div>
  );
}

// Stands in for the design's Chef art: same footprint (size × ~1.19·size, or size × ~0.89·size for busts).
export function ChefPlaceholder({
  color,
  size,
  bust = false,
  style,
}: {
  color: string;
  size: number;
  bust?: boolean;
  style?: Pos;
}) {
  const height = Math.round(size * (bust ? 48 / 54 : 214 / 180));
  const diameter = Math.min(size, height);
  return (
    <div
      style={{
        width: size,
        height,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        flexShrink: 0,
        ...style,
      }}
    >
      <div
        style={{
          ...paper("50%", 0),
          width: diameter,
          height: diameter,
          background: color,
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

export function PhoneFrame({
  background,
  lightChrome = false,
  children,
}: {
  background: React.CSSProperties;
  lightChrome?: boolean;
  children: React.ReactNode;
}) {
  const chrome = lightChrome ? "#fff" : INK;
  return (
    <div
      style={{
        width: 410,
        height: 864,
        background: INK,
        borderRadius: 62,
        padding: 10,
        boxSizing: "border-box",
        boxShadow: "0 24px 50px rgba(122,78,30,.25)",
      }}
    >
      <div
        style={{
          width: 390,
          height: 844,
          borderRadius: 52,
          overflow: "hidden",
          position: "relative",
          fontFamily: "Nunito, sans-serif",
          color: INK,
          ...background,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 30px 0 38px",
            font: nunito(800, 16),
            color: chrome,
          }}
        >
          <span>9:41</span>
          <span style={{ ...paper(4, 1), width: 26, height: 13 }} />
        </div>
        <div
          style={{
            position: "absolute",
            top: 11,
            left: "50%",
            transform: "translateX(-50%)",
            width: 118,
            height: 34,
            borderRadius: 17,
            background: INK,
          }}
        />
        {children}
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            width: 134,
            height: 5,
            borderRadius: 3,
            background: chrome,
            opacity: lightChrome ? 0.6 : 0.5,
          }}
        />
      </div>
    </div>
  );
}

export function NamePill({
  name,
  color,
  size = 32,
  maxWidth,
}: {
  name: string;
  color: string;
  size?: number;
  maxWidth?: number;
}) {
  return (
    <div
      style={{
        ...paper(28, 2, false),
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#fff",
        padding: "6px 20px 6px 8px",
        boxShadow: "var(--paper-shadow)",
        maxWidth,
        boxSizing: maxWidth ? "border-box" : undefined,
      }}
    >
      <span
        style={{
          ...paper("50%", 3),
          width: 26,
          height: 26,
          flexShrink: 0,
          background: color,
        }}
      />
      <span
        style={{
          font: lilita(size),
          ...(maxWidth
            ? {
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }
            : {}),
        }}
      >
        {name}
      </span>
    </div>
  );
}

/** The Chop Chop cleaver logo (public/assets/logo-chop-chop.png, 1200×612). */
export function ChopChopLogo({
  width,
  style,
}: {
  width: number | string;
  style?: React.CSSProperties;
}) {
  return (
    <img
      src="/assets/logo-chop-chop.png"
      alt="Chop Chop"
      draggable={false}
      style={{
        display: "block",
        width,
        height: "auto",
        aspectRatio: "1200 / 612",
        filter: "drop-shadow(0 8px 0 rgba(122,78,30,.14))",
        ...style,
      }}
    />
  );
}
