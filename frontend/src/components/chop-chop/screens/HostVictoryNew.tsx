import type React from "react";
import {
  ChefPlaceholder,
  Food,
  INK,
  LEAF,
  MINT,
  PINK,
  ROYAL,
  SUN,
  Sparkle,
  lilita,
  nunito,
} from "../design";
import type { FoodKind } from "../design";

import { paper } from "#/components/chop-chop/paper";
const RESULTS: {
  station: string;
  color: string;
  items: number;
  dish: FoodKind;
  fast: string;
  assists: number;
  rot: number;
  mvp: boolean;
}[] = [
  {
    station: "Prep",
    color: ROYAL,
    items: 31,
    dish: "tomato",
    fast: "0:06",
    assists: 1,
    rot: -2,
    mvp: false,
  },
  {
    station: "Stove",
    color: "#EF4128",
    items: 22,
    dish: "dumpling",
    fast: "0:11",
    assists: 0,
    rot: 2,
    mvp: false,
  },
  {
    station: "Sauce",
    color: "#0F7F3F",
    items: 18,
    dish: "sauce",
    fast: "0:09",
    assists: 5,
    rot: -1.5,
    mvp: true,
  },
  {
    station: "Plating",
    color: PINK,
    items: 20,
    dish: "bowl",
    fast: "0:07",
    assists: 2,
    rot: 2.5,
    mvp: false,
  },
];

// Same seeded generator as the design file, so the confetti layout matches exactly.
export const CONFETTI = (() => {
  const cols = [
    ROYAL,
    "#F07F22",
    "#0F7F3F",
    LEAF,
    SUN,
    "#EF4128",
    PINK,
    "#fff",
  ];
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  return Array.from({ length: 70 }, (_, i) => {
    const round = rnd() < 0.35;
    const w = round ? 16 + rnd() * 10 : 12 + rnd() * 10;
    return {
      x: Math.round(rnd() * 1880),
      y: Math.round(rnd() * 1040),
      w: Math.round(w),
      h: Math.round(round ? w : w * (1.8 + rnd())),
      r: round ? "50%" : "4px",
      color: cols[i % cols.length],
      rot: Math.round(rnd() * 180),
    };
  });
})();

const STAR_POINTS = "50,6 62,36 94,38 69,58 78,90 50,72 22,90 31,58 6,38 38,36";

function Star({ size, style }: { size: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <polygon
        points={STAR_POINTS}
        fill={SUN}
        stroke="#fff"
        strokeWidth="16"
        strokeLinejoin="round"
      />
      <polygon
        points={STAR_POINTS}
        fill={SUN}
        stroke={INK}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <ellipse cx="42" cy="36" rx="6" ry="4" fill="#fff" />
    </svg>
  );
}

const statLabel = { font: nunito(900, 20) };

