import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type React from "react";
import {
  CARD_BG,
  INK,
  LEAF,
  PAGE_BG,
  PINK,
  ROYAL,
  SKY,
  SUN,
  TOMATO,
  lilita,
  nunito,
} from "../design";
import { IngredientIcon } from "../IngredientIcon";
import { dishAsset } from "#/data/menu";
import type { Gesture, MenuRecipe } from "#/data/menu";
import { GameIcon } from "../race";
import { KitchenBackground } from "../KitchenBackground";
import { Countdown } from "../Countdown";
import { characterImage } from "#/data/characters";

import { paper } from "#/components/chop-chop/paper";
export type ShopItem = { kind: string; rot: number; done: boolean };

export type RaceStack = {
  id: string;
  name: string;
  color: string;
  /** 1-based index of the recipe this player is on. */
  recipe: number;
  recipeName: string;
  /** Every recipe in the round is done; the card stays in its finished state. */
  allDone?: boolean;
  /** Chef picked in the lobby; shown in the tab's avatar circle. */
  character?: string | null;
  /** Current score, shown on the tab. */
  points?: number;
} & (
  | { phase: "shop"; items: ShopItem[] }
  | {
      phase: "prep";
      gesture: Gesture;
      /** Recipe id, used to show the finished dish on the PLATE step. */
      dish?: string;
      gestureName: string;
      stepLabel: string;
      /** 1-based current step. */
      step: number;
      steps: number;
    }
);

/** Card tint for each player color (from the design's stacks). */
const TINTS: Record<string, string> = {
  [ROYAL]: "#FFE7A0",
  [TOMATO]: "#FFE1DA",
  "#0F7F3F": "#D4F1E3",
  [PINK]: "#FFE3CC",
  [SUN]: "#FFF3C2",
};
const tintFor = (color: string) => TINTS[color] ?? CARD_BG;
/** Light player colors need navy step numbers; dark ones get white with a navy stroke. */
const tokenFgFor = (color: string) =>
  color === PINK || color === SUN ? INK : "#fff";

const shopItems = (doneKinds: string[]): ShopItem[] =>
  (
    [
      ["garlic", -6],
      ["steak", 5],
      ["chicken", -4],
      ["tomato", 6],
    ] as [string, number][]
  ).map(([kind, rot]) => ({ kind, rot, done: doneKinds.includes(kind) }));

export const DEMO_STACKS: RaceStack[] = [
  {
    id: "mina",
    name: "Mina",
    color: ROYAL,
    recipe: 3,
    recipeName: "Chicken Stir-fry",
    phase: "prep",
    gesture: "stir",
    gestureName: "STIR!",
    stepLabel: "Circle on your phone",
    step: 3,
    steps: 5,
  },
  {
    id: "jun",
    name: "Jun",
    color: TOMATO,
    recipe: 2,
    recipeName: "Garlic Steak & Chicken",
    phase: "shop",
    items: shopItems(["garlic"]),
  },
  {
    id: "ari",
    name: "Ari",
    color: "#0F7F3F",
    recipe: 2,
    recipeName: "Garlic Steak & Chicken",
    phase: "shop",
    items: shopItems(["garlic", "steak", "tomato"]),
  },
  {
    id: "leo",
    name: "Leo",
    color: PINK,
    recipe: 2,
    recipeName: "Garlic Steak & Chicken",
    phase: "prep",
    gesture: "chop",
    gestureName: "CHOP!",
    stepLabel: "Swipe on your phone",
    step: 2,
    steps: 5,
  },
];

interface HostRaceStacksProps {
  stacks?: RaceStack[];
  totalRecipes?: number;
  secondsLeft?: number;
  /** Small label in the top-left corner, e.g. to mark demo data. */
  banner?: string;
  /** Start with a 3-2-1 countdown, then dim the kitchen and deal the cards in. */
  intro?: boolean;
}

type IntroStage = "count" | "deal" | "live";
const COUNT_FROM = 3;
/** How long the deal-in animation runs before cards settle. */
const DEAL_MS = 1600;

