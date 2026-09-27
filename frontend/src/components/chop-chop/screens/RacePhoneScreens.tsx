import { useRef, useState } from "react";
import type React from "react";
import {
  INK,
  PAGE_BG,
  PINK,
  ROYAL,
  SUN,
  Sparkle,
  TOMATO,
  lilita,
  nunito,
} from "../design";
import { IngredientIcon } from "../IngredientIcon";
import { dishAsset, getIngredient, ingredientName } from "#/data/menu";
import {
  Basket,
  COUNTER_BG,
  GreenPill,
  PhoneShell,
  PhoneTopBar,
  StoreButton,
  TrashButton,
} from "../race";
import type { AvatarMood } from "../race";

import { paper } from "#/components/chop-chop/paper";
type Common = {
  /** Draw the phone mockup frame (dev switcher) instead of filling the device. */
  framed?: boolean;
  score: number;
  /** Recipe progress, 0–100. */
  progress: number;
};

export type ShelfItem = { kind: string; size?: number; rot?: number };

const SHELF_ROTATIONS = [-4, 3, -3, 6, 4, -5];
const CHOPS_TO_FINISH = 3;

/** Converts a pointer event to the 390×844 design coordinates of `el`, whatever it's scaled to. */
function toDesign(el: HTMLElement | null, e: React.PointerEvent) {
  const r = el?.getBoundingClientRect();
  if (!r || r.width === 0) return { x: 0, y: 0 };
  return {
    x: ((e.clientX - r.left) * 390) / r.width,
    y: ((e.clientY - r.top) * 844) / r.height,
  };
}

