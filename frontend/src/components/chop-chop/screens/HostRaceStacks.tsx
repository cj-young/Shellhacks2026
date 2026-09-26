import { useLayoutEffect, useRef, useState } from "react";
import type React from "react";
import {
  CARD_BG,
  DOT,
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

export type ShopItem = { kind: string; rot: number; done: boolean };

export type RaceStack = {
  id: string;
  name: string;
  color: string;
  /** 1-based index of the recipe this player is on. */
  recipe: number;
  recipeName: string;
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
  [ROYAL]: "#DCE6FF",
  [TOMATO]: "#FFE1DA",
  "#159A6B": "#D4F1E3",
  [PINK]: "#FFE4EF",
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
    color: "#159A6B",
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
}

const COLUMN_WIDTH = 460;
const SIDE_MARGIN = 40;

/** Fills its parent; blocks are authored at the design's pixel values and zoomed to fit. */
export function HostRaceStacks({
  stacks = DEMO_STACKS,
  totalRecipes = 5,
  secondsLeft = 60,
  banner,
}: HostRaceStacksProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

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
        backgroundImage: `radial-gradient(${DOT} ${2.5 * scale}px, transparent ${3 * scale}px)`,
        backgroundSize: `${40 * scale}px ${40 * scale}px`,
        fontFamily: "Nunito, sans-serif",
        color: INK,
      }}
    >
      {size && (
        <div
          style={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
          <div
            style={{
              height: 186 * scale,
              display: "flex",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <div style={{ zoom: scale, paddingTop: 22 }}>
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
              {stacks.map((s) => (
                <div key={s.id} style={{ zoom: scale, justifySelf: "center" }}>
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
            {stacks.map((s) => (
              <div key={s.id} style={{ zoom: scale, justifySelf: "center" }}>
                <PlayerTab stack={s} />
              </div>
            ))}
          </div>
        </div>
      )}

      {size && banner && (
        <div
          style={{
            position: "absolute",
            left: 24 * scale,
            top: 24 * scale,
            zoom: scale,
            background: "#fff",
            border: `4px solid ${INK}`,
            borderRadius: 22,
            padding: "6px 18px",
            boxShadow: "0 6px 0 rgba(43,42,107,.16)",
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
          width: 240,
          height: 156,
          borderRadius: "46% 54% 50% 50% / 56% 48% 52% 44%",
          background: SUN,
          border: `6px solid ${INK}`,
          boxShadow: "0 0 0 10px #fff,0 18px 0 10px rgba(43,42,107,.16)",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "rotate(2deg)",
          position: "relative",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 34,
            top: 20,
            width: 44,
            height: 13,
            borderRadius: 7,
            background: "#fff",
            opacity: 0.7,
            transform: "rotate(-14deg)",
          }}
        />
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
        filter: "drop-shadow(0 8px 0 rgba(43,42,107,.16))",
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
              width: now ? 66 : 50,
              height: now ? 66 : 50,
              borderRadius: "50%",
              background: done ? LEAF : now ? color : "#fff",
              border: `${now ? 5 : 4}px solid ${INK}`,
              boxShadow: now
                ? "0 0 0 5px #fff,0 6px 0 5px rgba(43,42,107,.16)"
                : "none",
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
              borderRadius: 30,
              background: it.done ? "#E3F5E8" : "#fff",
              border: `4px solid ${it.done ? LEAF : DOT}`,
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
                  position: "absolute",
                  right: -12,
                  top: -12,
                  width: 62,
                  height: 62,
                  borderRadius: "50%",
                  background: LEAF,
                  border: `5px solid ${INK}`,
                  boxShadow: "0 0 0 5px #fff",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: "rotate(8deg)",
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
            position: "relative",
            width: 270,
            height: 270,
            borderRadius: "50%",
            background: tintFor(stack.color),
            border: `5px solid ${INK}`,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isChop && (
            <div
              style={{
                position: "absolute",
                left: 34,
                right: 34,
                bottom: 52,
                height: 62,
                borderRadius: 18,
                background: "#E9A866",
                border: `5px solid ${INK}`,
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  right: 14,
                  top: 16,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: `4px solid ${INK}`,
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
  const isShop = stack.phase === "shop";
  const tint = tintFor(stack.color);
  const backCard: React.CSSProperties = {
    position: "absolute",
    height: 220,
    background: tint,
    border: `5px solid ${INK}`,
    borderRadius: 32,
    boxShadow: "0 10px 0 rgba(43,42,107,.12)",
    padding: "10px 20px",
    boxSizing: "border-box",
  };
  const nextLabel = { font: lilita(26), opacity: 0.45 };

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
          background: CARD_BG,
          border: `5px solid ${INK}`,
          borderRadius: 38,
          boxShadow: `0 0 0 9px ${stack.color},0 18px 0 9px rgba(43,42,107,.16)`,
          padding: "22px 24px 24px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 14,
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
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: isShop ? SKY : SUN,
              border: `4px solid ${INK}`,
              borderRadius: 26,
              padding: "2px 18px 2px 6px",
              transform: "rotate(-3deg)",
              boxShadow: "0 6px 0 rgba(43,42,107,.16)",
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
    </div>
  );
}

function PlayerTab({ stack }: { stack: RaceStack }) {
  return (
    <div
      style={{
        width: 392,
        height: 122,
        marginBottom: -8,
        background: tintFor(stack.color),
        border: `5px solid ${INK}`,
        borderBottom: "none",
        borderRadius: "38px 38px 0 0",
        boxSizing: "border-box",
        padding: "0 22px 8px",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          flexShrink: 0,
          borderRadius: "50%",
          background: stack.color,
          border: `5px solid ${INK}`,
          boxShadow: "0 0 0 5px #fff",
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          background: "#fff",
          border: `5px solid ${INK}`,
          borderRadius: 34,
          boxShadow: `0 0 0 5px ${stack.color}`,
          padding: "4px 20px",
          boxSizing: "border-box",
          font: lilita(44, 1.1),
          textAlign: "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {stack.name}
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
