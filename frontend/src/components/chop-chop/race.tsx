import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type React from "react";
import { INK, PhoneFrame, ROYAL, SKY, SUN, TOMATO, lilita } from "./design";
import { IngredientIcon } from "./IngredientIcon";
import { characterImage } from "#/data/characters";

import { paper } from "./paper";

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
            <ellipse cx="72" cy="84" rx="10" ry="6" fill="#2FA84F" />
            <ellipse cx="88" cy="78" rx="8" ry="5" fill="#2FA84F" />
            <g transform="rotate(-32 50 50)">
              <rect x="2" y="54" width="26" height="16" rx="6" fill="#127C78" />
              <path
                d="M28 52 L66 52 Q86 52 94 36 Q96 70 66 72 L28 72Z"
                fill="#fff"
              />
              <path d="M36 60 L60 60" stroke="#F6DDB0" strokeWidth="4" />
            </g>
            <path d="M18 86 L30 80 M24 94 L38 90" strokeWidth="4" />
          </g>
        )}
        {kind === "stir" && (
          <g>
            <path d="M58 50 L74 8" strokeWidth="12" />
            <path d="M58 50 L74 8" stroke="#E9A866" strokeWidth="5" />
            <rect x="8" y="44" width="84" height="12" rx="6" fill="#127C78" />
            <path
              d="M14 56 H86 L80 82 Q78 90 70 90 H30 Q22 90 20 82Z"
              fill="#F07F22"
            />
            <path d="M40 30 A26 10 0 1 0 22 22" strokeWidth="5" />
            <path d="M14 16 L24 22 L16 30" strokeWidth="5" />
          </g>
        )}
        {kind === "flip" && (
          <g>
            <path d="M70 76 L96 70" strokeWidth="12" />
            <path d="M70 76 L96 70" stroke="#EF4128" strokeWidth="5" />
            <ellipse cx="42" cy="78" rx="32" ry="11" fill="#5A3D26" />
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
            <path d="M34 72 L66 72 L70 98 L30 98Z" fill="#3D2817" />
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
              fill="#B8987A"
            />
            <path d="M40 50 L46 40 L54 50 L60 40" strokeWidth="4" />
            <rect x="34" y="70" width="32" height="16" rx="4" fill="#F2D7A0" />
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

const CART_IMAGE = "/assets/cart-empty.png";
/** Pixel size of the cart art. */
const CART_W = 904;
const CART_H = 1274;
/** Insets (fraction of the cart art) of the green bed that holds items. */
const CART_BED = { left: 0.24, right: 0.23, top: 0.06, bottom: 0.17 };
/** Clockwise turn of the cart, in degrees. */
const CART_TILT = 90;

export function Basket({
  silhouette = false,
  items,
  gone = -1,
  width = 346,
  height = 140,
  token = 66,
  onItemTap,
}: {
  silhouette?: boolean;
  /** Ingredient ids (menu ids or design-handoff kinds). */
  items: string[];
  onItemTap?: (index: number) => void;
  /** Index of an item that was stolen; rendered as an empty dashed slot. */
  gone?: number;
  width?: number;
  height?: number;
  token?: number;
}) {
  // Top-down cart art, turned by CART_TILT and sized so the turned cart fits the
  // height; items sit on the green bed.
  const gap = 4;
  const turn = (CART_TILT * Math.PI) / 180;
  const cartW = Math.round(
    height /
      (Math.abs(Math.sin(turn)) + (Math.abs(Math.cos(turn)) * CART_H) / CART_W),
  );
  const cartH = Math.round((cartW * CART_H) / CART_W);
  const boxW = Math.ceil(
    cartW * Math.abs(Math.cos(turn)) + cartH * Math.abs(Math.sin(turn)),
  );
  const bedW = cartW * (1 - CART_BED.left - CART_BED.right);
  const bedH = cartH * (1 - CART_BED.top - CART_BED.bottom);
  const n = Math.max(1, items.length);
  // Pick the column count that gives the largest tokens.
  let tok = 0;
  let cols = 1;
  for (let c = 1; c <= n; c++) {
    const rows = Math.ceil(n / c);
    const size = Math.floor(
      Math.min((bedW - gap * (c - 1)) / c, (bedH - gap * (rows - 1)) / rows),
    );
    if (size > tok) {
      tok = size;
      cols = c;
    }
  }
  tok = Math.max(20, Math.min(token, tok));
  const icon = Math.round(tok * 0.9);

  return (
    <div
      style={{
        position: "relative",
        width: Math.max(width, boxW),
        height,
        filter: "drop-shadow(0 6px 0 rgba(122,78,30,.18))",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: cartW,
          height: cartH,
          transform: `translate(-50%, -50%) rotate(${CART_TILT}deg)`,
        }}
      >
        <img
          src={CART_IMAGE}
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${CART_BED.left * 100}%`,
            right: `${CART_BED.right * 100}%`,
            top: `${CART_BED.top * 100}%`,
            bottom: `${CART_BED.bottom * 100}%`,
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, ${tok}px)`,
            alignContent: "center",
            justifyContent: "center",
            gap,
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
                onClick={onItemTap ? () => onItemTap(i) : undefined}
                style={{
                  width: tok,
                  height: tok,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: onItemTap ? "pointer" : undefined,
                  // Keep ingredients upright while the cart is turned.
                  transform: `rotate(${-CART_TILT}deg)`,
                }}
              >
                <IngredientIcon silhouette={silhouette} id={kind} size={icon} />
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
  backgroundColor: "#FFE7A0",
  backgroundImage: "radial-gradient(#EBC98E 2px, transparent 2.5px)",
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

/**
 * What sits at the right of the phone top bar. The live game puts the sabotage
 * button here; without a provider (dev previews) the star score shows.
 */
export const TopBarAction = createContext<React.ReactNode>(null);

/** The player's chef, shown in the top bar in place of the smiley face. */
export const TopBarCharacter = createContext<string | null>(null);

export function PhoneTopBar({
  mood,
  progress,
  score,
  top = 58,
}: {
  mood: AvatarMood;
  /** Recipe progress, 0–100. */
  progress: number;
  score: number;
  /** Distance from the top; 58 leaves room for the design's phone status bar. */
  top?: number;
}) {
  const panicked = mood === "panicked";
  const action = useContext(TopBarAction);
  const character = useContext(TopBarCharacter);
  return (
    <div
      style={{
        position: "absolute",
        top,
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
          ...paper("50%", 0),
          width: 62,
          height: 62,
          flexShrink: 0,
          background: character ? "#fff" : ROYAL,
          boxSizing: "border-box",
          overflow: "hidden",
          transform: panicked ? "rotate(-8deg)" : undefined,
        }}
      >
        {character ? (
          // Full-body chef art, zoomed in on the face.
          <img
            src={characterImage(character)}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              left: "50%",
              top: 3,
              width: 92,
              transform: "translateX(-50%)",
              maxWidth: "none",
            }}
          />
        ) : (
          <AvatarFace mood={mood} />
        )}
      </div>
      <div
        style={{
          ...paper(14, 1),
          flex: 1,
          height: 28,
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
            borderRight: `4px solid rgba(61,40,23,.22)`,
            boxSizing: "border-box",
          }}
        />
      </div>
      {action ?? (
        <div
          style={{
            ...paper(22, 2),
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: SUN,
            padding: "2px 14px 2px 8px",
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
      )}
    </div>
  );
}

export function StoreButton({
  bottom = 30,
  onClick,
}: {
  bottom?: number;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      aria-label={onClick ? "Back to the store" : undefined}
      style={{
        ...paper("50%", 3),
        cursor: onClick ? "pointer" : undefined,
        position: "absolute",
        left: 22,
        bottom,
        width: 64,
        height: 64,
        background: "#fff",
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
        fill="#F2D7A0"
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
  onClick,
}: {
  position: React.CSSProperties;
  dashed?: boolean;
  onClick?: () => void;
}) {
  const size = dashed ? 64 : 60;
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      aria-label={onClick ? "Trash" : undefined}
      style={{
        cursor: onClick ? "pointer" : undefined,
        position: "absolute",
        width: size,
        height: size,
        ...paper("50%", 28),
        background: "#fff",
        ...(dashed && { border: `4px dashed ${INK}`, boxShadow: "none" }),
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

/** Green paper pill CTA. `streak` is accepted for old callers but no longer drawn. */
export function GreenPill({
  style,
  children,
  onClick,
}: {
  style: React.CSSProperties;
  streak?: { left: number; width: number };
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      style={{
        ...paper(0, 4),
        position: "absolute",
        background: "#2FA84F",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * `framed` draws the design's phone mockup (dev switcher). Otherwise the 390×844
 * screen fills a real device, scaled to fit, with the background running edge to edge.
 */
export function PhoneShell({
  framed = true,
  background,
  children,
}: {
  framed?: boolean;
  background: React.CSSProperties;
  children: React.ReactNode;
}) {
  if (framed)
    return <PhoneFrame background={background}>{children}</PhoneFrame>;
  return <FullScreenPhone background={background}>{children}</FullScreenPhone>;
}

function FullScreenPhone({
  background,
  children,
}: {
  background: React.CSSProperties;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const update = () =>
      setScale(Math.min(root.clientWidth / 390, root.clientHeight / 844));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      style={{
        width: "100vw",
        height: "100dvh",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        fontFamily: "Nunito, sans-serif",
        color: INK,
        ...background,
      }}
    >
      {scale !== null && (
        <div
          style={{
            position: "relative",
            width: 390,
            height: 844,
            flexShrink: 0,
            zoom: scale,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