function Toast({
  children,
  style,
}: {
  children: React.ReactNode;
  style: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 26,
        right: 26,
        zIndex: 9,
        background: "#FFE1DA",
        ...paper(22, 25),
        padding: "8px 16px",
        font: nunito(800, 18),
        textAlign: "center",
        boxShadow: "0 6px 0 rgba(122,78,30,.16)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ---------------------------------- Store --------------------------------- */

const SHELF_WOOD = "#E9A866";
/** Shelf backing: a paler cut of the same wood as the planks. */
const SHELF_BACKING = "#F3C992";
const SHELF_COUNT = 3;
const MAX_PER_SHELF = 3;
/** Items one store page holds (3 shelves of up to 3). */
export const STORE_PAGE_SIZE = SHELF_COUNT * MAX_PER_SHELF;

const plank: React.CSSProperties = {
  ...paper(8, 0),
  height: 16,
  background: SHELF_WOOD,
};

const arrowButton: React.CSSProperties = {
  ...paper("50%", 1),
  width: 52,
  height: 52,
  background: "#fff",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  font: lilita(36, 1),
  color: INK,
  paddingBottom: 4,
  cursor: "pointer",
};

type Drag = {
  slot: number;
  kind: string;
  x: number;
  y: number;
  sx: number;
  sy: number;
};

export function StoreScreen({
  framed,
  score,
  progress,
  aisleName,
  aisleIndex,
  aisleCount,
  shelf,
  basket,
  onPrevAisle,
  onNextAisle,
  onTake,
  onBasketTap,
  onTrash,
  onLeave,
  notice,
  illustrateDrag,
}: Common & {
  aisleName: string;
  aisleIndex: number;
  aisleCount: number;
  /** Up to STORE_PAGE_SIZE slots, spread evenly over 3 shelves; `null` is an empty (taken) slot. */
  shelf: (ShelfItem | null)[];
  basket: string[];
  onPrevAisle?: () => void;
  onNextAisle?: () => void;
  onTake?: (slot: number) => void;
  onBasketTap?: (index: number) => void;
  onTrash?: () => void;
  onLeave?: () => void;
  notice?: string;
  /** The design's static "dragging into the basket" illustration. */
  illustrateDrag?: string;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  // Fill shelves evenly: 2 per shelf for up to 6 items, 3 per shelf beyond that.
  const perShelf = Math.min(
    MAX_PER_SHELF,
    Math.max(2, Math.ceil(shelf.length / SHELF_COUNT)),
  );
  const rows = Array.from({ length: SHELF_COUNT }, (_, r) =>
    Array.from({ length: perShelf }, (_, i) => shelf.at(r * perShelf + i)),
  );
  const itemSize = perShelf > 2 ? 76 : 82;
  const nameSize = Math.min(40, Math.floor(210 / (0.62 * aisleName.length)));

  const itemHandlers = (slot: number, kind: string) =>
    onTake
      ? {
          onPointerDown: (e: React.PointerEvent) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            const p = toDesign(surfaceRef.current, e);
            setDrag({ slot, kind, x: p.x, y: p.y, sx: p.x, sy: p.y });
          },
          onPointerMove: (e: React.PointerEvent) => {
            if (!drag) return;
            const p = toDesign(surfaceRef.current, e);
            setDrag({ ...drag, x: p.x, y: p.y });
          },
          onPointerUp: () => {
            if (!drag) return;
            const tapped = Math.hypot(drag.x - drag.sx, drag.y - drag.sy) < 10;
            if (tapped || drag.y > 520) onTake(drag.slot);
            setDrag(null);
          },
          onPointerCancel: () => setDrag(null),
        }
      : {};

  return (
    <PhoneShell framed={framed} background={COUNTER_BG}>
      <div ref={surfaceRef} style={{ position: "absolute", inset: 0 }} />
      <PhoneTopBar mood="happy" progress={progress} score={score} />

      <div
        style={{
          ...paper(34, 2),
          position: "absolute",
          top: 138,
          left: 18,
          right: 18,
          height: 404,
          background: SHELF_BACKING,
          boxSizing: "border-box",
          padding: "10px 14px 12px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 58,
          }}
        >
          <div
            style={arrowButton}
            onClick={onPrevAisle}
            role={onPrevAisle ? "button" : undefined}
            aria-label="Previous aisle"
          >
            ‹
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                font: lilita(nameSize, 1),
                letterSpacing: ".04em",
                whiteSpace: "nowrap",
              }}
            >
              {aisleName}
            </span>
            <span style={{ display: "flex", gap: 5 }}>
              {Array.from({ length: aisleCount }, (_, i) =>
                i === aisleIndex ? (
                  <span
                    key={i}
                    style={{
                      width: 18,
                      height: 8,
                      borderRadius: 4,
                      background: INK,
                    }}
                  />
                ) : (
                  <span
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "rgba(61,40,23,.25)",
                    }}
                  />
                ),
              )}
            </span>
          </div>
          <div
            style={arrowButton}
            onClick={onNextAisle}
            role={onNextAisle ? "button" : undefined}
            aria-label="Next aisle"
          >
            ›
          </div>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-around",
          }}
        >
          {rows.map((row, r) => (
            <div key={r} style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-evenly",
                  alignItems: "flex-end",
                  height: 88,
                }}
              >
                {row.map((item, i) => {
                  const slot = r * perShelf + i;
                  if (item === undefined)
                    return <div key={i} style={{ width: itemSize - 4 }} />;
                  if (item === null) {
                    return (
                      <div
                        key={i}
                        style={{
                          width: itemSize - 4,
                          height: itemSize - 4,
                          borderRadius: "50%",
                          border: `4px dashed ${INK}`,
                          opacity: 0.3,
                          boxSizing: "border-box",
                        }}
                      />
                    );
                  }
                  return (
                    <div
                      key={i}
                      {...itemHandlers(slot, item.kind)}
                      style={{
                        touchAction: "none",
                        cursor: onTake ? "grab" : undefined,
                        lineHeight: 0,
                        opacity: drag?.slot === slot ? 0.15 : 1,
                      }}
                    >
                      <IngredientIcon
                        id={item.kind}
                        size={item.size ?? itemSize}
                        rotate={
                          item.rot ??
                          SHELF_ROTATIONS[slot % SHELF_ROTATIONS.length]
                        }
                      />
                    </div>
                  );
                })}
              </div>
              <div style={plank} />
            </div>
          ))}
        </div>
      </div>

      {illustrateDrag && (
        <>
          <svg
            width="160"
            height="300"
            viewBox="0 0 160 300"
            style={{ position: "absolute", left: 150, top: 250 }}
          >
            <path
              d="M110 20 Q140 140 60 270"
              fill="none"
              stroke={INK}
              strokeWidth="4"
              strokeDasharray="4 12"
              strokeLinecap="round"
            />
          </svg>
          <DragGhost kind={illustrateDrag} left={168} top={510} />
        </>
      )}
      {drag && (
        <DragGhost kind={drag.kind} left={drag.x - 60} top={drag.y - 92} />
      )}

      <div style={{ position: "absolute", top: 566, left: 84 }}>
        <Basket
          items={basket}
          width={296}
          height={148}
          token={62}
          onItemTap={onBasketTap}
        />
      </div>
      <TrashButton position={{ left: 18, top: 650 }} onClick={onTrash} />

      {notice && <Toast style={{ bottom: 128 }}>{notice}</Toast>}

      <GreenPill
        onClick={onLeave}
        streak={{ left: 32, width: 44 }}
        style={{
          left: 22,
          right: 22,
          bottom: 30,
          height: 78,
          borderRadius: 39,
          font: lilita(40),
        }}
      >
        Leave store ›
      </GreenPill>
    </PhoneShell>
  );
}

