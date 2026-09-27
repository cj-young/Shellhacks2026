import {
  INK,
  PINK,
  ROYAL,
  SKY,
  SUN,
  Sparkle,
  TOMATO,
  lilita,
  nunito,
} from "../design";
import { FitToViewport } from "../FitToViewport";
import { HostRaceStacks } from "./HostRaceStacks";

import { paper } from "#/components/chop-chop/paper";
const BURST_POINTS =
  "50,2 60,24 84,12 76,38 98,50 76,62 84,88 60,76 50,98 40,76 16,88 24,62 2,50 24,38 16,12 40,24";

/** Hourglass with all the sand run through to the bottom. */
function EmptyHourglass() {
  return (
    <svg
      width="120"
      height="162"
      viewBox="0 0 92 124"
      style={{ filter: "drop-shadow(0 8px 0 rgba(122,78,30,.16))" }}
    >
      <rect
        x="6"
        y="6"
        width="80"
        height="16"
        rx="8"
        fill={ROYAL}
        stroke={INK}
        strokeWidth="5"
      />
      <rect
        x="6"
        y="102"
        width="80"
        height="16"
        rx="8"
        fill={ROYAL}
        stroke={INK}
        strokeWidth="5"
      />
      <path
        d="M16 22 H76 Q76 50 52 62 Q76 74 76 102 H16 Q16 74 40 62 Q16 50 16 22Z"
        fill="#fff"
        stroke={INK}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M22 98 Q24 76 46 70 Q68 76 70 98Z"
        fill={SUN}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Full-screen overlay shown the moment the round timer hits zero. Fills its parent. */
export function TimesUp() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        background: "rgba(122,78,30,.55)",
        animation: "timesUpFade 250ms ease-out both",
      }}
    >
      <style>{`
        @keyframes timesUpFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes timesUpPop {
          0% { transform: scale(.4) rotate(-12deg); opacity: 0 }
          60% { transform: scale(1.08) rotate(2deg); opacity: 1 }
          100% { transform: scale(1) rotate(0deg) }
        }
      `}</style>
      <FitToViewport width={1100} height={760}>
        <div
          style={{
            position: "relative",
            width: 1100,
            height: 760,
            animation: "timesUpPop 520ms cubic-bezier(.2,.9,.3,1.2) both",
            fontFamily: "Nunito, sans-serif",
            color: INK,
          }}
        >
          <svg
            width="700"
            height="700"
            viewBox="0 0 100 100"
            style={{
              position: "absolute",
              left: 200,
              top: 30,
              transform: "rotate(-8deg)",
              filter:
                "drop-shadow(6px 0 0 #fff) drop-shadow(-6px 0 0 #fff) drop-shadow(0 6px 0 #fff) drop-shadow(0 -6px 0 #fff) drop-shadow(0 14px 0 rgba(122,78,30,.2))",
            }}
          >
            <polygon
              points={BURST_POINTS}
              fill={SUN}
              stroke={INK}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>

          <div
            style={{
              position: "absolute",
              left: 490,
              top: 70,
              transform: "rotate(10deg)",
            }}
          >
            <EmptyHourglass />
          </div>

          <div
            style={{
              ...paper(48, 0),
              position: "absolute",
              left: "50%",
              top: 300,
              transform: "translateX(-50%) rotate(-3deg)",
              background: TOMATO,
              padding: "10px 64px 22px",
              font: lilita(150, 1),
              color: "#fff",
              WebkitTextStroke: `14px ${INK}`,
              paintOrder: "stroke fill",
              textShadow: `0 10px 0 ${INK}`,
              whiteSpace: "nowrap",
            }}
          >
            Time's up!
          </div>

          <div
            style={{
              ...paper(26, 1),
              position: "absolute",
              left: "50%",
              top: 560,
              transform: "translateX(-50%) rotate(3deg)",
              background: "#fff",
              padding: "8px 26px",
              font: nunito(900, 34),
              whiteSpace: "nowrap",
            }}
          >
            Hands off the food!
          </div>

          <Sparkle
            kind="star"
            color="#fff"
            size={64}
            rotate={12}
            style={{ position: "absolute", left: 120, top: 140 }}
          />
          <Sparkle
            kind="star"
            color={PINK}
            size={48}
            style={{ position: "absolute", right: 110, top: 190 }}
          />
          <Sparkle
            kind="plus"
            color={SKY}
            size={40}
            style={{ position: "absolute", left: 170, top: 560 }}
          />
          <Sparkle
            kind="star"
            color={SUN}
            size={56}
            rotate={-10}
            style={{ position: "absolute", right: 150, top: 560 }}
          />
          <Sparkle
            kind="dot"
            color="#fff"
            size={26}
            style={{ position: "absolute", left: 300, top: 60 }}
          />
        </div>
      </FitToViewport>
    </div>
  );
}

/** Dev-switcher preview: the overlay over the gameplay screen at 0 seconds. */
export function TimesUpPreview() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <HostRaceStacks secondsLeft={0} />
      <TimesUp />
    </div>
  );
}