const RACE_CSS = `
@keyframes rsDeal {
  0% { transform: translateY(110vh) rotate(-10deg); }
  70% { transform: translateY(-14px) rotate(1.5deg); }
  100% { transform: none; }
}
@keyframes rsTabIn { from { transform: translateY(160px); } to { transform: none; } }
@keyframes rsDrop {
  0% { transform: translateY(-220px); }
  70% { transform: translateY(8px); }
  100% { transform: none; }
}
@keyframes rsFlip {
  0% { transform: rotateY(0) scale(1); }
  50% { transform: rotateY(90deg) scale(1.05); }
  100% { transform: rotateY(180deg) scale(1); }
}
@keyframes rsNext {
  from { transform: translateY(-34px) rotate(2.5deg) scale(.95); }
  to { transform: none; }
}
@keyframes rsDoneIn {
  from { opacity: 0; transform: scale(.85); }
  to { opacity: 1; transform: none; }
}
@keyframes rsCheckPop {
  0% { transform: scale(0) rotate(-30deg); }
  70% { transform: scale(1.12) rotate(4deg); }
  100% { transform: scale(1) rotate(0); }
}
@keyframes rsCheckDraw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes rsToast {
  0% { transform: translateY(40px) scale(.5); opacity: 0; }
  14% { transform: translateY(-10px) scale(1.12); opacity: 1; }
  22% { transform: translateY(0) scale(1); }
  78% { transform: translateY(-18px); opacity: 1; }
  100% { transform: translateY(-46px); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .rs-anim { animation: none !important; }
}
`;

const COLUMN_WIDTH = 460;
const SIDE_MARGIN = 40;