function DragGhost({
  kind,
  left,
  top,
}: {
  kind: string;
  left: number;
  top: number;
}) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          left,
          top,
          zIndex: 4,
          pointerEvents: "none",
          filter: "drop-shadow(0 16px 10px rgba(122,78,30,.28))",
        }}
      >
        <IngredientIcon id={kind} size={100} rotate={-10} />
      </div>
      <div
        style={{
          position: "absolute",
          left: left + 30,
          top: top + 62,
          zIndex: 5,
          pointerEvents: "none",
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "rgba(255,255,255,.45)",
          border: "4px solid #fff",
          boxShadow: "var(--paper-shadow)",
        }}
      />
    </>
  );
}

/* ---------------------------------- Chop ---------------------------------- */

const BIT_COLORS: Partial<Record<string, [string, string]>> = {
  carrot: ["#FF9A3C", "#FFB870"],
  tomato: ["#EF4128", "#FF8A7A"],
  redpepper: ["#EF4128", "#FF8A7A"],
  chili: ["#EF4128", "#FF8A7A"],
  garlic: ["#FFFFFF", "#F8E6C4"],
  onion: ["#F2BE63", "#FFDD6B"],
  chicken: ["#E9A866", "#FFF1D2"],
  steak: ["#D9474A", "#FFF1D2"],
  greenonion: ["#2FA84F", "#CDE8B5"],
  leek: ["#1E8A4A", "#CDE8B5"],
  mushroom: ["#E9A866", "#FFF1D2"],
  "red-bell-pepper": ["#EF4128", "#FF8A7A"],
  "green-onion": ["#2FA84F", "#CDE8B5"],
  lettuce: ["#2FA84F", "#CDE8B5"],
  broccoli: ["#1E8A4A", "#8FD14F"],
  celery: ["#8FD14F", "#CDE8B5"],
  potato: ["#E9A866", "#FFF1D2"],
  avocado: ["#8FD14F", "#1E8A4A"],
};
const BIT_SPOTS = [
  { left: 40, top: 250, size: 40, inset: 6 },
  { left: 78, top: 270, size: 34, inset: 5 },
  { left: 116, top: 244, size: 36, inset: 5 },
];

