import type React from "react";
import { INK, ROYAL, SKY, SUN, TOMATO, lilita } from "./design";
import { Ingredient } from "./Ingredient";
import type { IngredientKind } from "./Ingredient";

export type GameIconKind =
  "chop" | "stir" | "flip" | "steal" | "blackout" | "basket";

export function GameIcon({
  kind,
  size = 80,
  sticker = true,
  rotate = 0,
  style,
}: {
  kind: GameIconKind;
  size?: number;
  sticker?: boolean;
  rotate?: number;
  style?: React.CSSProperties;
}) {
  const d = Math.max(2, Math.round(size / 26));
  const filter = sticker
    ? `drop-shadow(${d}px 0 0 #fff) drop-shadow(-${d}px 0 0 #fff) drop-shadow(0 ${d}px 0 #fff) drop-shadow(0 -${d}px 0 #fff)`
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
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ overflow: "visible" }}
      >
        {kind === "chop" && (
          <g>
            <ellipse cx="72" cy="84" rx="10" ry="6" fill="#3CB54A" />
            <ellipse cx="88" cy="78" rx="8" ry="5" fill="#3CB54A" />
            <g transform="rotate(-32 50 50)">
              <rect x="2" y="54" width="26" height="16" rx="6" fill="#1F4FD8" />
              <path
                d="M28 52 L66 52 Q86 52 94 36 Q96 70 66 72 L28 72Z"
                fill="#fff"
              />
              <path d="M36 60 L60 60" stroke="#CFE6FB" strokeWidth="4" />
            </g>
            <path d="M18 86 L30 80 M24 94 L38 90" strokeWidth="4" />
          </g>
        )}
        {kind === "stir" && (
          <g>
            <path d="M58 50 L74 8" strokeWidth="12" />
            <path d="M58 50 L74 8" stroke="#E9A866" strokeWidth="5" />
            <rect x="8" y="44" width="84" height="12" rx="6" fill="#1F4FD8" />
            <path
              d="M14 56 H86 L80 82 Q78 90 70 90 H30 Q22 90 20 82Z"
              fill="#4FB3F0"
            />
            <path d="M40 30 A26 10 0 1 0 22 22" strokeWidth="5" />
            <path d="M14 16 L24 22 L16 30" strokeWidth="5" />
          </g>
        )}
        {kind === "flip" && (
          <g>
            <path d="M70 76 L96 70" strokeWidth="12" />
            <path d="M70 76 L96 70" stroke="#F2553D" strokeWidth="5" />
            <ellipse cx="42" cy="78" rx="32" ry="11" fill="#4A4F8C" />
            <ellipse
              cx="46"
              cy="30"
              rx="24"
              ry="9"
              transform="rotate(-18 46 30)"
              fill="#F2BE63"
            />
            <path d="M14 62 Q8 40 22 24" strokeWidth="5" />
            <path d="M14 26 L23 22 L26 32" strokeWidth="5" />
            <path d="M72 42 L80 36 M76 52 L86 50" strokeWidth="4" />
          </g>
        )}
        {kind === "steal" && (
          <g>
            <path d="M34 72 L66 72 L70 98 L30 98Z" fill="#2B2A6B" />
            <path
              d="M32 82 L68 82 M31 90 L69 90"
              stroke="#fff"
              strokeWidth="4"
            />
            <path
              d="M30 52 Q30 40 40 38 L66 38 Q76 40 76 52 L74 66 Q72 76 60 76 L42 76 Q30 76 30 64Z"
              fill="#FFD9B8"
            />
            <path d="M36 44 Q30 22 38 14 Q46 10 47 22 L48 40" fill="#FFD9B8" />
            <path
              d="M48 40 L50 12 Q52 4 58 6 Q63 9 61 18 L60 40"
              fill="#FFD9B8"
            />
            <path
              d="M60 40 L66 16 Q69 9 74 12 Q78 16 76 22 L70 44"
              fill="#FFD9B8"
            />
            <path d="M30 58 Q16 50 12 38 Q14 30 22 34 L32 46" fill="#FFD9B8" />
            <path d="M82 20 L92 14 M84 32 L96 30" strokeWidth="4" />
          </g>
        )}
        {kind === "blackout" && (
          <g>
            <path
              d="M50 8 Q78 8 80 36 Q80 50 68 60 L66 70 L34 70 L32 60 Q20 50 20 36 Q22 8 50 8Z"
              fill="#9AA3C7"
            />
            <path d="M40 50 L46 40 L54 50 L60 40" strokeWidth="4" />
            <rect x="34" y="70" width="32" height="16" rx="4" fill="#D5E0F2" />
            <path d="M36 78 H64" strokeWidth="3.5" />
            <path d="M42 92 H58" />
            <path d="M86 10 L14 90" stroke="#fff" strokeWidth="14" />
            <path d="M86 10 L14 90" strokeWidth="7" />
          </g>
        )}
        {kind === "basket" && (
          <g>
            <path d="M30 42 Q30 12 50 12 Q70 12 70 42" strokeWidth="7" />
            <path
              d="M14 46 H86 L78 84 Q76 90 70 90 H30 Q24 90 22 84Z"
              fill="#E9A866"
            />
            <path
              d="M36 54 L38 84 M50 54 L50 86 M64 54 L62 84 M18 66 H82"
              strokeWidth="3.5"
            />
            <rect x="8" y="38" width="84" height="12" rx="6" fill="#C9803F" />
          </g>
        )}
      </svg>
    </div>
  );
}