/** Fills its parent; blocks are authored at the design's pixel values and zoomed to fit. */
export function HostRaceStacks({
  stacks = DEMO_STACKS,
  totalRecipes = 5,
  secondsLeft = 60,
  banner,
  intro = false,
}: HostRaceStacksProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [introStage, setIntroStage] = useState<IntroStage>(
    intro ? "count" : "live",
  );
  // The Countdown component moves "count" on to "deal"; then the cards settle.
  useEffect(() => {
    if (introStage === "deal") {
      const id = setTimeout(() => setIntroStage("live"), DEAL_MS);
      return () => clearTimeout(id);
    }
  }, [introStage]);

  const counting = introStage === "count";
  const dealing = introStage === "deal";

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const update = () => setSize({ w: root.clientWidth, h: root.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const columns = Math.max(1, stacks.length);
  const designWidth = SIDE_MARGIN * 2 + COLUMN_WIDTH * Math.max(columns, 4);
  const scale = size ? Math.min(size.w / designWidth, size.h / 1080) : 1;
  const grid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${columns},minmax(0,1fr))`,
    padding: `0 ${SIDE_MARGIN * scale}px`,
  };

  return (
    <div
      ref={rootRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: PAGE_BG,
        fontFamily: "Nunito, sans-serif",
        color: INK,
      }}
    >
      <style>{RACE_CSS}</style>
      <KitchenBackground />
      {/* Warm dim over the kitchen once play starts, so the cards read clearly. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(rgba(120,32,16,.30), rgba(80,22,12,.42))",
          opacity: counting ? 0 : 1,
          transition: "opacity 700ms ease-out",
        }}
      />

      {size && counting && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ zoom: scale }}>
            <Countdown
              from={COUNT_FROM}
              cardWidth={250}
              onDone={() => setIntroStage("deal")}
            />
          </div>
        </div>
      )}

      {size && !counting && (
        <div
          style={{
            position: "relative",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              height: 186 * scale,
              display: "flex",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <div
              className="rs-anim"
              style={{
                zoom: scale,
                paddingTop: 22,
                animation: dealing
                  ? "rsDrop 600ms cubic-bezier(.2,1.2,.4,1) both"
                  : undefined,
              }}
            >
              <Timer secondsLeft={secondsLeft} />
            </div>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ ...grid, width: "100%" }}>
              {stacks.map((s, i) => (
                <div
                  key={s.id}
                  className="rs-anim"
                  style={{
                    zoom: scale,
                    justifySelf: "center",
                    animation: dealing
                      ? `rsDeal 750ms ${150 + i * 140}ms cubic-bezier(.2,1,.35,1) both`
                      : undefined,
                  }}
                >
                  <RecipeStack stack={s} totalRecipes={totalRecipes} />
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              ...grid,
              height: 114 * scale,
              flexShrink: 0,
              alignItems: "start",
            }}
          >
            {stacks.map((s, i) => (
              <div
                key={s.id}
                className="rs-anim"
                style={{
                  zoom: scale,
                  justifySelf: "center",
                  animation: dealing
                    ? `rsTabIn 500ms ${350 + i * 140}ms cubic-bezier(.2,1.2,.4,1) both`
                    : undefined,
                }}
              >
                <PlayerTab stack={s} />
              </div>
            ))}
          </div>
        </div>
      )}

      {size && banner && (
        <div
          style={{
            ...paper(22, 0),
            position: "absolute",
            left: 24 * scale,
            top: 24 * scale,
            zoom: scale,
            background: "#fff",
            padding: "6px 18px",
            font: nunito(800, 22),
          }}
        >
          {banner}
        </div>
      )}
    </div>
  );
}

function Timer({ secondsLeft }: { secondsLeft: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
      <Hourglass />
      <div
        style={{
          ...paper("46% 54% 50% 50% / 56% 48% 52% 44%", 1),
          width: 240,
          height: 156,
          background: SUN,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "rotate(2deg)",
          position: "relative",
        }}
      >
        <span style={{ font: lilita(132, 1), paddingTop: 6 }}>
          {secondsLeft}
        </span>
      </div>
    </div>
  );
}

function Tick({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12">
      <path
        d="M2 6 L5 9 L10 3"
        stroke={INK}
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Hourglass() {
  return (
    <svg
      width="92"
      height="124"
      viewBox="0 0 92 124"
      style={{
        transform: "rotate(-10deg)",
        filter: "drop-shadow(0 8px 0 rgba(122,78,30,.16))",
      }}
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
      <path d="M28 40 H64 Q60 52 46 58 Q32 52 28 40Z" fill={SUN} />
      <path
        d="M46 66 L46 80"
        stroke={SUN}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M24 98 Q46 80 68 98Z"
        fill={SUN}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepTokens({
  current,
  total,
  color,
}: {
  current: number;
  total: number;
  color: string;
}) {
  const fg = tokenFgFor(color);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        height: 72,
      }}
    >
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const done = n < current;
        const now = n === current;
        return (
          <div
            key={n}
            style={{
              ...paper("50%", 2),
              width: now ? 66 : 50,
              height: now ? 66 : 50,
              background: done ? LEAF : now ? color : "#fff",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: done || now ? 1 : 0.6,
            }}
          >
            {done ? (
              <Tick size={26} />
            ) : (
              <span
                style={{
                  font: lilita(now ? 38 : 28, 1),
                  color: now ? fg : INK,
                  WebkitTextStroke: `${now && fg === "#fff" ? 6 : 0}px ${INK}`,
                  paintOrder: "stroke fill",
                }}
              >
                {n}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ShopGrid({ items }: { items: ShopItem[] }) {
  const inBasket = items.filter((it) => it.done).length;
  return (
    <>
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: 18,
          minHeight: 0,
        }}
      >
        {items.map((it) => (
          <div
            key={it.kind}
            style={{
              position: "relative",
              ...paper(30, 27),
              background: it.done ? "#E3F5E8" : "#fff",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IngredientIcon id={it.kind} size={124} rotate={it.rot} />
            {it.done && (
              <div
                style={{
                  ...paper("50%", 3),
                  position: "absolute",
                  right: -12,
                  top: -12,
                  width: 62,
                  height: 62,
                  background: LEAF,
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: "rotate(3deg)",
                }}
              >
                <Tick size={34} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          font: nunito(900, 26),
        }}
      >
        <GameIcon kind="basket" size={38} sticker={false} />
        {inBasket} of {items.length} in basket
      </div>
    </>
  );
}

function PrepPanel({
  stack,
}: {
  stack: Extract<RaceStack, { phase: "prep" }>;
}) {
  const isChop = stack.gesture === "chop";
  return (
    <>
      <StepTokens
        current={stack.step}
        total={stack.steps}
        color={stack.color}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 0,
        }}
      >
        <div
          style={{
            ...paper("50%", 4),
            position: "relative",
            width: 270,
            height: 270,
            background: tintFor(stack.color),
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isChop && (
            <div
              style={{
                ...paper(18, 5),
                position: "absolute",
                left: 34,
                right: 34,
                bottom: 52,
                height: 62,
                background: "#E9A866",
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  ...paper("50%", 6),
                  position: "absolute",
                  right: 14,
                  top: 16,
                  width: 14,
                  height: 14,
                }}
              />
            </div>
          )}
          {stack.gesture === "plate" ? (
            stack.dish && (
              <img
                src={dishAsset(stack.dish)}
                alt=""
                width={210}
                height={210}
                style={{ position: "relative" }}
              />
            )
          ) : (
            <GameIcon
              kind={stack.gesture}
              size={200}
              style={{ position: "relative" }}
            />
          )}
          {isChop && (
            <svg
              width="250"
              height="50"
              viewBox="0 0 250 50"
              style={{ position: "absolute", left: 10, bottom: -26 }}
            >
              <path
                d="M30 25 H220"
                stroke="#fff"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <path
                d="M30 25 H220 M42 10 L24 25 L42 40 M208 10 L226 25 L208 40"
                fill="none"
                stroke={INK}
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
      <div
        style={{
          textAlign: "center",
          font: lilita(84, 0.9),
          color: stack.color,
          WebkitTextStroke: `10px ${INK}`,
          paintOrder: "stroke fill",
          textShadow: `0 7px 0 ${INK}`,
          transform: "rotate(-2deg)",
        }}
      >
        {stack.gestureName}
      </div>
      <div style={{ textAlign: "center", font: nunito(900, 22) }}>
        {stack.stepLabel}
      </div>
    </>
  );
}

function RecipeStack({
  stack,
  totalRecipes,
}: {
  stack: RaceStack;
  totalRecipes: number;
}) {
  const tint = tintFor(stack.color);
  const backCard: React.CSSProperties = {
    ...paper(32, 7),
    position: "absolute",
    height: 220,
    background: tint,
    padding: "10px 20px",
    boxSizing: "border-box",
  };
  const nextLabel = { font: lilita(26), opacity: 0.45 };

  // The last card shown, so changes can animate from it.
  const lastRef = useRef(stack);
  const [flipFrom, setFlipFrom] = useState<RaceStack | null>(null);
  const [doneFrom, setDoneFrom] = useState<RaceStack | null>(null);
  const [entering, setEntering] = useState(false);
  /** Points shown in the "+N pts" toast for the recipe just finished. */
  const [gained, setGained] = useState(0);
  const moveKey = `${stack.recipe}:${stack.phase}:${stack.allDone ? 1 : 0}`;

  // Runs before the effect below updates lastRef, so lastRef is the old card.
  useEffect(() => {
    const prev = lastRef.current;
    if (prev.recipe < stack.recipe || (stack.allDone && !prev.allDone)) {
      // Recipe finished: celebrate on the old card, then bring the next one forward.
      setFlipFrom(null);
      setDoneFrom(prev);
      // Score can land a moment after the recipe moves on; fall back to a recipe's worth.
      const delta = (stack.points ?? 0) - (prev.points ?? 0);
      setGained(delta > 0 ? delta : POINTS_PER_RECIPE);
      const id = setTimeout(() => {
        setDoneFrom(null);
        setEntering(!stack.allDone);
      }, DONE_MS);
      return () => clearTimeout(id);
    }
    if (
      prev.recipe === stack.recipe &&
      prev.phase === "shop" &&
      stack.phase === "prep"
    ) {
      // Shopping done: flip the card over to its gesture side.
      setFlipFrom(prev);
      const id = setTimeout(() => setFlipFrom(null), FLIP_MS);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveKey]);
  useEffect(() => {
    lastRef.current = stack;
  });
  useEffect(() => {
    if (!entering) return;
    const id = setTimeout(() => setEntering(false), ENTER_MS);
    return () => clearTimeout(id);
  }, [entering]);

  const front = doneFrom ?? flipFrom ?? stack;
  const finished = doneFrom !== null || Boolean(stack.allDone);

  return (
    <div style={{ position: "relative", width: 392, height: 732 }}>
      {stack.recipe + 2 <= totalRecipes && (
        <div
          style={{
            ...backCard,
            top: 0,
            left: 34,
            right: 34,
            transform: "rotate(-3deg)",
          }}
        >
          <span style={nextLabel}>{stack.recipe + 2}</span>
        </div>
      )}
      {stack.recipe + 1 <= totalRecipes && (
        <div
          style={{
            ...backCard,
            top: 22,
            left: 16,
            right: 16,
            transform: "rotate(2.5deg)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <span style={nextLabel}>{stack.recipe + 1}</span>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: 52,
          left: 0,
          right: 0,
          bottom: 0,
          perspective: 1800,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            animation: flipFrom
              ? `rsFlip ${FLIP_MS}ms cubic-bezier(.45,.05,.3,1) both`
              : entering
                ? `rsNext ${ENTER_MS}ms cubic-bezier(.2,1.3,.4,1) both`
                : undefined,
          }}
        >
          <CardFace stack={front} totalRecipes={totalRecipes} />
          {flipFrom && (
            <CardFace stack={stack} totalRecipes={totalRecipes} back />
          )}
        </div>
        {finished && (
          <DoneStamp
            label={stack.allDone ? "All done!" : "Order up!"}
            animate={doneFrom !== null}
          />
        )}
      </div>

      {doneFrom && (
        <div
          className="rs-anim"
          style={{
            position: "absolute",
            top: -18,
            left: 0,
            right: 0,
            zIndex: 5,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
            animation: `rsToast ${DONE_MS}ms ease-out both`,
          }}
        >
          <div
            style={{
              ...paper(22, 5),
              background: SUN,
              padding: "6px 26px",
              font: lilita(46, 1.1),
              transform: "rotate(-3deg)",
              whiteSpace: "nowrap",
            }}
          >
            +{gained} pts
          </div>
        </div>
      )}
    </div>
  );
}

/** Matches the server's points for a finished recipe. */
const POINTS_PER_RECIPE = 100;
const FLIP_MS = 750;
const DONE_MS = 1800;
const ENTER_MS = 520;
/** Gesture (prep) side of the card: a warmer paper than the shopping side. */
const PREP_BG = "#FFE2C6";

/** One side of a recipe card: shopping list or the current gesture step. */
function CardFace({
  stack,
  totalRecipes,
  back = false,
}: {
  stack: RaceStack;
  totalRecipes: number;
  /** The reverse side during a flip: pre-rotated so it faces front at 180°. */
  back?: boolean;
}) {
  const isShop = stack.phase === "shop";
  return (
    <div
      style={{
        ...paper(38, 8),
        position: "absolute",
        inset: 0,
        background: isShop ? CARD_BG : PREP_BG,
        padding: "22px 24px 24px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: back ? "rotateY(180deg)" : undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            ...paper(26, 9),
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: isShop ? SKY : LEAF,
            padding: "2px 18px 2px 6px",
            transform: "rotate(-3deg)",
            font: lilita(30, 1.2),
          }}
        >
          <GameIcon
            kind={isShop ? "basket" : "chop"}
            size={40}
            sticker={false}
          />
          {isShop ? "Shopping" : "Prep"}
        </div>
        <span style={{ font: lilita(28, 1) }}>
          {stack.recipe}
          <span style={{ opacity: 0.5 }}> / {totalRecipes}</span>
        </span>
      </div>
      <div style={{ font: "900 24px/1.15 Nunito", marginTop: -4 }}>
        {stack.recipeName}
      </div>

      {stack.phase === "shop" ? (
        <ShopGrid items={stack.items} />
      ) : (
        <PrepPanel stack={stack} />
      )}
    </div>
  );
}

/** Green "finished" state laid over a card, with a checkmark stamp. */
function DoneStamp({ label, animate }: { label: string; animate: boolean }) {
  return (
    <div
      style={{
        ...paper(38, 8, false),
        position: "absolute",
        inset: 0,
        background: "rgba(47,168,79,.94)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        color: CARD_BG,
        animation: animate
          ? "rsDoneIn 380ms cubic-bezier(.2,1.2,.4,1) both"
          : undefined,
      }}
    >
      <div
        style={{
          ...paper("50%", 3),
          width: 190,
          height: 190,
          background: CARD_BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: animate
            ? "rsCheckPop 520ms 160ms cubic-bezier(.3,1.6,.5,1) both"
            : undefined,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 24 24" aria-hidden>
          <path
            d="M5 12.5 L10 17.5 L19.5 7"
            fill="none"
            stroke={LEAF}
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            style={{
              strokeDasharray: 1,
              strokeDashoffset: 0,
              animation: animate
                ? "rsCheckDraw 420ms 420ms ease-out both"
                : undefined,
            }}
          />
        </svg>
      </div>
      <span
        style={{
          font: lilita(58, 1),
          transform: "rotate(-3deg)",
          animation: animate
            ? "rsDoneIn 380ms 300ms cubic-bezier(.2,1.2,.4,1) both"
            : undefined,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function PlayerTab({ stack }: { stack: RaceStack }) {
  return (
    <div
      style={{
        ...paper("38px 38px 0 0", 10),
        width: 392,
        height: 122,
        marginBottom: -8,
        background: tintFor(stack.color),
        borderBottom: "none",
        boxSizing: "border-box",
        padding: "0 22px 8px",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          ...paper("50%", 11),
          width: 80,
          height: 80,
          flexShrink: 0,
          overflow: "hidden",
          // White behind the chef art; the player's colour when there's no chef.
          background: stack.character ? "#fff" : stack.color,
          boxSizing: "border-box",
        }}
      >
        {stack.character && (
          // Full-body chef art, zoomed in on the face.
          <img
            src={characterImage(stack.character)}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              left: "50%",
              top: 4,
              width: 118,
              transform: "translateX(-50%)",
            }}
          />
        )}
      </div>
      <div
        style={{
          ...paper(34, 12, false),
          flex: 1,
          minWidth: 0,
          background: "#fff",
          boxShadow: "var(--paper-shadow)",
          padding: "4px 16px",
          boxSizing: "border-box",
          font: lilita(38, 1.1),
          textAlign: "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {stack.name}
      </div>
      <div
        style={{
          ...paper(24, 4),
          flexShrink: 0,
          background: SUN,
          padding: "2px 14px",
          display: "flex",
          alignItems: "baseline",
          gap: 4,
          transform: "rotate(3deg)",
        }}
      >
        <span style={{ font: lilita(34, 1.1) }}>{stack.points ?? 0}</span>
        <span style={{ font: nunito(900, 14), letterSpacing: ".08em" }}>
          PTS
        </span>
      </div>
    </div>
  );
}

const GESTURE_NAMES: Record<Gesture, string> = {
  chop: "CHOP!",
  stir: "STIR!",
  flip: "FLIP!",
  plate: "PLATE!",
};
const SHOP_ROTATIONS = [-6, 5, -4, 6];

/** Builds a player's card from menu data: shopping (with what's already in the basket) or a prep step. */
export function stackFor(
  player: { id: string; name: string; color: string },
  recipe: MenuRecipe,
  recipeNumber: number,
  progress:
    { phase: "shop"; inBasket: string[] } | { phase: "prep"; step: number },
): RaceStack {
  const base = { ...player, recipe: recipeNumber, recipeName: recipe.name };
  if (progress.phase === "shop") {
    return {
      ...base,
      phase: "shop",
      items: recipe.ingredients.map((kind, i) => ({
        kind,
        rot: SHOP_ROTATIONS[i % SHOP_ROTATIONS.length],
        done: progress.inBasket.includes(kind),
      })),
    };
  }
  const step = recipe.steps[Math.min(progress.step, recipe.steps.length) - 1];
  return {
    ...base,
    phase: "prep",
    gesture: step.gesture,
    dish: recipe.id,
    gestureName: GESTURE_NAMES[step.gesture],
    stepLabel: step.label,
    step: progress.step,
    steps: recipe.steps.length,
  };
}

/** Card animations on loop for the dev switcher: countdown, deal, flip, finish. */
export function RaceAnimationsPreview() {
  const [loop, setLoop] = useState(0);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    // After the intro (~4.6s): Jun flips to prep, Ari flips, Mina and Leo finish.
    const times = [6000, 7200, 8600, 10200, 14500];
    const ids = times.map((t, i) =>
      setTimeout(() => {
        if (i === times.length - 1) {
          setBeat(0);
          setLoop((n) => n + 1);
        } else setBeat(i + 1);
      }, t),
    );
    return () => ids.forEach(clearTimeout);
  }, [loop]);

  const prep = (s: RaceStack, label: string): RaceStack => ({
    ...s,
    phase: "prep",
    gesture: "chop",
    gestureName: "SLICE!",
    stepLabel: label,
    step: 1,
    steps: 5,
  });
  const next = (s: RaceStack): RaceStack => ({
    ...s,
    points: (s.points ?? 0) + 100,
    recipe: s.recipe + 1,
    recipeName: "Pancakes",
    phase: "shop",
    items: shopItems([]),
  });
  const CHEFS = ["cat", "bear", "panda", "cow"];
  const [mina, jun, ari, leo] = DEMO_STACKS.map((s, i) => ({
    ...s,
    character: CHEFS[i],
    points: (s.recipe - 1) * 100,
  }));
  const stacks = [
    beat >= 3 ? next(mina) : mina,
    beat >= 1 ? prep(jun, "Slice the garlic") : jun,
    beat >= 2 ? prep(ari, "Slice the steak") : ari,
    beat >= 4 ? next(leo) : leo,
  ];

  return (
    <HostRaceStacks
      key={loop}
      stacks={stacks}
      totalRecipes={5}
      secondsLeft={90}
      intro
    />
  );
}