function QueueToken({ kind, current }: { kind: string; current: boolean }) {
  return (
    <div
      style={{
        ...paper("50%", 3),
        width: current ? 64 : 50,
        height: current ? 64 : 50,
        background: current ? SUN : "#fff",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <IngredientIcon id={kind} size={current ? 46 : 36} sticker={false} />
    </div>
  );
}

export function ChopScreen({
  framed,
  score,
  progress,
  basket,
  queue,
  current,
  chops,
  onChop,
  onStore,
  onTrash,
  onBasketTap,
  notice,
}: Common & {
  basket: string[];
  queue: string[];
  current: number;
  /** Swipes landed on the current item so far. */
  chops: number;
  notice?: string;
  onChop?: () => void;
  onStore?: () => void;
  onTrash?: () => void;
  onBasketTap?: (index: number) => void;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const kind = queue[current];
  const [bit, bitInner] = BIT_COLORS[kind] ?? [
    getIngredient(kind)?.color ?? "#FFC20E",
    "#FFFFFF",
  ];

  const swipe = onChop
    ? {
        onPointerDown: (e: React.PointerEvent) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          start.current = toDesign(surfaceRef.current, e);
        },
        onPointerUp: (e: React.PointerEvent) => {
          const s = start.current;
          start.current = null;
          if (!s) return;
          const p = toDesign(surfaceRef.current, e);
          const dx = p.x - s.x;
          const dy = p.y - s.y;
          if (dy > 80 && dy > Math.abs(dx) * 1.3) onChop();
        },
        onPointerCancel: () => {
          start.current = null;
        },
      }
    : {};

  return (
    <PhoneShell framed={framed} background={COUNTER_BG}>
      <div ref={surfaceRef} style={{ position: "absolute", inset: 0 }} />
      <PhoneTopBar mood="focused" progress={progress} score={score} />
      <div style={{ position: "absolute", top: 138, left: 18 }}>
        <Basket
          items={basket}
          width={354}
          height={126}
          token={58}
          onItemTap={onBasketTap}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: 282,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
        }}
      >
        {queue.map((k, i) => (
          <QueueToken key={i} kind={k} current={i === current} />
        ))}
      </div>

      <div
        {...swipe}
        style={{
          ...paper(46, 4),
          position: "absolute",
          top: 366,
          left: 26,
          right: 26,
          height: 366,
          backgroundColor: "#E9A866",
          backgroundImage:
            "repeating-linear-gradient(8deg,transparent 0 30px,rgba(201,128,63,.5) 30px 34px)",
          boxSizing: "border-box",
          touchAction: "none",
          cursor: onChop ? "grab" : undefined,
        }}
      >
        <span
          style={{
            ...paper("50%", 5),
            position: "absolute",
            right: 26,
            top: 22,
            width: 30,
            height: 30,
            background: PAGE_BG,
            boxSizing: "border-box",
          }}
        />
        {kind && (
          <div
            style={{
              position: "absolute",
              left: 66,
              top: 84,
              pointerEvents: "none",
            }}
          >
            <IngredientIcon
              id={kind}
              size={200}
              rotate={kind === "carrot" ? -72 : -10}
            />
          </div>
        )}
        {BIT_SPOTS.slice(0, Math.min(chops, CHOPS_TO_FINISH)).map((s, i) => (
          <span
            key={i}
            style={{
              ...paper("50%", 6, false),
              position: "absolute",
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              background: bit,
              boxSizing: "border-box",
              boxShadow: `inset 0 0 0 ${s.inset}px ${bitInner}`,
            }}
          />
        ))}
        <svg
          width="170"
          height="200"
          viewBox="0 0 170 200"
          style={{
            position: "absolute",
            right: 10,
            top: 10,
            pointerEvents: "none",
          }}
        >
          <g transform="rotate(28 85 100)">
            <rect
              x="72"
              y="4"
              width="26"
              height="70"
              rx="10"
              fill={ROYAL}
              stroke={INK}
              strokeWidth="5"
            />
            <circle cx="85" cy="24" r="3.5" fill="#fff" />
            <circle cx="85" cy="50" r="3.5" fill="#fff" />
            <path
              d="M66 74 L104 74 L104 170 Q104 190 86 196 L66 196Z"
              fill="#fff"
              stroke={INK}
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <path
              d="M76 90 L76 176"
              stroke="#F6DDB0"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>
        </svg>
        <svg
          width="90"
          height="200"
          viewBox="0 0 90 200"
          style={{
            position: "absolute",
            left: 236,
            top: 150,
            pointerEvents: "none",
          }}
        >
          <path
            d="M45 12 L45 170"
            stroke="#fff"
            strokeWidth="22"
            strokeLinecap="round"
          />
          <path
            d="M45 12 L45 170 M20 146 L45 176 L70 146"
            fill="none"
            stroke={INK}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {notice && <Toast style={{ top: 346 }}>{notice}</Toast>}

      <StoreButton onClick={onStore} />
      <TrashButton position={{ right: 22, bottom: 30 }} onClick={onTrash} />
    </PhoneShell>
  );
}

/* ---------------------------------- Stove --------------------------------- */

function Burner({
  top,
  left,
  outer,
  pan,
  inner,
  dashInset,
  handle,
}: {
  top: number;
  left: number;
  outer: number;
  pan: { top: number; left: number; size: number };
  inner: { top: number; left: number; size: number };
  dashInset: number;
  handle: {
    left: number;
    top: number;
    width: number;
    height: number;
    knob: boolean;
  };
}) {
  return (
    <>
      <div
        style={{
          ...paper("50%", 7),
          position: "absolute",
          top,
          left,
          width: outer,
          height: outer,
          background: "#4A311E",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: dashInset,
            borderRadius: "50%",
            border: `8px dashed ${TOMATO}`,
            opacity: 0.9,
          }}
        />
      </div>
      <div
        style={{
          ...paper("50%", 8, false),
          position: "absolute",
          top: pan.top,
          left: pan.left,
          width: pan.size,
          height: pan.size,
          background: "#6E4E33",
          boxShadow: "inset 0 0 0 16px #8A6445",
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          ...paper(handle.height / 2, 9),
          position: "absolute",
          left: handle.left,
          top: handle.top,
          width: handle.width,
          height: handle.height,
          background: TOMATO,
          boxSizing: "border-box",
          transform: "rotate(42deg)",
          transformOrigin: "0 50%",
        }}
      >
        {handle.knob && (
          <span
            style={{
              ...paper("50%", 10),
              position: "absolute",
              right: 12,
              top: 10,
              width: 12,
              height: 12,
              background: PAGE_BG,
            }}
          />
        )}
      </div>
      <div
        style={{
          ...paper("50%", 11),
          position: "absolute",
          top: inner.top,
          left: inner.left,
          width: inner.size,
          height: inner.size,
          background: "#5A3D26",
          boxSizing: "border-box",
        }}
      />
    </>
  );
}