export function Basket({
  items,
  gone = -1,
  width = 346,
  height = 140,
  token = 66,
}: {
  items: IngredientKind[];
  /** Index of an item that was stolen; rendered as an empty dashed slot. */
  gone?: number;
  width?: number;
  height?: number;
  token?: number;
}) {
  const gap = 6;
  const innerW = width - 52 - 10 - 24 - 8 - 8;
  const innerH = height - 10 - 24 - 8 - 8;
  const n = Math.max(1, items.length);
  const tok = Math.max(
    28,
    Math.min(token, innerH, Math.floor((innerW - gap * (n - 1)) / n)),
  );
  const icon = Math.round(tok * 0.9);

  const handle = (d: string, side: "left" | "right") => (
    <svg
      width="40"
      height="84"
      viewBox="0 0 40 84"
      style={{ position: "absolute", [side]: 0, top: "50%", marginTop: -42 }}
    >
      <path
        d={d}
        fill="none"
        stroke={INK}
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d={d}
        fill="none"
        stroke="#C9803F"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );

  return (
    <div style={{ position: "relative", width, height }}>
      {handle("M34 8 Q4 8 4 42 Q4 76 34 76", "left")}
      {handle("M6 8 Q36 8 36 42 Q36 76 6 76", "right")}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 26,
          right: 26,
          borderRadius: 40,
          backgroundColor: "#E9A866",
          backgroundImage:
            "repeating-linear-gradient(0deg,rgba(201,128,63,.6) 0 5px,transparent 5px 13px),repeating-linear-gradient(90deg,rgba(255,255,255,.22) 0 5px,transparent 5px 13px)",
          border: `5px solid ${INK}`,
          boxShadow: "0 10px 0 rgba(43,42,107,.16)",
          boxSizing: "border-box",
          padding: 12,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 28,
            background: "#C9803F",
            border: `4px solid ${INK}`,
            boxShadow: "inset 0 8px 0 rgba(43,42,107,.18)",
            boxSizing: "border-box",
            display: "flex",
            flexWrap: "nowrap",
            alignItems: "center",
            justifyContent: "center",
            gap,
            padding: 4,
          }}
        >
          {items.map((kind, i) =>
            i === gone ? (
              <div
                key={i}
                style={{
                  width: tok,
                  height: tok,
                  borderRadius: "50%",
                  border: "4px dashed #fff",
                  boxSizing: "border-box",
                  opacity: 0.8,
                }}
              />
            ) : (
              <div
                key={i}
                style={{
                  width: tok,
                  height: tok,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ingredient kind={kind} size={icon} />
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

export const STAR_POINTS =
  "50,6 62,36 94,38 69,58 78,90 50,72 22,90 31,58 6,38 38,36";

export const COUNTER_BG: React.CSSProperties = {
  backgroundColor: "#DCE6FF",
  backgroundImage: "radial-gradient(#B3C6F2 2px, transparent 2.5px)",
  backgroundSize: "26px 26px",
};

export type AvatarMood =
  "happy" | "focused" | "worried" | "delighted" | "panicked";

function AvatarFace({ mood }: { mood: AvatarMood }) {
  return (
    <svg
      width="54"
      height="54"
      viewBox="0 0 58 58"
      fill="none"
      stroke="#fff"
      strokeWidth={mood === "panicked" ? 3 : 3.5}
      strokeLinecap="round"
    >
      {mood === "happy" && (
        <>
          <circle cx="20" cy="25" r="3.5" fill="#fff" stroke="none" />
          <circle cx="38" cy="25" r="3.5" fill="#fff" stroke="none" />
          <path d="M19 34 Q29 44 39 34" />
        </>
      )}
      {mood === "focused" && (
        <>
          <path d="M14 18 L24 22 M44 18 L34 22" />
          <circle cx="20" cy="28" r="3" fill="#fff" stroke="none" />
          <circle cx="38" cy="28" r="3" fill="#fff" stroke="none" />
          <path d="M23 39 L35 39" />
        </>
      )}
      {mood === "worried" && (
        <>
          <path d="M14 22 L24 18 M44 22 L34 18" />
          <circle cx="20" cy="28" r="3" fill="#fff" stroke="none" />
          <circle cx="38" cy="28" r="3" fill="#fff" stroke="none" />
          <path d="M20 40 Q24 36 29 40 Q34 44 38 40" />
          <path
            d="M47 10 Q51 17 49 20 Q47 22 45 20 Q43 17 47 10Z"
            fill={SKY}
            strokeWidth="2.5"
          />
        </>
      )}
      {mood === "delighted" && (
        <>
          <path d="M15 27 Q20 21 25 27 M33 27 Q38 21 43 27" />
          <path d="M18 34 Q29 46 40 34 Z" fill="#fff" />
        </>
      )}
      {mood === "panicked" && (
        <>
          <path d="M12 14 L22 18 M46 14 L36 18" />
          <circle cx="19" cy="26" r="6.5" fill="#fff" />
          <circle cx="39" cy="26" r="6.5" fill="#fff" />
          <circle cx="19" cy="27" r="2.6" fill={INK} stroke="none" />
          <circle cx="39" cy="27" r="2.6" fill={INK} stroke="none" />
          <ellipse cx="29" cy="43" rx="6" ry="7" fill={INK} />
          <path
            d="M50 30 Q54 37 52 40 Q50 42 48 40 Q46 37 50 30Z"
            fill={SKY}
            strokeWidth="2.5"
          />
        </>
      )}
    </svg>
  );
}

export function PhoneTopBar({
  mood,
  progress,
  score,
}: {
  mood: AvatarMood;
  /** Recipe progress, 0–100. */
  progress: number;
  score: number;
}) {
  const panicked = mood === "panicked";
  return (
    <div
      style={{
        position: "absolute",
        top: 58,
        left: 18,
        right: 18,
        height: 66,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 62,
          height: 62,
          flexShrink: 0,
          borderRadius: "50%",
          background: ROYAL,
          border: `4px solid ${INK}`,
          boxShadow: panicked
            ? `0 0 0 4px ${TOMATO},0 6px 0 4px rgba(43,42,107,.16)`
            : `0 0 0 4px #fff,0 0 0 8px ${ROYAL},0 8px 0 8px rgba(43,42,107,.16)`,
          boxSizing: "border-box",
          transform: panicked ? "rotate(-8deg)" : undefined,
        }}
      >
        <AvatarFace mood={mood} />
      </div>
      <div
        style={{
          flex: 1,
          height: 28,
          border: `4px solid ${INK}`,
          borderRadius: 14,
          background: "#fff",
          overflow: "hidden",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: ROYAL,
            borderRight: `4px solid ${INK}`,
            boxSizing: "border-box",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: SUN,
          border: `4px solid ${INK}`,
          borderRadius: 22,
          padding: "2px 14px 2px 8px",
          boxShadow: "0 6px 0 rgba(43,42,107,.16)",
          font: lilita(28, 1.2),
        }}
      >
        <svg width="22" height="22" viewBox="0 0 100 100">
          <polygon
            points={STAR_POINTS}
            fill="#fff"
            stroke={INK}
            strokeWidth="9"
            strokeLinejoin="round"
          />
        </svg>
        {score}
      </div>
    </div>
  );
}

export function StoreButton({ bottom = 30 }: { bottom?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 22,
        bottom,
        width: 64,
        height: 64,
        borderRadius: "50%",
        background: "#fff",
        border: `4px solid ${INK}`,
        boxShadow: `0 0 0 5px ${ROYAL},0 8px 0 5px rgba(43,42,107,.16)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <svg width="38" height="38" viewBox="0 0 34 34">
        <path
          d="M5 14 V30 H29 V14"
          fill="#fff"
          stroke={INK}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <rect
          x="13"
          y="19"
          width="8"
          height="11"
          fill={SKY}
          stroke={INK}
          strokeWidth="2.5"
        />
        <path
          d="M3 8 L6 3 H28 L31 8 V10 Q31 14 27 14 Q23.5 14 23.5 10 Q23.5 14 20 14 Q17 14 17 10 Q17 14 14 14 Q10.5 14 10.5 10 Q10.5 14 7 14 Q3 14 3 10Z"
          fill={TOMATO}
          stroke={INK}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M14 4 L13 13 M20 4 L21 13" stroke="#fff" strokeWidth="2.5" />
      </svg>
    </div>
  );
}

function TrashGlyph({ width, height }: { width: number; height: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 34 38">
      <rect
        x="3"
        y="7"
        width="28"
        height="6"
        rx="3"
        fill={SKY}
        stroke={INK}
        strokeWidth="3"
      />
      <path
        d="M13 7 V4 H21 V7"
        fill="none"
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M6 13 L8 34 Q8 36 10 36 L24 36 Q26 36 26 34 L28 13Z"
        fill="#D5E0F2"
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M13 18 V31 M21 18 V31"
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** `dashed` is the drop-target state shown when there is leftover food to throw away. */
export function TrashButton({
  position,
  dashed = false,
}: {
  position: React.CSSProperties;
  dashed?: boolean;
}) {
  const size = dashed ? 64 : 60;
  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#fff",
        border: `4px ${dashed ? "dashed" : "solid"} ${INK}`,
        boxShadow: "0 6px 0 rgba(43,42,107,.16)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        ...position,
      }}
    >
      {dashed ? (
        <TrashGlyph width={32} height={36} />
      ) : (
        <TrashGlyph width={30} height={34} />
      )}
    </div>
  );
}

/** Green pill CTA with the design's white highlight streak. */
export function GreenPill({
  style,
  streak,
  children,
}: {
  style: React.CSSProperties;
  streak: { left: number; width: number };
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        background: "#3CB54A",
        border: `4px solid ${INK}`,
        boxShadow:
          "inset 0 -8px 0 rgba(43,42,107,.18),0 0 0 6px #fff,0 10px 0 6px rgba(43,42,107,.16)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        ...style,
      }}
    >
      <span
        style={{
          position: "absolute",
          left: streak.left,
          top: 12,
          width: streak.width,
          height: 11,
          borderRadius: 6,
          background: "#fff",
          opacity: 0.6,
        }}
      />
      {children}
    </div>
  );
}