export function HostVictoryNew({
  onLobby,
  onNextRound,
}: {
  onLobby?: () => void;
  onNextRound?: () => void;
} = {}) {
  return (
    <div
      style={{
        ...paper(32, 0),
        width: 1920,
        height: 1080,
        position: "relative",
        overflow: "hidden",
        background: "#EEF8D6",
        boxSizing: "border-box",
        fontFamily: "Nunito, sans-serif",
        color: INK,
      }}
    >
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          style={{
            ...paper(c.r, 1),
            position: "absolute",
            left: c.x,
            top: c.y,
            width: c.w,
            height: c.h,
            background: c.color,
            transform: `rotate(${c.rot}deg)`,
          }}
        />
      ))}
      <Sparkle
        kind="star"
        color={SUN}
        size={64}
        style={{ position: "absolute", left: 520, top: 60 }}
      />
      <Sparkle
        kind="star"
        color="#fff"
        size={44}
        style={{ position: "absolute", left: 1370, top: 50 }}
      />
      <Sparkle
        kind="plus"
        color={PINK}
        size={36}
        style={{ position: "absolute", left: 1440, top: 170 }}
      />

      <div
        style={{
          ...paper(48, 2),
          position: "absolute",
          left: "50%",
          top: 44,
          transform: "translateX(-50%) rotate(-3deg)",
          background: ROYAL,
          padding: "10px 70px 22px",
          font: lilita(130, 1),
          color: "#fff",
          WebkitTextStroke: `14px ${INK}`,
          paintOrder: "stroke fill",
          whiteSpace: "nowrap",
        }}
      >
        Round Clear!
      </div>

      <div
        style={{
          position: "absolute",
          left: 90,
          top: 300,
          width: 470,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 34,
        }}
      >
        <div
          style={{
            ...paper("50%", 3),
            position: "relative",
            width: 440,
            height: 440,
            background: SUN,
            boxSizing: "border-box",
            transform: "rotate(-3deg)",
          }}
        >
          <svg
            viewBox="0 0 428 428"
            width="428"
            height="428"
            style={{ position: "absolute", inset: 0 }}
          >
            <defs>
              <path id="arcScore" d="M44 214 A170 170 0 0 1 384 214" />
            </defs>
            <text
              fontFamily="Sniglet"
              fontSize="40"
              fill={INK}
              letterSpacing="5"
            >
              <textPath href="#arcScore" startOffset="50%" textAnchor="middle">
                ✦ TEAM SCORE ✦
              </textPath>
            </text>
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 40,
              gap: 10,
            }}
          >
            <span style={{ font: lilita(128, 1) }}>3,480</span>
            <span
              style={{
                ...paper(22, 4),
                background: "#fff",
                padding: "4px 18px",
                font: nunito(900, 22),
              }}
            >
              Best round yet
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Star size={120} style={{ transform: "rotate(-12deg)" }} />
          <Star size={140} style={{ marginTop: -30 }} />
          <Star size={120} style={{ transform: "rotate(12deg)" }} />
        </div>
        <span style={{ font: nunito(900, 30), marginTop: -18 }}>
          3 of 3 stars
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          left: 660,
          right: 90,
          top: 300,
          display: "grid",
          gridTemplateColumns: "repeat(4,minmax(0,1fr))",
          gap: 30,
        }}
      >
        {RESULTS.map((r) => (
          <div
            key={r.station}
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transform: `rotate(${r.rot}deg)`,
            }}
          >
            <ChefPlaceholder
              color={r.color}
              size={170}
              style={{ position: "relative", zIndex: 2, marginBottom: -26 }}
            />
            <div
              style={{
                ...paper(32, 5),
                position: "relative",
                alignSelf: "stretch",
                background: "#fff",
                padding: "40px 22px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  alignSelf: "center",
                }}
              >
                <span
                  style={{
                    ...paper("50%", 6),
                    width: 26,
                    height: 26,
                    background: r.color,
                  }}
                />
                <span style={{ font: lilita(34) }}>{r.station}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  borderTop: `3px dashed ${MINT}`,
                  paddingTop: 12,
                }}
              >
                <span style={statLabel}>Items handled</span>
                <span style={{ font: lilita(46, 1) }}>{r.items}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={statLabel}>Fastest dish</span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    font: lilita(34, 1),
                  }}
                >
                  <Food kind={r.dish} size={40} sticker={false} />
                  {r.fast}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <span style={statLabel}>Assists</span>
                <span style={{ font: lilita(34, 1) }}>{r.assists}</span>
              </div>
            </div>
            {r.mvp && (
              <div
                style={{
                  ...paper("50%", 7),
                  position: "absolute",
                  right: -34,
                  top: -30,
                  zIndex: 3,
                  width: 150,
                  height: 150,
                  background: PINK,
                  boxSizing: "border-box",
                  transform: "rotate(3deg)",
                }}
              >
                <svg
                  viewBox="0 0 140 140"
                  width="140"
                  height="140"
                  style={{ position: "absolute", inset: 0 }}
                >
                  <defs>
                    <path id="arcMvp" d="M20 70 A50 50 0 0 1 120 70" />
                  </defs>
                  <text
                    fontFamily="Sniglet"
                    fontSize="21"
                    fill={INK}
                    letterSpacing="2"
                  >
                    <textPath
                      href="#arcMvp"
                      startOffset="50%"
                      textAnchor="middle"
                    >
                      MVP HELPER
                    </textPath>
                  </text>
                </svg>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingTop: 22,
                    lineHeight: 1,
                  }}
                >
                  <span style={{ font: lilita(50) }}>{r.assists}</span>
                  <span style={{ font: nunito(900, 16) }}>assists</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          right: 90,
          bottom: 60,
          display: "flex",
          alignItems: "center",
          gap: 30,
        }}
      >
        <div
          onClick={onLobby}
          role={onLobby ? "button" : undefined}
          style={{
            ...paper(52, 8),
            height: 104,
            padding: "0 44px",
            background: "#fff",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            font: lilita(46),
            cursor: "pointer",
          }}
        >
          Lobby
        </div>
        <div
          onClick={onNextRound}
          role={onNextRound ? "button" : undefined}
          style={{
            ...paper(62, 9),
            position: "relative",
            height: 124,
            padding: "0 64px",
            background: LEAF,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            font: lilita(70),
            cursor: "pointer",
          }}
        >
          Next Round!
        </div>
      </div>
    </div>
  );
}