function HintArrow({
  width,
  height,
  style,
  arc,
  head,
}: {
  width: number;
  height: number;
  style: React.CSSProperties;
  arc: string;
  head: string;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", pointerEvents: "none", ...style }}
    >
      <path
        d={arc}
        fill="none"
        stroke="#fff"
        strokeWidth="18"
        strokeLinecap="round"
      />
      <path
        d={arc}
        fill="none"
        stroke={INK}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d={head}
        fill="none"
        stroke="#fff"
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={head}
        fill="none"
        stroke={INK}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeatDash({
  left,
  top,
  rot,
}: {
  left: number;
  top: number;
  rot: number;
}) {
  return (
    <span
      style={{
        ...paper(4, 12),
        position: "absolute",
        left,
        top,
        width: 22,
        height: 8,
        background: SUN,
        transform: `rotate(${rot}deg)`,
      }}
    />
  );
}

/** Pan-relative positions (pan box: left 54, top 338, 282×282) from the design. */
const PAN_SPOTS = [
  { left: 64, top: 60, size: 130, rot: -10 },
  { left: 54, top: 150, size: 66, rot: 10 },
  { left: 156, top: 152, size: 66, rot: -8 },
];
const PAN_CENTER = { x: 54 + 141, y: 338 + 141 };

export function StoveScreen({
  framed,
  score,
  progress,
  basket,
  panItems,
  gesture,
  turn = 0,
  lifted = false,
  onStir,
  onFlip,
  onStore,
  onTrash,
  onBasketTap,
  notice,
  mood = "worried",
}: Common & {
  basket: string[];
  panItems: string[];
  gesture: "stir" | "flip";
  /** Radians the food has been stirred round. */
  turn?: number;
  /** Food is mid-flip. */
  lifted?: boolean;
  onStir?: (deltaRadians: number) => void;
  onFlip?: () => void;
  onStore?: () => void;
  onTrash?: () => void;
  onBasketTap?: (index: number) => void;
  notice?: string;
  mood?: AvatarMood;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const last = useRef<{ angle: number; y: number } | null>(null);
  const active = Boolean(onStir || onFlip);

  const angleOf = (e: React.PointerEvent) => {
    const p = toDesign(surfaceRef.current, e);
    return {
      angle: Math.atan2(p.y - PAN_CENTER.y, p.x - PAN_CENTER.x),
      y: p.y,
    };
  };

  const handlers = active
    ? {
        onPointerDown: (e: React.PointerEvent) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          last.current = angleOf(e);
        },
        onPointerMove: (e: React.PointerEvent) => {
          if (!last.current || !onStir) return;
          const next = angleOf(e);
          let delta = next.angle - last.current.angle;
          if (delta > Math.PI) delta -= 2 * Math.PI;
          if (delta < -Math.PI) delta += 2 * Math.PI;
          onStir(delta);
          last.current = { ...next, y: last.current.y };
        },
        onPointerUp: (e: React.PointerEvent) => {
          const s = last.current;
          last.current = null;
          if (!s || !onFlip) return;
          if (angleOf(e).y - s.y < -70) onFlip();
        },
        onPointerCancel: () => {
          last.current = null;
        },
      }
    : {};

  return (
    <PhoneShell framed={framed} background={COUNTER_BG}>
      <div ref={surfaceRef} style={{ position: "absolute", inset: 0 }} />
      <PhoneTopBar mood={mood} progress={progress} score={score} />
      <div style={{ position: "absolute", top: 138, left: 18 }}>
        <Basket
          items={basket}
          width={354}
          height={126}
          token={58}
          onItemTap={onBasketTap}
        />
      </div>

      <Burner
        top={304}
        left={20}
        outer={350}
        dashInset={22}
        pan={{ top: 338, left: 54, size: 282 }}
        handle={{ left: 278, top: 584, width: 120, height: 40, knob: true }}
        inner={{ top: 378, left: 94, size: 202 }}
      />
      <div
        style={{
          position: "absolute",
          left: 54,
          top: 338,
          width: 282,
          height: 282,
          transform: `rotate(${turn}rad) translateY(${lifted ? -46 : 0}px)`,
          transition: "transform 180ms ease-out",
          pointerEvents: "none",
        }}
      >
        {panItems.slice(0, PAN_SPOTS.length).map((kind, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: PAN_SPOTS[i].left,
              top: PAN_SPOTS[i].top,
            }}
          >
            <IngredientIcon
              id={kind}
              size={PAN_SPOTS[i].size}
              rotate={PAN_SPOTS[i].rot}
              sticker={false}
            />
          </div>
        ))}
      </div>
      {gesture === "stir" ? (
        <HintArrow
          width={282}
          height={282}
          style={{ top: 338, left: 54 }}
          arc="M58 90 A104 104 0 1 0 108 42"
          head="M90 26 L114 40 L94 62"
        />
      ) : (
        <HintArrow
          width={200}
          height={120}
          style={{ left: 88, top: 340 }}
          arc="M40 100 Q60 16 150 30"
          head="M130 12 L154 30 L132 50"
        />
      )}
      <HeatDash left={40} top={318} rot={-40} />
      <HeatDash left={330} top={350} rot={40} />

      <div
        {...handlers}
        style={{
          position: "absolute",
          top: 304,
          left: 20,
          width: 350,
          height: 350,
          borderRadius: "50%",
          touchAction: "none",
          cursor: active ? "grab" : undefined,
        }}
      />

      {notice && <Toast style={{ top: 282 }}>{notice}</Toast>}

      <StoreButton onClick={onStore} />
      <TrashButton position={{ right: 22, bottom: 30 }} onClick={onTrash} />
    </PhoneShell>
  );
}

/* --------------------------------- Plating -------------------------------- */

export function PlatingScreen({
  framed,
  score,
  progress,
  basket,
  onServe,
  onTrash,
  onStore,
  onBasketTap,
  dish,
}: Common & {
  /** Leftovers still in the basket. */
  basket: string[];
  /** Recipe id; shows its dish-<id>.svg on the plate instead of the design's sample dish. */
  dish?: string;
  onServe?: () => void;
  onTrash?: () => void;
  onStore?: () => void;
  onBasketTap?: (index: number) => void;
}) {
  return (
    <PhoneShell framed={framed} background={COUNTER_BG}>
      <PhoneTopBar mood="delighted" progress={progress} score={score} />
      <div style={{ position: "absolute", top: 138, left: 18 }}>
        <Basket
          items={basket}
          width={354}
          height={126}
          token={58}
          onItemTap={onBasketTap}
        />
      </div>

      <div
        style={{
          ...paper("50%", 13),
          position: "absolute",
          top: 300,
          left: 25,
          width: 340,
          height: 340,
          background: "#fff",
          boxSizing: "border-box",
        }}
      />
      {dish ? (
        <img
          src={dishAsset(dish)}
          alt=""
          width={250}
          height={250}
          draggable={false}
          style={{
            position: "absolute",
            top: 345,
            left: 70,
            pointerEvents: "none",
          }}
        />
      ) : (
        <svg
          width="250"
          height="250"
          viewBox="0 0 240 240"
          style={{ position: "absolute", top: 345, left: 70 }}
          fill="none"
          strokeLinecap="round"
        >
          {[
            { stroke: INK, width: 14 },
            { stroke: "#F2BE63", width: 7 },
          ].map((layer) => (
            <g
              key={layer.stroke}
              stroke={layer.stroke}
              strokeWidth={layer.width}
            >
              <ellipse cx="120" cy="124" rx="88" ry="74" />
              <ellipse
                cx="116"
                cy="120"
                rx="62"
                ry="80"
                transform="rotate(30 116 120)"
              />
              <path d="M40 128 Q70 54 140 66 Q206 84 192 150 Q170 204 108 196 Q52 186 62 136" />
              <ellipse cx="124" cy="118" rx="50" ry="40" />
            </g>
          ))}
          <path
            d="M86 96 Q100 72 128 80 Q160 84 162 112 Q164 146 130 152 Q96 158 84 132 Q78 112 86 96Z"
            fill={TOMATO}
            stroke={INK}
            strokeWidth="5"
          />
          <circle
            cx="104"
            cy="104"
            r="15"
            fill="#C9803F"
            stroke={INK}
            strokeWidth="5"
          />
          <circle
            cx="140"
            cy="100"
            r="14"
            fill="#C9803F"
            stroke={INK}
            strokeWidth="5"
          />
          <circle
            cx="124"
            cy="134"
            r="15"
            fill="#C9803F"
            stroke={INK}
            strokeWidth="5"
          />
          <circle cx="99" cy="99" r="4" fill="#fff" />
          <circle cx="119" cy="129" r="4" fill="#fff" />
          <ellipse
            cx="150"
            cy="130"
            rx="10"
            ry="6"
            transform="rotate(-30 150 130)"
            fill="#2FA84F"
            stroke={INK}
            strokeWidth="4"
          />
          <ellipse
            cx="96"
            cy="136"
            rx="9"
            ry="5.5"
            transform="rotate(25 96 136)"
            fill="#2FA84F"
            stroke={INK}
            strokeWidth="4"
          />
        </svg>
      )}
      <Sparkle
        kind="star"
        color={SUN}
        size={40}
        style={{ position: "absolute", left: 36, top: 300 }}
      />
      <Sparkle
        kind="plus"
        color={PINK}
        size={26}
        style={{ position: "absolute", right: 36, top: 620 }}
      />

      <StoreButton bottom={40} onClick={onStore} />
      <TrashButton
        dashed={basket.length > 0}
        position={{ right: 22, bottom: 40 }}
        onClick={onTrash}
      />
      <GreenPill
        onClick={onServe}
        streak={{ left: 28, width: 40 }}
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          bottom: 30,
          width: 176,
          height: 84,
          borderRadius: 42,
          font: lilita(46),
        }}
      >
        Serve!
      </GreenPill>
    </PhoneShell>
  );
}

/* --------------------------------- Robbed --------------------------------- */

export function RobbedScreen({
  framed,
  score,
  progress,
  basket,
  goneIndex,
  thief,
  panItem = "steak",
}: Common & {
  /** Basket as it was before the steal; `goneIndex` is the stolen slot. */
  basket: string[];
  goneIndex: number;
  thief: { name: string; color: string };
  panItem?: string;
}) {
  const stolen = basket[goneIndex];
  return (
    <PhoneShell framed={framed} background={COUNTER_BG}>
      <PhoneTopBar mood="panicked" progress={progress} score={score} />
      <div style={{ position: "absolute", top: 138, left: 18 }}>
        <Basket
          items={basket}
          gone={goneIndex}
          width={354}
          height={126}
          token={58}
        />
      </div>

      <Burner
        top={366}
        left={30}
        outer={330}
        dashInset={20}
        pan={{ top: 398, left: 62, size: 266 }}
        handle={{ left: 276, top: 632, width: 110, height: 38, knob: false }}
        inner={{ top: 436, left: 100, size: 190 }}
      />
      <div style={{ position: "absolute", left: 130, top: 460 }}>
        <IngredientIcon id={panItem} size={130} rotate={14} sticker={false} />
      </div>
      <HintArrow
        width={200}
        height={120}
        style={{ left: 96, top: 400 }}
        arc="M40 100 Q60 16 150 30"
        head="M130 12 L154 30 L132 50"
      />

      <div
        style={{
          ...paper(28, 14),
          position: "absolute",
          top: 282,
          left: 26,
          right: 26,
          zIndex: 7,
          transform: "rotate(-3deg)",
          background: SUN,
          padding: "8px 14px 10px 10px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            ...paper("50%", 15),
            width: 44,
            height: 44,
            flexShrink: 0,
            background: thief.color,
            boxSizing: "border-box",
          }}
        />
        <span style={{ flex: 1, font: lilita(29, 1.05) }}>
          {thief.name} stole your{" "}
          {stolen ? ingredientName(stolen).toLowerCase() : "food"}!
        </span>
      </div>

      <svg
        width="70"
        height="150"
        viewBox="0 0 70 150"
        style={{ position: "absolute", left: 92, top: 0, zIndex: 6 }}
      >
        <path
          d="M50 10 L30 40 M60 50 L34 70 M56 96 L30 110"
          stroke={INK}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
      <svg
        width="70"
        height="150"
        viewBox="0 0 70 150"
        style={{ position: "absolute", left: 288, top: 0, zIndex: 6 }}
      >
        <path
          d="M20 10 L40 40 M10 50 L36 70 M14 96 L40 110"
          stroke={INK}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
      <svg
        width="180"
        height="230"
        viewBox="0 0 180 230"
        style={{ position: "absolute", left: 125, top: -14, zIndex: 6 }}
        stroke={INK}
        strokeWidth="5"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d="M52 0 L128 0 L122 100 L58 100Z" fill={thief.color} />
        <path d="M55 30 L125 30 M57 62 L123 62" stroke="#fff" strokeWidth="9" />
        <rect x="48" y="94" width="84" height="22" rx="10" fill="#fff" />
        <path
          d="M50 116 Q46 160 72 176 L110 176 Q136 160 130 116Z"
          fill="#FFD9B8"
        />
      </svg>
      {stolen && (
        <div style={{ position: "absolute", left: 162, top: 128, zIndex: 6 }}>
          <IngredientIcon id={stolen} size={100} rotate={-14} />
        </div>
      )}
      <svg
        width="180"
        height="230"
        viewBox="0 0 180 230"
        style={{ position: "absolute", left: 125, top: -14, zIndex: 6 }}
        stroke={INK}
        strokeWidth="4.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <rect x="58" y="152" width="17" height="48" rx="8.5" fill="#FFD9B8" />
        <rect x="77" y="156" width="17" height="54" rx="8.5" fill="#FFD9B8" />
        <rect x="96" y="156" width="17" height="52" rx="8.5" fill="#FFD9B8" />
        <rect x="115" y="150" width="16" height="42" rx="8" fill="#FFD9B8" />
        <path d="M50 130 Q30 156 46 186" strokeWidth="18" fill="none" />
        <path
          d="M50 130 Q30 156 46 186"
          stroke="#FFD9B8"
          strokeWidth="9"
          fill="none"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          right: 14,
          top: 150,
          zIndex: 8,
          transform: "rotate(12deg)",
          width: 96,
          height: 96,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="96"
          height="96"
          viewBox="0 0 100 100"
          style={{ position: "absolute", inset: 0 }}
        >
          <polygon
            points="50,2 60,24 84,12 76,38 98,50 76,62 84,88 60,76 50,98 40,76 16,88 24,62 2,50 24,38 16,12 40,24"
            fill="#fff"
            stroke={INK}
            strokeWidth="5"
            strokeLinejoin="round"
          />
        </svg>
        <span
          style={{
            position: "relative",
            font: lilita(22, 1),
            color: TOMATO,
            WebkitTextStroke: `5px ${INK}`,
            paintOrder: "stroke fill",
          }}
        >
          Yoink!
        </span>
      </div>

      <StoreButton />
      <TrashButton position={{ right: 22, bottom: 30 }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 52,
          pointerEvents: "none",
          boxShadow: "inset 0 0 0 8px rgba(242,85,61,.85)",
        }}
      />
    </PhoneShell>
  );
}

/* ------------------------- Design mocks (dev switcher) ------------------------ */

export function RacePhoneStore() {
  return (
    <StoreScreen
      score={1800}
      progress={20}
      aisleName="DAIRY"
      aisleIndex={1}
      aisleCount={6}
      shelf={[
        { kind: "cheese", size: 84, rot: -4 },
        null,
        { kind: "milk", size: 84, rot: 3 },
        { kind: "cream", size: 80, rot: -3 },
        { kind: "yogurt", size: 80, rot: -3 },
        { kind: "egg", size: 78, rot: 6 },
      ]}
      basket={["tomato", "garlic", "bread"]}
      illustrateDrag="butter"
    />
  );
}

export function RacePhoneChop() {
  return (
    <ChopScreen
      score={1800}
      progress={45}
      basket={["steak", "garlic", "chicken", "bread"]}
      queue={["tomato", "tomato", "carrot", "onion"]}
      current={2}
      chops={2}
    />
  );
}

export function RacePhoneStove() {
  return (
    <StoveScreen
      score={2150}
      progress={70}
      basket={["chicken", "bread", "lemon"]}
      panItems={["steak", "garlic", "tomato"]}
      gesture="stir"
    />
  );
}

export function RacePhonePlating() {
  return <PlatingScreen score={2400} progress={94} basket={["garlic"]} />;
}

export function RacePhoneRobbed() {
  return (
    <RobbedScreen
      score={2150}
      progress={60}
      basket={["chicken", "tomato", "bread"]}
      goneIndex={1}
      thief={{ name: "Jun", color: TOMATO }}
    />
  );
}
